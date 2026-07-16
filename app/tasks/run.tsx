import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X, Zap, Play, Clock, Bell } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useEarnStore } from "../../src/stores/earnStore";
import { AiTask, TaskKind, CaptchaGenerator } from "../../src/types/tasks.types";
import {
  EARN_CATEGORIES,
  TASK_ECONOMY,
  formatCents,
  MICROTASK_CATEGORIES,
  taskLevelInfo,
} from "../../src/constants/taskEconomy";
import { generateCaptcha, sliderMatches, CaptchaPuzzle } from "../../src/data/aiTasksLocal";
import { InterstitialAdManager } from "../../src/ads/InterstitialAdManager";
import { RewardedAdManager } from "../../src/ads/RewardedAdManager";
import { JobInterstitialManager } from "../../src/ads/JobInterstitialManager";
import { NotificationService } from "../../src/notifications/NotificationService";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { ProgressBar } from "../../src/components/ui/ProgressBar";

/** Pressable slider track (no external deps): tap/drag sets 0–100. */
function SliderTrack({
  value,
  target,
  onChange,
}: {
  value: number;
  target: number;
  onChange: (v: number) => void;
}) {
  const [width, setWidth] = useState(1);
  const setFromX = (x: number) => onChange(Math.max(0, Math.min(100, Math.round((x / width) * 100))));
  return (
    <View className="mt-6">
      <View className="h-10 justify-center">
        <View
          className="absolute top-0 bottom-0 w-1.5 rounded-full bg-amber-400"
          style={{ left: `${target}%` }}
        />
        <View
          className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => setFromX(e.nativeEvent.locationX)}
          onResponderMove={(e) => setFromX(e.nativeEvent.locationX)}
        >
          <View className="h-3 bg-primary-500 rounded-full" style={{ width: `${value}%` }} />
        </View>
        <View
          pointerEvents="none"
          className="absolute w-7 h-7 rounded-full bg-primary-600 border-2 border-white shadow"
          style={{ left: `${value}%`, marginLeft: -14 }}
        />
      </View>
      <Text className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        Drag the blue handle onto the gold marker
      </Text>
    </View>
  );
}

type Toast = { correct: boolean; cents: number; xp: number; note?: string } | null;

// ─── Task-runner ad pacing ─────────────────────────────────────
// 2 rewarded ads unlock a tasking session; an interstitial fires after every
// 5 CORRECT answers (skipped when the segment wall's own interstitial is
// about to show); a wrong answer gates continuation behind a rewarded ad.
const START_ADS_REQUIRED = 2;
const CORRECT_STREAK_AD_EVERY = 5;

