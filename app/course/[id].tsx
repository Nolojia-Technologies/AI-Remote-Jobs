import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { ChevronLeft, CheckCircle2, Circle, Clock, FileText, HelpCircle, Crown, Award, Lock, Play } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { userCourseService, CourseOutline } from "../../src/services/userCourseService";
import { userProgressService } from "../../src/services/userProgressService";
import { LessonProgressStatus } from "../../src/types/content.types";
import { useRewardedAd } from "../../src/hooks/useAds";
import { useCourseGateStore } from "../../src/stores/courseGateStore";
import { formatCountdown } from "../../src/lib/readingTime";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { EmptyState } from "../../src/components/ui/EmptyState";

type LessonLockStatus = "completed" | "open" | "cooldown" | "locked";
interface LessonLock {
  status: LessonLockStatus;
  prevId?: string;
  remainingMs?: number;
}

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = id as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgressStatus>>(new Map());
  const [loading, setLoading] = useState(true);

  // ── Gate state: cooldown countdowns + rewarded-ad unlock ──
  const showRewarded = useRewardedAd();
  const gateStore = useCourseGateStore();
  const [now, setNow] = useState(Date.now());
  const [unlocking, setUnlocking] = useState<string | null>(null);
  useEffect(() => { gateStore.hydrate(); }, []);
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const watchToUnlock = async (prevLessonId: string) => {
    setUnlocking(prevLessonId);
    const watched = await showRewarded("unlock_lesson");
    if (watched) gateStore.bypass(prevLessonId);
    setUnlocking(null);
  };

  const load = useCallback(async () => {
    try {
      const o = await userCourseService.getOutline(courseId);
      setOutline(o);
      if (user) setProgress(await userProgressService.getCourseProgress(user.id, courseId));
    } catch {
      setOutline(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <LoadingSpinner fullScreen message="Loading course..." />;
  if (!outline?.course) return <EmptyState emoji="🚫" title="Course unavailable" description="It may have been unpublished." />;

  const { course, stages, chapters, lessons, quizzes } = outline;
  const totalLessons = lessons.length;
  const completed = lessons.filter((l) => progress.get(l.id) === "completed").length;
  const pct = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;

  // Sequential unlocking: a lesson opens only once the previous one is completed
  // AND its post-completion cooldown has elapsed (or been bypassed with an ad).
  const lockByLesson = new Map<string, LessonLock>();
  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    if (progress.get(l.id) === "completed") { lockByLesson.set(l.id, { status: "completed" }); continue; }
    if (i === 0) { lockByLesson.set(l.id, { status: "open" }); continue; }
    const prev = lessons[i - 1];
    if (progress.get(prev.id) !== "completed") { lockByLesson.set(l.id, { status: "locked", prevId: prev.id }); continue; }
    const rem = gateStore.remainingMs(prev.id, now);
    lockByLesson.set(l.id, rem > 0 ? { status: "cooldown", prevId: prev.id, remainingMs: rem } : { status: "open", prevId: prev.id });
  }

  // Mini-quiz gating (structured courses): a chapter's quiz must be passed
  // before the next chapter's lessons unlock. A passed quiz shows up in the
  // progress map (markQuizPassed writes a user_progress row keyed by quiz id).
  const quizStatus = new Map<string, "passed" | "open" | "locked">();
  const quizLockedLessonIds = new Set<string>();
  if (stages.length > 0) {
    const orderedChapterIds: string[] = [];
    stages.forEach((st) => chapters.filter((c) => c.stage_id === st.id).forEach((c) => orderedChapterIds.push(c.id)));
    let prevQuizPassed = true;
    let prevHadQuiz = false;
    orderedChapterIds.forEach((chId, ci) => {
      const chLessons = lessons.filter((l) => l.chapter_id === chId);
      const chQuiz = quizzes.find((q) => q.chapter_id === chId);
      const lessonsDone = chLessons.length > 0 && chLessons.every((l) => progress.get(l.id) === "completed");
      if (ci > 0 && prevHadQuiz && !prevQuizPassed && chLessons[0]) {
        quizLockedLessonIds.add(chLessons[0].id);
      }
      if (chQuiz) {
        const passed = progress.get(chQuiz.id) === "completed";
        quizStatus.set(chQuiz.id, passed ? "passed" : lessonsDone ? "open" : "locked");
        prevQuizPassed = passed;
        prevHadQuiz = true;
      } else {
        prevQuizPassed = true;
        prevHadQuiz = false;
      }
    });
  }

  const openLesson = (lessonId: string, chapterId: string | null) =>
    router.push({ pathname: `/course/lesson/${lessonId}`, params: { courseId, chapterId: chapterId ?? "" } } as any);
  const openQuiz = (quizId: string) => router.push({ pathname: `/course/quiz/${quizId}`, params: { courseId } } as any);

  const lessonRow = (l: (typeof lessons)[number]) => {
    const base = lockByLesson.get(l.id) ?? ({ status: "open" } as LessonLock);
    const quizLocked = quizLockedLessonIds.has(l.id) && base.status !== "completed";
    const info: LessonLock = quizLocked ? { status: "locked" } : base;
    const navigable = info.status === "open" || info.status === "completed";
    const dim = info.status === "locked" || info.status === "cooldown";
    const onPress = () => {
      if (navigable) openLesson(l.id, l.chapter_id);
      else if (info.status === "cooldown" && info.prevId) watchToUnlock(info.prevId);
    };
    return (
      <TouchableOpacity
        key={l.id}
        onPress={onPress}
        disabled={info.status === "locked" || unlocking === info.prevId}
        activeOpacity={info.status === "locked" ? 1 : 0.7}
        className="flex-row items-center px-4 py-3 border-b border-gray-50 dark:border-gray-700/50"
      >
        {info.status === "completed" ? (
          <CheckCircle2 size={20} color="#22C55E" />
        ) : info.status === "cooldown" ? (
          <Clock size={20} color="#F59E0B" />
        ) : info.status === "locked" ? (
          <Lock size={18} color="#9CA3AF" />
        ) : (
          <Circle size={20} color="#9CA3AF" />
        )}
        <View className="flex-1 ml-3">
          <Text
            className={`text-sm font-semibold ${dim ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}
            numberOfLines={1}
          >
            {l.title}
          </Text>
          {info.status === "cooldown" ? (
            <Text className="text-xs text-amber-600 dark:text-amber-400">
              🔒 Unlocks in {formatCountdown(Math.ceil((info.remainingMs ?? 0) / 1000))} · tap to watch ad
            </Text>
          ) : info.status === "locked" ? (
            <Text className="text-xs text-gray-400">
              {quizLocked ? "🔒 Pass the chapter quiz to continue" : "🔒 Complete the previous lesson to continue"}
            </Text>
          ) : (
            <Text className="text-xs text-gray-400">
              {l.estimated_reading_minutes ?? l.duration_minutes} min · {l.xp_reward} XP{l.pdf_url ? " · PDF" : ""}
            </Text>
          )}
        </View>
        {info.status === "cooldown" ? (
          unlocking === info.prevId ? <Clock size={16} color="#F59E0B" /> : <Play size={16} color="#F59E0B" />
        ) : info.status === "locked" ? (
          <Lock size={14} color="#D1D5DB" />
        ) : (
          <FileText size={16} color="#9CA3AF" />
        )}
      </TouchableOpacity>
    );
  };

  const quizRow = (q: (typeof quizzes)[number]) => {
    const st = quizStatus.get(q.id); // undefined for milestone/final (ungated)
    const locked = st === "locked";
    const passed = st === "passed";
    return (
      <TouchableOpacity
        key={q.id}
        onPress={() => !locked && openQuiz(q.id)}
        disabled={locked}
        activeOpacity={locked ? 1 : 0.7}
        className="flex-row items-center px-4 py-3 border-b border-gray-50 dark:border-gray-700/50"
      >
        {passed ? (
          <CheckCircle2 size={20} color="#22C55E" />
        ) : locked ? (
          <Lock size={18} color="#9CA3AF" />
        ) : q.kind === "final" ? (
          <Award size={20} color="#F59E0B" />
        ) : q.kind === "milestone" ? (
          <Crown size={20} color="#8B5CF6" />
        ) : (
          <HelpCircle size={20} color="#2563EB" />
        )}
        <View className="flex-1 ml-3">
          <Text className={`text-sm font-semibold ${locked ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`} numberOfLines={1}>
            {q.title}
          </Text>
          <Text className="text-xs text-gray-400">
            {passed ? "Passed ✓" : locked ? "🔒 Finish this chapter's lessons first" : `Pass ${q.passing_score}% · ${q.xp_reward} XP`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const card = (children: React.ReactNode) => (
    <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-3">{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <View className="px-4 py-3 flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-gray-900 dark:text-white" numberOfLines={1}>{course.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <Text className="text-sm text-gray-600 dark:text-gray-300 mb-3">{course.description}</Text>
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 border border-gray-100 dark:border-gray-700">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs font-semibold text-gray-500">Progress</Text>
            <Text className="text-xs font-bold text-primary">{completed}/{totalLessons} lessons</Text>
          </View>
          <ProgressBar progress={pct} height={8} color="#2563EB" />
        </View>

        {totalLessons === 0 && quizzes.length === 0 ? (
          <EmptyState emoji="🧩" title="No content yet" description="This course hasn't been filled in." />
        ) : stages.length > 0 ? (
          stages.map((stage) => {
            const stChapters = chapters.filter((c) => c.stage_id === stage.id);
            const milestones = quizzes.filter((q) => q.stage_id === stage.id && !q.chapter_id && q.kind === "milestone");
            return (
              <View key={stage.id} className="mb-2">
                <Text className="text-base font-bold text-gray-900 dark:text-white mt-3 mb-2">{stage.title}</Text>
                {stChapters.map((ch) => {
                  const chLessons = lessons.filter((l) => l.chapter_id === ch.id);
                  const chQuizzes = quizzes.filter((q) => q.chapter_id === ch.id);
                  return (
                    <View key={ch.id}>
                      <Text className="text-xs font-bold uppercase text-gray-400 px-1 mt-2 mb-1">{ch.title}</Text>
                      {card(<>{chLessons.map(lessonRow)}{chQuizzes.map(quizRow)}</>)}
                    </View>
                  );
                })}
                {milestones.length > 0 && card(milestones.map(quizRow))}
              </View>
            );
          })
        ) : (
          <>
            {lessons.length > 0 && card(lessons.map(lessonRow))}
            {quizzes.length > 0 && card(quizzes.map(quizRow))}
          </>
        )}

        {/* Final assessment */}
        {quizzes.filter((q) => !q.stage_id && !q.chapter_id && q.kind === "final").length > 0 && (
          <>
            <Text className="text-base font-bold text-gray-900 dark:text-white mt-3 mb-2">🎓 Final Assessment</Text>
            {card(quizzes.filter((q) => !q.stage_id && !q.chapter_id && q.kind === "final").map(quizRow))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
