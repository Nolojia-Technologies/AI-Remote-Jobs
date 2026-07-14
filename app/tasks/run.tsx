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
import { X, Zap, Play, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useEarnStore } from "../../src/stores/earnStore";
import { AiTask, TaskKind, CaptchaGenerator } from "../../src/types/tasks.types";
import {
  EARN_CATEGORIES,
  TASK_ECONOMY,
  formatCents,
  MICROTASK_CATEGORIES,
  reviewLockMs,
} from "../../src/constants/taskEconomy";
import { generateCaptcha, sliderMatches, CaptchaPuzzle } from "../../src/data/aiTasksLocal";
import { RewardedAdManager } from "../../src/ads/RewardedAdManager";
import { InterstitialAdManager } from "../../src/ads/InterstitialAdManager";
import { JobInterstitialManager } from "../../src/ads/JobInterstitialManager";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { ProgressBar } from "../../src/components/ui/ProgressBar";

type WallKind = "segment" | "daily" | "break" | null;

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
        {/* target marker */}
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
        {/* handle */}
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

export default function TaskRunnerScreen() {
  const router = useRouter();
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const kind = (["microtask", "captcha", "annotation", "survey"].includes(kindParam ?? "")
    ? kindParam
    : "microtask") as TaskKind;
  const category = EARN_CATEGORIES.find((c) => c.id === kind) ?? EARN_CATEGORIES[0];

  const earn = useEarnStore();
  const feed = earn.getFeed(kind);

  const [index, setIndex] = useState(0);
  const [sessionDone, setSessionDone] = useState(0);
  const [sessionCents, setSessionCents] = useState(0);
  const [wall, setWallState] = useState<WallKind>(null);
  const wallRef = useRef<WallKind>(null);
  const setWall = (w: WallKind) => {
    wallRef.current = w;
    setWallState(w);
  };
  const [breakLeft, setBreakLeft] = useState<number>(TASK_ECONOMY.BREAK_SECONDS);
  const [reviewLeft, setReviewLeft] = useState(0);
  const [imgLoading, setImgLoading] = useState(true);
  const [adBusy, setAdBusy] = useState(false);
  const [wallMsg, setWallMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<null | { correct: boolean; cents: number; xp: number }>(null);

  // Captcha state — regenerated per round
  const captchaTasks = useMemo(
    () => (kind === "captcha" ? feed : []),
    [kind, feed.length]
  );
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
    kind === "captcha" ? captchaTask : feed[index] ?? null;

  useEffect(() => {
    RewardedAdManager.preload();
    InterstitialAdManager.preload();
  }, []);

  // Leaving the runner is a natural transition point → engine-gated interstitial.
  const exitRunner = () => {
    JobInterstitialManager.openJob(() => router.back());
  };

  useEffect(() => {
    if (kind === "captcha" && captchaTask) {
      const gen = (captchaTask.content.generator ?? "text") as CaptchaGenerator;
      setPuzzle(generateCaptcha(gen));
      setTextAnswer("");
      setSliderValue(0);
      setCaptchaError(false);
    }
    setSurveyStep(0);
    setSurveyAnswers([]);
    setFeedback(null);
    setImgLoading(true);
    startedAt.current = Date.now();
  }, [kind, index, captchaRound, captchaTask?.id]);

  // Review lock: answers stay disabled while the user reads the task.
  // (Captchas are exempt — typing/sliding IS the work.)
  useEffect(() => {
    if (!task || kind === "captcha" || wall) return;
    const lockMs = kind === "survey" ? 3000 : reviewLockMs(task.estSeconds);
    setReviewLeft(Math.ceil(lockMs / 1000));
    const iv = setInterval(() => {
      setReviewLeft((s) => {
        if (s <= 1) clearInterval(iv);
        return Math.max(0, s - 1);
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [kind, index, surveyStep, wall, task?.id]);

  // Break countdown: auto-continue when it reaches zero.
  useEffect(() => {
    if (wall !== "break") return;
    setBreakLeft(TASK_ECONOMY.BREAK_SECONDS);
    const iv = setInterval(() => setBreakLeft((s) => s - 1), 1000);
    return () => clearInterval(iv);
  }, [wall]);

  useEffect(() => {
    if (wall === "break" && breakLeft <= 0) {
      setWall(null);
      advance();
    }
  }, [breakLeft, wall]);

  const advance = () => {
    if (kind === "captcha") setCaptchaRound((r) => r + 1);
    else setIndex((i) => i + 1);
  };

  const afterCompletion = (correct: boolean, cents: number, xp: number) => {
    setFeedback({ correct, cents, xp });
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSessionDone((n) => {
        const next = n + 1;
        // Segment wall every AD_SEGMENT_SIZE tasks — rewarded ad to continue.
        // Between walls, a "quick break" every BREAK_EVERY_TASKS: short
        // countdown, skippable with a rewarded ad.
        if (next % TASK_ECONOMY.AD_SEGMENT_SIZE === 0) setWall("segment");
        else if (next % TASK_ECONOMY.BREAK_EVERY_TASKS === 0) setWall("break");
        return next;
      });
      setSessionCents((c) => c + cents);
      // Finishing a survey is a larger unit of work → natural interstitial moment
      // (still engine-gated by cooldowns and caps; never fires mid-question).
      if (kind === "survey") {
        setTimeout(() => JobInterstitialManager.openJob(() => {}), 1000);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setTimeout(() => {
      setFeedback(null);
      // Wall screens own the next advance() (ad gate / break countdown) —
      // advancing here too would skip a task.
      if (!wallRef.current) advance();
    }, correct ? 900 : 1400);
  };

  const submit = async (answer: any) => {
    if (!task || submitting) return;
    setSubmitting(true);
    const result = await earn.completeTask(task, answer, Date.now() - startedAt.current);
    setSubmitting(false);
    if (!result.ok) {
      if (result.error === "daily_limit") {
        setWall("daily");
      } else {
        setWallMsg(result.error ?? "Something went wrong");
        setTimeout(() => setWallMsg(null), 2500);
        advance();
      }
      return;
    }
    afterCompletion(result.correct, result.rewardCents, result.xp);
  };

  const submitCaptcha = () => {
    if (!puzzle || !task) return;
    let solved = false;
    if (puzzle.sliderTarget != null) solved = sliderMatches(sliderValue, puzzle.sliderTarget);
    else if (typeof puzzle.answer === "string")
      solved = textAnswer.trim().toUpperCase() === puzzle.answer.toUpperCase();
    if (solved) {
      setCaptchaError(false);
      // Local validation passed → credit via server (rate-limited & capped there).
      submit({ captcha: true, solved: true });
    } else {
      setCaptchaError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const gen = (task.content.generator ?? "text") as CaptchaGenerator;
      setTimeout(() => {
        setPuzzle(generateCaptcha(gen));
        setTextAnswer("");
        setSliderValue(0);
        setCaptchaError(false);
      }, 900);
    }
  };

  const selectCaptchaOption = (i: number) => {
    if (!puzzle) return;
    if (i === puzzle.answer) submit({ captcha: true, solved: true });
    else {
      setCaptchaError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        setPuzzle(generateCaptcha("selection"));
        setCaptchaError(false);
      }, 900);
    }
  };

  const answerSurvey = (choice: number) => {
    if (!task?.content.questions) return;
    const answers = [...surveyAnswers, choice];
    if (answers.length >= task.content.questions.length) {
      submit({ responses: answers });
    } else {
      setSurveyAnswers(answers);
      setSurveyStep((s) => s + 1);
    }
  };

  const watchAdAndContinue = async () => {
    setAdBusy(true);
    const earned = await RewardedAdManager.show();
    if (!earned) {
      setAdBusy(false);
      setWallMsg("Ad not ready yet — try again in a few seconds.");
      setTimeout(() => setWallMsg(null), 2500);
      return;
    }
    if (wall === "daily") {
      const res = await earn.unlockBatch();
      setAdBusy(false);
      if (!res.ok) {
        setWallMsg(res.error ?? "Could not unlock more tasks.");
        setTimeout(() => setWallMsg(null), 3000);
        return;
      }
    } else {
      setAdBusy(false);
    }
    setWall(null);
    advance();
  };

  const remainingToday = earn.tasksRemainingToday();
  const segmentPos = sessionDone % TASK_ECONOMY.AD_SEGMENT_SIZE;

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
          {remainingToday} tasks left today
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold text-emerald-500">+{formatCents(sessionCents)}</Text>
        <Text className="text-[10px] text-gray-400">this session</Text>
      </View>
    </View>
  );

  // ─── Wall screens ──────────────────────────────────────────
  if (wall) {
    const isDaily = wall === "daily";
    const isBreak = wall === "break";
    const atAdCap = earn.summary.today.adBatches >= TASK_ECONOMY.MAX_AD_BATCHES;
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
        {Header}
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 items-center">
            <Text className="text-5xl mb-3">{isDaily ? "🌙" : isBreak ? "☕" : "🎉"}</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {isDaily
                ? "You've completed today's available tasks"
                : isBreak
                  ? "Quick break"
                  : "Batch complete!"}
            </Text>
            {isBreak && (
              <Text className="text-4xl font-bold text-primary-600 mt-2">{breakLeft}s</Text>
            )}
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              {isDaily
                ? atAdCap
                  ? "Amazing hustle! You've maxed out today. Come back tomorrow for a fresh batch."
                  : `Come back tomorrow — or watch one short ad to unlock ${TASK_ECONOMY.BATCH_SIZE} more tasks now.`
                : isBreak
                  ? "The next task unlocks in a moment — or watch one short ad to skip the wait."
                  : `You crushed ${TASK_ECONOMY.AD_SEGMENT_SIZE} tasks. Watch one short ad to unlock the next batch.`}
            </Text>
            <View className="flex-row gap-6 my-5">
              <View className="items-center">
                <Text className="text-2xl font-bold text-emerald-500">
                  +{formatCents(sessionCents)}
                </Text>
                <Text className="text-xs text-gray-400">Session earnings</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sessionDone}
                </Text>
                <Text className="text-xs text-gray-400">Tasks done</Text>
              </View>
            </View>
            {(!isDaily || !atAdCap) && (
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
                    <Text className="text-white font-bold text-base">
                      {isBreak ? "Watch Ad & Skip Wait" : "Watch Ad & Continue"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={exitRunner} className="mt-3 py-2">
              <Text className="text-gray-500 dark:text-gray-400 font-semibold">
                Back to AI Tasks
              </Text>
            </TouchableOpacity>
            {wallMsg && (
              <Text className="text-xs text-red-500 mt-2 text-center">{wallMsg}</Text>
            )}
          </View>
          <View className="mt-4">
            <NativeAdCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Empty feed ────────────────────────────────────────────
  if (!task) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
        {Header}
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-3">✅</Text>
          <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
            All done here!
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
            You've completed every available {category.title.toLowerCase()} task. New tasks
            drop regularly — check back soon.
          </Text>
          <TouchableOpacity
            onPress={exitRunner}
            className="bg-primary-600 rounded-2xl py-3.5 px-8 mt-6"
          >
            <Text className="text-white font-bold">Back to AI Tasks</Text>
          </TouchableOpacity>
          <View className="w-full mt-6">
            <NativeAdCard />
          </View>
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

      {/* Segment progress */}
      <View className="px-5 mb-2">
        <View className="flex-row justify-between mb-1">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            Segment progress
          </Text>
          <Text className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
            {segmentPos}/{TASK_ECONOMY.BATCH_SIZE}
          </Text>
        </View>
        <ProgressBar
          progress={(segmentPos / TASK_ECONOMY.BATCH_SIZE) * 100}
          height={5}
          animated={false}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
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
          {isCaptcha && puzzle && (
            <View
              className={`rounded-2xl py-6 items-center mb-4 ${
                captchaError
                  ? "bg-red-50 dark:bg-red-900/20"
                  : "bg-gray-100 dark:bg-gray-900"
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
              <Image
                source={{ uri: task.content.image_url }}
                style={{ width: "100%", height: 220 }}
                resizeMode="cover"
                onLoadEnd={() => setImgLoading(false)}
              />
              {imgLoading && (
                <View className="absolute inset-0 items-center justify-center">
                  <ActivityIndicator color="#2563EB" />
                </View>
              )}
            </View>
          )}
          <Text className="text-lg font-bold text-gray-900 dark:text-white leading-6">
            {question}
          </Text>

          {/* Review lock — answers unlock after a short reading period */}
          {!isCaptcha && reviewLeft > 0 && (
            <View className="mt-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl px-3 py-2 flex-row items-center gap-2">
              <Clock size={13} color="#2563EB" />
              <Text className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                Review carefully — answers unlock in {reviewLeft}s
              </Text>
            </View>
          )}

          {/* Captcha: free text */}
          {isCaptcha && puzzle && !puzzle.options && puzzle.sliderTarget == null && (
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
                disabled={submitting || textAnswer.trim().length === 0}
                className={`mt-3 rounded-2xl py-4 items-center ${
                  textAnswer.trim().length === 0 ? "bg-gray-300 dark:bg-gray-700" : "bg-primary-600"
                }`}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Verify</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Captcha: slider */}
          {isCaptcha && puzzle?.sliderTarget != null && (
            <>
              <SliderTrack value={sliderValue} target={puzzle.sliderTarget} onChange={setSliderValue} />
              <TouchableOpacity
                onPress={submitCaptcha}
                disabled={submitting}
                className="mt-4 rounded-2xl py-4 items-center bg-primary-600"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Verify Position</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Options (microtask / annotation / survey / selection captcha) */}
          {options.length > 0 && (
            <View className="mt-4 gap-2.5">
              {options.map((opt, i) => {
                const locked = !isCaptcha && reviewLeft > 0;
                return (
                <TouchableOpacity
                  key={`${i}-${opt}`}
                  disabled={submitting || !!feedback || locked}
                  onPress={() => {
                    if (isCaptcha) selectCaptchaOption(i);
                    else if (isSurvey) answerSurvey(i);
                    else submit({ choice: i });
                  }}
                  className={`bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 ${
                    locked ? "opacity-40" : ""
                  }`}
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
                );
              })}
            </View>
          )}
        </View>

        {/* Feedback toast */}
        {feedback && (
          <View
            className={`mt-4 rounded-2xl p-4 flex-row items-center gap-3 ${
              feedback.correct
                ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <Text className="text-2xl">{feedback.correct ? "✅" : "❌"}</Text>
            <View>
              <Text
                className={`font-bold ${
                  feedback.correct
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {feedback.correct
                  ? `Approved! +${formatCents(feedback.cents)} · +${feedback.xp} XP`
                  : "Not quite — moving to the next task"}
              </Text>
            </View>
          </View>
        )}

        {wallMsg && !feedback && (
          <View className="mt-4 rounded-2xl p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Text className="text-amber-700 dark:text-amber-300 text-sm font-semibold">
              {wallMsg}
            </Text>
          </View>
        )}

        {/* Native ad — fills the space below the task card. Stays mounted
            across tasks (same tree position) so it doesn't re-request per task. */}
        <View className="mt-5">
          <NativeAdCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