export default function TaskRunnerScreen() {
  const router = useRouter();
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const kind = (["microtask", "captcha", "annotation", "survey"].includes(kindParam ?? "")
    ? kindParam
    : "microtask") as TaskKind;
  const category = EARN_CATEGORIES.find((c) => c.id === kind) ?? EARN_CATEGORIES[0];

  const earn = useEarnStore();
  const feed = earn.getFeed(kind);

  // Session-consumed ids: a task leaves the queue the instant it's answered —
  // the next task renders immediately while the server settles in background.
  const [consumed, setConsumed] = useState<Set<string>>(new Set());
  const [sessionCents, setSessionCents] = useState(0);
  const [wall, setWall] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [wallMsg, setWallMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  // Session start gate: rewarded ads watched so far this session
  const [startAdsWatched, setStartAdsWatched] = useState(0);
  const [gateBusy, setGateBusy] = useState(false);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  // Wrong-answer gate: a rewarded ad is required to keep tasking
  const [wrongGate, setWrongGate] = useState(false);
  const [wrongBusy, setWrongBusy] = useState(false);
  const [wrongMsg, setWrongMsg] = useState<string | null>(null);
  // Correct answers since the last interstitial
  const correctStreak = useRef(0);

  // Captcha state — regenerated per round
  const captchaTasks = useMemo(() => (kind === "captcha" ? feed : []), [kind, feed.length]);
  const [captchaRound, setCaptchaRound] = useState(0);
  const captchaTask: AiTask | null =
    kind === "captcha" && captchaTasks.length > 0
      ? captchaTasks[captchaRound % captchaTasks.length]
      : null;
  const [puzzle, setPuzzle] = useState<CaptchaPuzzle | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const [captchaError, setCaptchaError] = useState(false);

  // Survey state
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<number[]>([]);

  const startedAt = useRef(Date.now());

  const task: AiTask | null =
    kind === "captcha" ? captchaTask : feed.find((t) => !consumed.has(t.id)) ?? null;

  // Preload the NEXT task's image while the user answers the current one.
  useEffect(() => {
    if (kind === "captcha" || !task) return;
    const next = feed.find((t) => !consumed.has(t.id) && t.id !== task.id);
    if (next?.content.image_url) Image.prefetch(next.content.image_url).catch(() => {});
  }, [task?.id, kind]);

  useEffect(() => {
    InterstitialAdManager.preload();
    RewardedAdManager.preload(); // start gate + wrong-answer gate both need one
  }, []);

  // Already at the segment limit when entering → straight to the ad wall.
  useEffect(() => {
    if (earn.tasksRemainingToday() <= 0) setWall(true);
  }, []);

  const exitRunner = () => {
    JobInterstitialManager.openJob(() => router.back());
  };

  useEffect(() => {
    if (kind === "captcha" && captchaTask) {
      const gen = (captchaTask.content.generator ?? "text") as CaptchaGenerator;
      setPuzzle(generateCaptcha(gen, captchaTask.content.images));
      setTextAnswer("");
      setSliderValue(0);
      setCaptchaError(false);
    }
    setSurveyStep(0);
    setSurveyAnswers([]);
    setImgLoading(true);
    setImgFailed(false);
    startedAt.current = Date.now();
  }, [kind, captchaRound, captchaTask?.id, task?.id]);

  const advance = () => {
    if (kind === "captcha") setCaptchaRound((r) => r + 1);
    // Non-captcha advances automatically: the answered task was consumed,
    // so `task` (first unconsumed) is already the next one.
  };

  const showToast = (t: Toast, ms = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  const pendingRef = useRef(0);

  /**
   * Instant flow: consume the task and show the next one IMMEDIATELY; the
   * server validation + wallet credit settle in the background and surface
   * as a floating toast. The ad wall raises the moment the segment is full.
   * If the server DIDN'T count an answer (limit reached / throttled after
   * retry), the task is put back in the queue so no work is ever lost.
   */
  const submit = (answered: AiTask, answer: any) => {
    // Segment already full (counting in-flight answers) → wall, don't submit.
    if (earn.tasksRemainingToday() - pendingRef.current <= 0) {
      setWall(true);
      return;
    }
    const duration = Date.now() - startedAt.current;
    pendingRef.current += 1;
    if (kind !== "captcha") {
      setConsumed((prev) => new Set(prev).add(answered.id));
    }
    advance();

    earn.completeTask(answered, answer, duration).then((result) => {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      if (!result.ok) {
        // Not recorded server-side → put the task back so it can be redone.
        if (kind !== "captcha") {
          setConsumed((prev) => {
            const next = new Set(prev);
            next.delete(answered.id);
            return next;
          });
        }
        if (result.error === "daily_limit") {
          setWall(true);
        } else {
          showToast(
            { correct: false, cents: 0, xp: 0, note: result.error ?? "Not counted — please retry" },
            2500
          );
        }
        return;
      }
      if (result.correct) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSessionCents((c) => c + result.rewardCents);
        showToast({ correct: true, cents: result.rewardCents, xp: result.xp });
        correctStreak.current += 1;
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast({ correct: false, cents: 0, xp: 0 });
        // Wrong answer → a rewarded ad is required to keep tasking.
        correctStreak.current = 0;
        setWrongGate(true);
      }
      // Segment full → ad wall (its own interstitial) before anything else.
      if (result.tasksToday >= result.allowedToday) {
        correctStreak.current = 0;
        setWall(true);
      } else if (result.correct && correctStreak.current >= CORRECT_STREAK_AD_EVERY) {
        // Every 5 correct answers → interstitial break.
        correctStreak.current = 0;
        setTimeout(() => {
          InterstitialAdManager.show();
        }, 600);
      }
    });

    // Surveys are a larger unit of work → natural interstitial moment.
    if (answered.kind === "survey") {
      setTimeout(() => JobInterstitialManager.openJob(() => {}), 700);
    }
  };

  const submitCaptcha = () => {
    if (!puzzle || !task) return;
    let solved = false;
    if (puzzle.sliderTarget != null) solved = sliderMatches(sliderValue, puzzle.sliderTarget);
    else if (typeof puzzle.answer === "string")
      solved = textAnswer.trim().toUpperCase() === puzzle.answer.toUpperCase();
    if (solved) {
      setCaptchaError(false);
      submit(task, { captcha: true, solved: true });
    } else {
      setCaptchaError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      correctStreak.current = 0;
      setWrongGate(true); // rewarded ad required to continue
      const gen = (task.content.generator ?? "text") as CaptchaGenerator;
      setTimeout(() => {
        setPuzzle(generateCaptcha(gen, task.content.images));
        setTextAnswer("");
        setSliderValue(0);
        setCaptchaError(false);
      }, 700);
    }
  };

  const selectCaptchaOption = (i: number) => {
    if (!puzzle || !task) return;
    if (i === puzzle.answer) submit(task, { captcha: true, solved: true });
    else {
      setCaptchaError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      correctStreak.current = 0;
      setWrongGate(true); // rewarded ad required to continue
      const gen = (task.content.generator ?? "selection") as CaptchaGenerator;
      setTimeout(() => {
        setPuzzle(generateCaptcha(gen, task.content.images));
        setCaptchaError(false);
      }, 700);
    }
  };

  const answerSurvey = (choice: number) => {
    if (!task?.content.questions) return;
    const answers = [...surveyAnswers, choice];
    if (answers.length >= task.content.questions.length) {
      submit(task, { responses: answers });
    } else {
      setSurveyAnswers(answers);
      setSurveyStep((s) => s + 1);
    }
  };

  /** Mandatory: the next segment stays locked until the interstitial shows. */
  const watchAdAndContinue = async () => {
    setAdBusy(true);
    setWallMsg(null);
    const shown = await InterstitialAdManager.show();
    if (!shown) {
      InterstitialAdManager.preload();
      setAdBusy(false);
      setWallMsg("Ad not ready yet — please try again in a moment.");
      return;
    }
    const res = await earn.unlockBatch();
    setAdBusy(false);
    if (!res.ok) {
      setWallMsg(res.error ?? "Could not unlock the next segment — try again.");
      return;
    }
    setWall(false);
  };

  /** Start gate: each tap plays one rewarded ad; 2 unlock the session. */
  const watchStartAd = async () => {
    setGateBusy(true);
    setGateMsg(null);
    const earned = await RewardedAdManager.show();
    setGateBusy(false);
    if (!earned) {
      RewardedAdManager.preload();
      setGateMsg("Ad not ready yet — please try again in a moment.");
      return;
    }
    setStartAdsWatched((n) => n + 1);
  };

  /** Wrong-answer gate: one rewarded ad resumes tasking. */
  const watchWrongAnswerAd = async () => {
    setWrongBusy(true);
    setWrongMsg(null);
    const earned = await RewardedAdManager.show();
    setWrongBusy(false);
    if (!earned) {
      RewardedAdManager.preload();
      setWrongMsg("Ad not ready yet — please try again in a moment.");
      return;
    }
    setWrongGate(false);
  };

  const enableNotifications = async () => {
    const granted = await NotificationService.requestPermission();
    setNotifMsg(granted ? "🔔 You'll be notified when new tasks drop!" : "Enable notifications in your device settings to get alerts.");
  };

  // ─── Progress numbers (server truth, updates after every settle) ─────
  const doneToday = earn.summary.today.tasksCompleted;
  const allowedToday = earn.summary.today.allowedToday;
  const segment = Math.floor(doneToday / TASK_ECONOMY.BATCH_SIZE) + 1;
  const inSegment = doneToday % TASK_ECONOMY.BATCH_SIZE;
  const segmentRemaining = Math.min(allowedToday, segment * TASK_ECONOMY.BATCH_SIZE) - doneToday;
  const level = taskLevelInfo(earn.summary.taskLevel);
  const atAdCap = earn.summary.today.adBatches >= TASK_ECONOMY.MAX_AD_BATCHES;

  // ─── Header (shared) ───────────────────────────────────────
  const Header = (
    <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
      <TouchableOpacity
        onPress={exitRunner}
        className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
      >
        <X size={18} color="#6B7280" />
      </TouchableOpacity>
      <View className="items-center">
        <Text className="text-base font-bold text-gray-900 dark:text-white">
          {category.emoji} {category.title}
        </Text>
        <Text className="text-[11px] text-gray-500 dark:text-gray-400">
          {kind === "captcha"
            ? `Segment ${segment} · ${Math.max(0, segmentRemaining)} to next unlock`
            : `${feed.filter((t) => !consumed.has(t.id)).length} tasks left · ${Math.max(0, segmentRemaining)} to next unlock`}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-emerald-500">+{formatCents(sessionCents)}</Text>
        <Text className="text-[10px] text-gray-400">this session</Text>
      </View>
    </View>
  );

  // Floating settle toast (never blocks the flow)
  const ToastView = toast && (
    <View
      pointerEvents="none"
      className={`absolute left-5 right-5 bottom-8 rounded-2xl px-4 py-3 flex-row items-center gap-2.5 ${
        toast.correct
          ? "bg-emerald-600"
          : "bg-gray-800"
      }`}
      style={{ elevation: 8, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10 }}
    >
      <Text className="text-lg">{toast.correct ? "✅" : "❌"}</Text>
      <Text className="text-white font-bold text-sm flex-1" numberOfLines={2}>
        {toast.note
          ? toast.note
          : toast.correct
            ? `+${formatCents(toast.cents)} · +${toast.xp} XP`
            : "Not quite — no reward for that one"}
      </Text>
    </View>
  );

  // ─── Session start gate: 2 rewarded ads unlock tasking ────
  if (task && startAdsWatched < START_ADS_REQUIRED) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
        {Header}
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 items-center">
            <Text className="text-5xl mb-3">🎬</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
              Ready to Earn?
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              Watch {START_ADS_REQUIRED} short ads to start your tasking session and unlock
              today's paid tasks.
            </Text>
            <View className="flex-row gap-2.5 my-5">
              {Array.from({ length: START_ADS_REQUIRED }).map((_, i) => (
                <View
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full ${
                    i < startAdsWatched ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={watchStartAd}
              disabled={gateBusy}
              className="bg-primary-600 rounded-2xl py-4 px-6 w-full flex-row items-center justify-center gap-2"
              activeOpacity={0.85}
            >
              {gateBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Play size={18} color="#fff" />
                  <Text className="text-white font-bold text-base">
                    Watch Ad {Math.min(startAdsWatched + 1, START_ADS_REQUIRED)} of {START_ADS_REQUIRED}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {gateMsg && (
              <Text className="text-xs text-red-500 mt-3 text-center font-semibold">{gateMsg}</Text>
            )}
            <TouchableOpacity onPress={exitRunner} className="mt-3 py-2">
              <Text className="text-gray-500 dark:text-gray-400 font-semibold">
                Back to AI Tasks
              </Text>
            </TouchableOpacity>
          </View>
          <View className="mt-4">
            <NativeAdCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Wrong-answer gate: rewarded ad to continue tasking ───
  if (wrongGate) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
        {Header}
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 items-center">
            <Text className="text-5xl mb-3">❌</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
              Wrong Answer
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              That answer wasn't correct, so no reward was earned. Watch a short ad to
              continue tasking — take your time on the next one!
            </Text>
            <TouchableOpacity
              onPress={watchWrongAnswerAd}
              disabled={wrongBusy}
              className="bg-primary-600 rounded-2xl py-4 px-6 w-full flex-row items-center justify-center gap-2 mt-5"
              activeOpacity={0.85}
            >
              {wrongBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Play size={18} color="#fff" />
                  <Text className="text-white font-bold text-base">Watch Ad & Continue</Text>
                </>
              )}
            </TouchableOpacity>
            {wrongMsg && (
              <Text className="text-xs text-red-500 mt-3 text-center font-semibold">{wrongMsg}</Text>
            )}
            <TouchableOpacity onPress={exitRunner} className="mt-3 py-2">
              <Text className="text-gray-500 dark:text-gray-400 font-semibold">
                Back to AI Tasks
              </Text>
            </TouchableOpacity>
          </View>
          <View className="mt-4">
            <NativeAdCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Mandatory segment ad wall (interstitial) ──────────────
  if (wall) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
        {Header}
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 items-center">
            <Text className="text-5xl mb-3">{atAdCap ? "🌙" : "🎉"}</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {atAdCap ? "You've maxed out today!" : "Great Work!"}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              {atAdCap
                ? "Incredible hustle — you've completed every segment available today. Fresh segments unlock tomorrow."
                : "You've completed this task batch. Watch one short ad to unlock the next AI Task segment."}
            </Text>
            <View className="flex-row gap-6 my-5">
              <View className="items-center">
                <Text className="text-2xl font-bold text-emerald-500">
                  +{formatCents(sessionCents)}
                </Text>
                <Text className="text-xs text-gray-400">Session earnings</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">{doneToday}</Text>
                <Text className="text-xs text-gray-400">Tasks today</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  {segment}
                </Text>
                <Text className="text-xs text-gray-400">Segment</Text>
              </View>
            </View>
            {!atAdCap && (
              <TouchableOpacity
                onPress={watchAdAndContinue}
                disabled={adBusy}
                className="bg-primary-600 rounded-2xl py-4 px-6 w-full flex-row items-center justify-center gap-2"
                activeOpacity={0.85}
              >
                {adBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Play size={18} color="#fff" />
                    <Text className="text-white font-bold text-base">Watch Ad & Continue</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {wallMsg && (
              <Text className="text-xs text-red-500 mt-3 text-center font-semibold">{wallMsg}</Text>
            )}
            <TouchableOpacity onPress={exitRunner} className="mt-3 py-2">
              <Text className="text-gray-500 dark:text-gray-400 font-semibold">
                Back to AI Tasks
              </Text>
            </TouchableOpacity>
          </View>
          <View className="mt-4">
            <NativeAdCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── All tasks completed — professional empty state ────────
  if (!task) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
        {Header}
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-3">🎉</Text>
          <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
            Excellent Work!
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 leading-5">
            You've completed every available {category.title.toLowerCase()} task. New earning
            opportunities will appear soon — come back later or enable notifications to be
            alerted when new tasks are available.
          </Text>
          <TouchableOpacity
            onPress={enableNotifications}
            className="bg-primary-600 rounded-2xl py-3.5 px-8 mt-6 flex-row items-center gap-2"
            activeOpacity={0.85}
          >
            <Bell size={16} color="#fff" />
            <Text className="text-white font-bold">Enable Notifications</Text>
          </TouchableOpacity>
          {notifMsg && (
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              {notifMsg}
            </Text>
          )}
          <TouchableOpacity onPress={exitRunner} className="mt-4 py-2">
            <Text className="text-gray-500 dark:text-gray-400 font-semibold">Back to AI Tasks</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Active task ───────────────────────────────────────────
  const isCaptcha = kind === "captcha";
  const isSurvey = kind === "survey";
  const surveyQuestions = task.content.questions ?? [];
  const question = isSurvey
    ? surveyQuestions[surveyStep]?.q
    : isCaptcha
      ? puzzle?.prompt
      : task.content.question ?? task.title;
  const options = isSurvey
    ? surveyQuestions[surveyStep]?.options ?? []
    : isCaptcha
      ? puzzle?.options ?? []
      : task.content.options ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      {Header}

      {/* Segment progress — server truth, updates after every task */}
      <View className="px-5 mb-2">
        <View className="flex-row justify-between mb-1">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            Segment {segment} progress
          </Text>
          <Text className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
            {inSegment}/{TASK_ECONOMY.BATCH_SIZE}
          </Text>
        </View>
        <ProgressBar
          progress={(inSegment / TASK_ECONOMY.BATCH_SIZE) * 100}
          height={5}
          animated={false}
        />
        <View className="flex-row justify-between mt-1.5">
          <Text className="text-[10px] text-gray-400">
            {doneToday} done today · {level.emoji} {level.name}
          </Text>
          <Text className="text-[10px] text-gray-400">
            Today: {formatCents(earn.summary.today.earnedCents)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 90 }}>
        {/* Task meta */}
        <View className="flex-row items-center gap-2 mb-3 flex-wrap">
          <View className="bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
              {MICROTASK_CATEGORIES[task.category] ?? task.category}
            </Text>
          </View>
          <View className="bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1 flex-row items-center gap-1">
            <Clock size={10} color="#6B7280" />
            <Text className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
              ~{task.estSeconds}s
            </Text>
          </View>
          <View className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2.5 py-1">
            <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {formatCents(task.rewardCents)}
            </Text>
          </View>
          <View className="bg-amber-50 dark:bg-amber-900/30 rounded-lg px-2.5 py-1 flex-row items-center gap-0.5">
            <Zap size={10} color="#F59E0B" />
            <Text className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              +{task.xp} XP
            </Text>
          </View>
          <View className="bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 capitalize">
              {task.difficulty}
            </Text>
          </View>
        </View>

        {/* Question card */}
        <View className="bg-white dark:bg-gray-800 rounded-3xl p-5">
          {isSurvey && (
            <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">
              Question {surveyStep + 1} of {surveyQuestions.length}
            </Text>
          )}
          {isCaptcha && puzzle && !puzzle.images && (
            <View
              className={`rounded-2xl py-6 items-center mb-4 ${
                captchaError ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-100 dark:bg-gray-900"
              }`}
            >
              <Text
                className="text-3xl font-bold text-gray-900 dark:text-white tracking-widest"
                style={{ fontStyle: puzzle.sliderTarget == null ? "italic" : "normal" }}
              >
                {puzzle.display}
              </Text>
              {captchaError && (
                <Text className="text-xs text-red-500 font-semibold mt-2">
                  Not quite — here's a new one
                </Text>
              )}
            </View>
          )}

          {/* Real photo (annotation tasks) */}
          {!isCaptcha && task.content.image_url && (
            <View className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 mb-4">
              {imgFailed ? (
                <View style={{ height: 220 }} className="items-center justify-center">
                  <Text className="text-4xl mb-2">🖼️</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 text-center px-6">
                    Image couldn't load — check your connection, or answer from the
                    question text.
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: task.content.image_url }}
                  style={{ width: "100%", height: 220 }}
                  resizeMode="cover"
                  onLoadEnd={() => setImgLoading(false)}
                  onError={() => {
                    setImgLoading(false);
                    setImgFailed(true);
                  }}
                />
              )}
              {imgLoading && !imgFailed && (
                <View className="absolute inset-0 items-center justify-center">
                  <ActivityIndicator color="#2563EB" />
                </View>
              )}
            </View>
          )}

          <Text className="text-lg font-bold text-gray-900 dark:text-white leading-6">
            {question}
          </Text>

          {/* Captcha: image grid — tap the photo matching the prompt */}
          {isCaptcha && puzzle?.images && (
            <View className="mt-4">
              {captchaError && (
                <View className="bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2 mb-3">
                  <Text className="text-xs text-red-500 font-semibold text-center">
                    Not quite — here's a new set
                  </Text>
                </View>
              )}
              <View className="flex-row flex-wrap justify-between">
                {puzzle.images.map((uri, i) => (
                  <TouchableOpacity
                    key={`${uri}-${i}`}
                    disabled={captchaError}
                    onPress={() => selectCaptchaOption(i)}
                    activeOpacity={0.75}
                    style={{ width: "31.5%" }}
                    className="mb-2.5"
                  >
                    <Image
                      source={{ uri }}
                      style={{ width: "100%", height: 104, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-1">
                Tap the picture that matches the prompt above
              </Text>
            </View>
          )}

          {/* Captcha: free text */}
          {isCaptcha && puzzle && !puzzle.options && !puzzle.images && puzzle.sliderTarget == null && (
            <>
              <TextInput
                value={textAnswer}
                onChangeText={setTextAnswer}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Type your answer"
                placeholderTextColor="#9CA3AF"
                className="mt-4 bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-3.5 text-base font-bold text-gray-900 dark:text-white text-center tracking-widest"
              />
              <TouchableOpacity
                onPress={submitCaptcha}
                disabled={textAnswer.trim().length === 0}
                className={`mt-3 rounded-2xl py-4 items-center ${
                  textAnswer.trim().length === 0 ? "bg-gray-300 dark:bg-gray-700" : "bg-primary-600"
                }`}
              >
                <Text className="text-white font-bold text-base">Verify</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Captcha: slider */}
          {isCaptcha && puzzle?.sliderTarget != null && (
            <>
              <SliderTrack value={sliderValue} target={puzzle.sliderTarget} onChange={setSliderValue} />
              <TouchableOpacity
                onPress={submitCaptcha}
                className="mt-4 rounded-2xl py-4 items-center bg-primary-600"
              >
                <Text className="text-white font-bold text-base">Verify Position</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Options (microtask / annotation / survey / selection captcha) */}
          {options.length > 0 && (
            <View className="mt-4 gap-2.5">
              {options.map((opt, i) => (
                <TouchableOpacity
                  key={`${task.id}-${surveyStep}-${i}`}
                  disabled={isCaptcha && captchaError}
                  onPress={() => {
                    if (isCaptcha) selectCaptchaOption(i);
                    else if (isSurvey) answerSurvey(i);
                    else submit(task, { choice: i });
                  }}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4"
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-semibold text-gray-800 dark:text-gray-100 ${
                      isCaptcha ? "text-2xl text-center" : "text-sm"
                    }`}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Surveys leave plenty of empty space below the card → native ad.
            Mounted only for surveys; stays in place across questions. */}
        {isSurvey && (
          <View className="mt-5">
            <NativeAdCard />
          </View>
        )}
      </ScrollView>

      {ToastView}
    </SafeAreaView>
  );
}
