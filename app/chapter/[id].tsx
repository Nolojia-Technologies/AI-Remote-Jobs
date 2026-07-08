import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  CheckCircle2,
  Lock,
  Clock,
  Zap,
  Crown,
} from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useLearnStore } from "../../src/stores/learnStore";
import { useProgressionStore } from "../../src/stores/progressionStore";
import { useRevisionStore } from "../../src/stores/revisionStore";
import { useRewardedAd, reportAdAction, useInterstitialMoment, useRewardedBonusXp, useDoubleXp } from "../../src/hooks/useAds";
import { ProgressionEngine } from "../../src/learning/progressionEngine";
import { PROGRESSION, STAGE_BY_ID } from "../../src/learning/config";
import { XP_REWARDS } from "../../src/constants/xp";
import { getChapterQuiz } from "../../src/learning/quizBank";
import { NotificationService } from "../../src/notifications/NotificationService";
import { LessonWithProgress } from "../../src/types/app.types";
import { EnergyBar } from "../../src/components/learning/EnergyBar";
import { EnergyModal } from "../../src/components/learning/EnergyModal";
import { ChapterQuiz } from "../../src/components/learning/ChapterQuiz";
import { ChapterCompleteModal } from "../../src/components/learning/ChapterCompleteModal";
import { Button } from "../../src/components/ui/Button";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("# "))
      return <Text key={i} className="text-2xl font-bold text-gray-900 dark:text-white mt-2 mb-1">{line.slice(2)}</Text>;
    if (line.startsWith("## "))
      return <Text key={i} className="text-xl font-bold text-gray-900 dark:text-white mt-3 mb-1">{line.slice(3)}</Text>;
    if (line.startsWith("### "))
      return <Text key={i} className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-2">{line.slice(4)}</Text>;
    if (line.trim() === "") return <View key={i} className="h-2" />;
    const clean = line.replace(/\*\*/g, "");
    const bold = line.startsWith("**") && line.endsWith("**");
    return (
      <Text key={i} className={`text-base leading-7 ${bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
        {clean}
      </Text>
    );
  });
}

export default function ChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, awardXP } = useUserStore();
  const { modules, fetchModules, completeLesson, completedLessonIds } = useLearnStore();
  const progression = useProgressionStore();
  const revision = useRevisionStore();
  const showRewarded = useRewardedAd();
  const triggerInterstitial = useInterstitialMoment();
  const doubleXp = useDoubleXp();
  const grantBonusXp = useRewardedBonusXp();

  const [selectedLesson, setSelectedLesson] = useState<LessonWithProgress | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [energyModal, setEnergyModal] = useState(false);
  const [pendingLesson, setPendingLesson] = useState<LessonWithProgress | null>(null);
  const [completeModal, setCompleteModal] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      if (!progression.hydrated) await progression.hydrate(user.id);
      if (modules.length === 0 && profile?.career_path_id) {
        await fetchModules(user.id, profile.career_path_id);
      }
    })();
  }, [user]);

  // Abandonment: if the screen unmounts with a quiz mid-flight, lock it (2h).
  useEffect(() => {
    return () => {
      const store = useProgressionStore.getState();
      const c = store.getChapter(id as string);
      if (c.quizStatus === "in_progress" && !c.quizPassed) store.abandonQuizSession(id as string);
    };
  }, [id]);

  const chapters = ProgressionEngine.buildChapters(modules);
  const chapter = chapters.find((c) => c.id === id);

  if (!chapter) return <LoadingSpinner fullScreen message="Loading chapter..." />;

  const stage = STAGE_BY_ID[chapter.stage];
  const lessons = chapter.lessons;
  const completedCount = lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const allComplete = lessons.length > 0 && completedCount === lessons.length;
  const cp = progression.getChapter(chapter.id);
  const passMark = ProgressionEngine.passMarkFor(chapter);
  const xpReward = chapter.isMilestone ? PROGRESSION.rewards.milestoneXP : PROGRESSION.rewards.chapterXP;

  const stageChapters = chapters.filter((c) => c.stage === chapter.stage);
  const isStageComplete = stageChapters.every((c) => progression.getChapter(c.id).quizPassed);

  const openLesson = (lesson: LessonWithProgress) => {
    const done = completedLessonIds.has(lesson.id);
    if (done) {
      setSelectedLesson(lesson);
      return;
    }
    // Starting a NEW lesson consumes energy.
    if (progression.consumeEnergy()) {
      setSelectedLesson(lesson);
    } else {
      setPendingLesson(lesson);
      setEnergyModal(true);
    }
  };

  const markComplete = async () => {
    if (!user || !selectedLesson) return;
    await completeLesson(user.id, selectedLesson.id);
    // Schedule spaced-repetition reviews + log activity for the calendar.
    if (!revision.hydrated) await revision.hydrate(user.id);
    revision.scheduleLesson(selectedLesson.id, chapter.id, chapter.title);
    revision.recordActivity("lesson", selectedLesson.xp_reward);
    reportAdAction("lesson_completed"); // counts toward interstitial rhythm (no ad on the protected lesson screen)
    setSelectedLesson(null);
  };

  const quizGate = ProgressionEngine.quizGate(cp, Date.now());

  const onQuizSubmit = (passed: boolean) => {
    const r = progression.submitQuizResult(chapter.id, passed);
    if (passed && user) {
      awardXP(user.id, xpReward, "quiz_pass", `Chapter ${chapter.chapterIndex} completed`);
      // Stage completion bonus (once the final chapter of the stage is passed).
      const stageDone = chapters
        .filter((c) => c.stage === chapter.stage)
        .every((c) => useProgressionStore.getState().getChapter(c.id).quizPassed);
      if (stageDone) {
        awardXP(user.id, XP_REWARDS.STAGE_COMPLETE, "quiz_pass", `${stage.label} stage complete`);
      }
    } else if (!passed) {
      // Notify the user when the retry cooldown expires.
      const after = useProgressionStore.getState().getChapter(chapter.id);
      if (after.retryAvailableAt) NotificationService.scheduleQuizCooldown(chapter.id, after.retryAvailableAt);
    }
    return r;
  };

  const startQuiz = () => {
    progression.startQuizSession(chapter.id);
    setShowQuiz(true);
  };

  const exitQuiz = () => {
    progression.abandonQuizSession(chapter.id);
    const after = useProgressionStore.getState().getChapter(chapter.id);
    if (after.abandonLockUntil) NotificationService.scheduleQuizCooldown(chapter.id, after.abandonLockUntil, true);
    setShowQuiz(false);
  };

  const fmtAvailable = (at: number | null) => {
    const ms = Math.max(0, (at ?? 0) - Date.now());
    const m = Math.ceil(ms / 60000);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-950 px-4 pt-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-3 mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-xs font-bold uppercase" style={{ color: stage.color }}>
                {stage.emoji} {stage.label} · Chapter {chapter.chapterIndex}
              </Text>
              {chapter.isMilestone && <Crown size={12} color="#F59E0B" />}
            </View>
            <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
              {chapter.title}
            </Text>
          </View>
        </View>
        <EnergyBar onAddPress={() => setEnergyModal(true)} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Chapter progress */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-100 dark:border-gray-700">
          <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3">{chapter.description}</Text>
          <ProgressBar progress={lessons.length ? (completedCount / lessons.length) * 100 : 0} height={8} color={stage.color} />
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {completedCount}/{lessons.length} micro-lessons · 1 ⚡ each
          </Text>
        </View>

        {/* Quiz gate (after all lessons) */}
        {showQuiz ? (
          <ChapterQuiz
            chapterId={chapter.id}
            questions={getChapterQuiz(chapter.id)}
            passMark={passMark}
            isMilestone={chapter.isMilestone}
            xpReward={xpReward}
            lessonTitles={lessons.map((l) => l.title)}
            onSubmit={onQuizSubmit}
            onPassed={async () => {
              setShowQuiz(false);
              if (user) await doubleXp(user.id, xpReward, `Double XP: Chapter ${chapter.chapterIndex}`);
              setCompleteModal(true);
            }}
            onAdRetry={async () => {
              const ok = await showRewarded("retry_quiz");
              if (ok) progression.adRetryQuiz(chapter.id);
              return ok;
            }}
            onExit={exitQuiz}
          />
        ) : (
          <>
            {/* Lessons */}
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
              Micro-Lessons ({lessons.length})
            </Text>
            {lessons.map((lesson, idx) => {
              const done = completedLessonIds.has(lesson.id);
              return (
                <TouchableOpacity
                  key={lesson.id}
                  onPress={() => openLesson(lesson)}
                  activeOpacity={0.8}
                  className={`flex-row items-center p-4 mb-2 rounded-2xl border-2 ${
                    done
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                      : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                  }`}
                >
                  <View className="w-9 h-9 rounded-full items-center justify-center mr-3">
                    {done ? (
                      <CheckCircle2 size={30} color="#22C55E" />
                    ) : (
                      <View className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
                        <Text className="text-sm font-bold text-primary">{idx + 1}</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-semibold ${done ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"}`} numberOfLines={1}>
                      {lesson.title}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {lesson.duration_minutes} min · +{lesson.xp_reward} XP
                    </Text>
                  </View>
                  {!done && (
                    <View className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1">
                      <Zap size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text className="text-xs font-bold text-amber-600">1</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Quiz CTA */}
            <View className="mt-5">
              {cp.quizPassed ? (
                <View className="flex-row items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-2xl py-4">
                  <CheckCircle2 size={20} color="#22C55E" />
                  <Text className="font-bold text-green-600 dark:text-green-400">Chapter completed ✓</Text>
                </View>
              ) : allComplete ? (
                quizGate.kind === "available" ? (
                  <Button
                    label={
                      quizGate.hasPartial
                        ? "Resume Quiz →"
                        : chapter.isMilestone
                        ? "Take Milestone Assessment 👑"
                        : "Take Chapter Quiz →"
                    }
                    onPress={startQuiz}
                    fullWidth
                    size="lg"
                  />
                ) : quizGate.kind === "abandon_locked" ? (
                  <View className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 items-center">
                    <Text className="font-bold text-amber-700 dark:text-amber-300 mb-1">⏸️ Quiz paused</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
                      You left mid-quiz. Resume in {fmtAvailable(quizGate.availableAt)} — or watch a short ad to resume now.
                    </Text>
                    <Button
                      label="Resume Quiz — Watch Short Ad"
                      onPress={async () => {
                        const ok = await showRewarded("retry_quiz");
                        if (ok) {
                          progression.adRetryQuiz(chapter.id);
                          startQuiz();
                        }
                      }}
                      variant="accent"
                      fullWidth
                    />
                  </View>
                ) : (
                  <View className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 items-center">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Clock size={18} color="#F59E0B" />
                      <Text className="font-bold text-amber-700 dark:text-amber-300">
                        Quiz available in {fmtAvailable(quizGate.availableAt)}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
                      Review the lesson, then retry — or watch a rewarded ad to retry now.
                    </Text>
                    <Button
                      label="Watch Rewarded Ad & Retry Now"
                      onPress={async () => {
                        const ok = await showRewarded("retry_quiz");
                        if (ok) {
                          progression.adRetryQuiz(chapter.id);
                          startQuiz();
                        }
                      }}
                      variant="accent"
                      fullWidth
                    />
                  </View>
                )
              ) : (
                <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl py-4 flex-row items-center justify-center gap-2">
                  <Lock size={18} color="#9CA3AF" />
                  <Text className="font-bold text-gray-500 dark:text-gray-400">
                    Finish all lessons to unlock the quiz
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Lesson content modal */}
      <Modal visible={!!selectedLesson} animationType="slide" onRequestClose={() => setSelectedLesson(null)}>
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
          <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <TouchableOpacity
              onPress={() => setSelectedLesson(null)}
              className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mr-3"
            >
              <ChevronLeft size={20} color="#374151" />
            </TouchableOpacity>
            <Text className="flex-1 text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
              {selectedLesson?.title}
            </Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {selectedLesson && renderContent(selectedLesson.content)}
          </ScrollView>
          <View className="px-5 pb-8 pt-4 border-t border-gray-100 dark:border-gray-800">
            {selectedLesson && completedLessonIds.has(selectedLesson.id) ? (
              <View className="flex-row items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-2xl py-4">
                <CheckCircle2 size={20} color="#22C55E" />
                <Text className="font-bold text-green-600 dark:text-green-400">Lesson completed</Text>
              </View>
            ) : (
              <Button label="Mark as Complete ✓" onPress={markComplete} variant="accent" fullWidth size="lg" />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Energy modal */}
      <EnergyModal
        visible={energyModal}
        nextEnergyInMs={(() => {
          const now = Date.now();
          const n = ProgressionEngine.nextEnergyAt(progression, now);
          return n ? n - now : null;
        })()}
        onWatchAd={() => showRewarded("restore_energy")}
        onRestored={() => {
          progression.restoreEnergy();
          setEnergyModal(false);
          if (pendingLesson && progression.consumeEnergy()) {
            setSelectedLesson(pendingLesson);
            setPendingLesson(null);
          }
        }}
        onClose={() => {
          setEnergyModal(false);
          setPendingLesson(null);
        }}
      />

      {/* Chapter complete celebration */}
      <ChapterCompleteModal
        visible={completeModal}
        chapterTitle={`Chapter ${chapter.chapterIndex}: ${chapter.title}`}
        xp={xpReward}
        isMilestone={chapter.isMilestone}
        isStageComplete={isStageComplete}
        onBonusAd={async () => (user ? grantBonusXp(user.id) : -1)}
        onContinue={() => {
          setCompleteModal(false);
          router.back();
          // Reward cycle: once back on the (non-protected) Learn screen, the
          // engine may surface an interstitial — respecting cooldown/caps.
          setTimeout(() => triggerInterstitial(chapter.isMilestone ? "level_up" : "module_completed"), 900);
        }}
      />
    </SafeAreaView>
  );
}
