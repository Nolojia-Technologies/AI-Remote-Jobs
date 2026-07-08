import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, FileText, CheckCircle2, Lock, Circle, Clock, Play } from "lucide-react-native";
import { useAuthStore } from "../../../src/stores/authStore";
import { useUserStore } from "../../../src/stores/userStore";
import { userCourseService } from "../../../src/services/userCourseService";
import { Lesson } from "../../../src/types/content.types";
import { useReadingProgress } from "../../../src/hooks/useReadingProgress";
import { useRewardedAd, useDoubleXp } from "../../../src/hooks/useAds";
import { useCourseGateStore } from "../../../src/stores/courseGateStore";
import { cooldownMsForLesson } from "../../../src/learning/courseGate";
import { ContinueGateModal } from "../../../src/components/course/ContinueGateModal";
import { LessonMarkdown } from "../../../src/components/course/LessonMarkdown";
import { LessonHtml } from "../../../src/components/course/LessonHtml";
import { PdfLesson } from "../../../src/components/course/PdfLesson";
import { ReadingProgressBanner } from "../../../src/components/course/ReadingProgressBanner";
import { splitSections, sectionStates, formatCountdown, MIN_SCROLL_PERCENT } from "../../../src/lib/readingTime";
import { LoadingSpinner } from "../../../src/components/ui/LoadingSpinner";
import { EmptyState } from "../../../src/components/ui/EmptyState";

export default function LessonViewer() {
  const router = useRouter();
  const { id, courseId, chapterId } = useLocalSearchParams<{ id: string; courseId: string; chapterId: string }>();
  const { user } = useAuthStore();
  const { awardXP } = useUserStore();
  const insets = useSafeAreaInsets();
  // Lift the bottom action bar above the phone's nav/gesture controls.
  const bottomBarPad = insets.bottom + 12;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Continue gate (post-completion cooldown + rewarded-ad bypass) ──
  const showRewarded = useRewardedAd();
  const doubleXp = useDoubleXp();
  const gateStore = useCourseGateStore();
  const [gate, setGate] = useState<{ cooldownUntil: number; nextLessonId: string | null; nextChapterId: string | null } | null>(null);
  useEffect(() => { gateStore.hydrate(); }, []);

  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef(0);
  const restoredRef = useRef(false);
  // For HTML lessons, the WebView reports its real height asynchronously — don't
  // let the "fits on screen" shortcut mark a long lesson fully viewed too early.
  const htmlReadyRef = useRef(false);

  useEffect(() => {
    userCourseService.getLesson(id as string).then(setLesson).catch(() => setLesson(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    htmlReadyRef.current = !lesson?.content_html;
  }, [lesson?.id, lesson?.content_html]);

  const reading = useReadingProgress({
    lesson,
    userId: user?.id,
    courseId: courseId as string,
    chapterId: chapterId ? (chapterId as string) : null,
  });

  const sections = useMemo(() => splitSections(lesson?.body), [lesson?.body]);
  const states = useMemo(() => sectionStates(sections, reading.scrollPct), [sections, reading.scrollPct]);

  // Restore scroll position once content + saved progress are ready.
  useEffect(() => {
    if (restoredRef.current || reading.loadingProgress || reading.restoreOffset <= 0) return;
    restoredRef.current = true;
    const t = setTimeout(() => scrollRef.current?.scrollTo({ y: reading.restoreOffset, animated: false }), 300);
    return () => clearTimeout(t);
  }, [reading.loadingProgress, reading.restoreOffset]);

  const findNextLesson = async (): Promise<{ id: string; chapter_id: string | null } | null> => {
    if (!lesson) return null;
    try {
      const outline = await userCourseService.getOutline(courseId as string);
      const idx = outline.lessons.findIndex((l) => l.id === lesson.id);
      return idx >= 0 && idx + 1 < outline.lessons.length ? outline.lessons[idx + 1] : null;
    } catch {
      return null;
    }
  };

  const goToNextOrBack = (next: { id: string; chapter_id: string | null } | null) => {
    if (next) {
      router.replace({ pathname: `/course/lesson/${next.id}`, params: { courseId, chapterId: next.chapter_id ?? "" } } as any);
    } else {
      router.back();
    }
  };

  const onComplete = async () => {
    if (!user || !lesson) return;
    setSaving(true);
    try {
      const ok = await reading.markComplete();
      if (!ok) return;
      const xpEarned = lesson.xp_reward || 15;
      await awardXP(user.id, xpEarned, "lesson_complete", `Lesson: ${lesson.title}`);
      await doubleXp(user.id, xpEarned, `Double XP: ${lesson.title}`);

      const next = await findNextLesson();
      if (next) {
        const ms = cooldownMsForLesson(lesson);
        gateStore.startCooldown(lesson.id, ms);
        setGate({ cooldownUntil: Date.now() + ms, nextLessonId: next.id, nextChapterId: next.chapter_id });
      } else {
        router.back(); // last lesson in the course — nothing to gate
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Skip the reading wait: watch a rewarded ad → mark the lesson done → jump
   * straight to the next lesson (no cooldown, since the ad already "paid" for it).
   */
  const onSkipWithAd = async () => {
    if (!user || !lesson || saving) return;
    const watched = await showRewarded("skip_waiting");
    if (!watched) return;
    setSaving(true);
    try {
      const ok = await reading.markComplete();
      if (!ok) return;
      await awardXP(user.id, lesson.xp_reward || 15, "lesson_complete", `Lesson: ${lesson.title}`);
      goToNextOrBack(await findNextLesson());
    } finally {
      setSaving(false);
    }
  };

  const onWatchAd = async () => {
    const watched = await showRewarded("unlock_lesson");
    if (watched && lesson) gateStore.bypass(lesson.id);
    return watched;
  };

  const onGateContinue = () => {
    const g = gate;
    setGate(null);
    if (g?.nextLessonId) {
      router.replace({ pathname: `/course/lesson/${g.nextLessonId}`, params: { courseId, chapterId: g.nextChapterId ?? "" } } as any);
    } else {
      router.back();
    }
  };

  const gateModal =
    lesson && gate ? (
      <ContinueGateModal
        visible={!!gate}
        cooldownUntil={gate.cooldownUntil}
        unlocked={!!gateStore.gates[lesson.id]?.bypassed}
        lessonTitle={lesson.title}
        onWatchAd={onWatchAd}
        onContinue={onGateContinue}
      />
    ) : null;

  if (loading) return <LoadingSpinner fullScreen message="Loading lesson..." />;
  if (!lesson) return <EmptyState emoji="🚫" title="Lesson not found" description="It may have been removed." />;

  const xp = lesson.xp_reward || 15;
  const timeMet = reading.remainingSeconds <= 0;

  // ── Native PDF lesson layout (the PDF component handles its own scroll/zoom) ──
  if (lesson.lesson_type === "pdf") {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-950" edges={["top"]}>
        <View className="px-4 py-3 flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>{lesson.title}</Text>
            {reading.totalPages > 0 && (
              <Text className="text-xs text-gray-400">Page {reading.currentPage} of {reading.totalPages}</Text>
            )}
          </View>
        </View>
        <View className="h-1 bg-gray-200 dark:bg-gray-800">
          <View className="h-1 bg-primary" style={{ width: `${reading.scrollPct}%` }} />
        </View>

        <View className="flex-1">
          <PdfLesson
            lessonId={lesson.id}
            resumePage={reading.resumePage}
            onPages={reading.reportPages}
            onInteraction={reading.onInteraction}
          />
        </View>

        <View style={{ paddingBottom: bottomBarPad }} className="px-5 pt-3 bg-white/95 dark:bg-gray-950/95 border-t border-gray-100 dark:border-gray-800">
          {reading.alreadyCompleted ? (
            <View className="flex-row items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-2xl py-3.5">
              <CheckCircle2 size={20} color="#22C55E" />
              <Text className="text-base font-bold text-green-600 dark:text-green-400">Lesson Completed</Text>
            </View>
          ) : reading.canComplete ? (
            <TouchableOpacity onPress={onComplete} disabled={saving} activeOpacity={0.85} className="bg-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2">
              <CheckCircle2 size={20} color="#FFFFFF" />
              <Text className="text-base font-bold text-white">{saving ? "Saving…" : `Mark Lesson Complete · +${xp} XP`}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl py-3.5 items-center justify-center">
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {timeMet && reading.scrollPct < MIN_SCROLL_PERCENT
                    ? "Read to the last page to finish"
                    : `Complete Lesson · Available in ${formatCountdown(reading.remainingSeconds)}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onSkipWithAd}
                disabled={saving}
                activeOpacity={0.85}
                className="mt-2 bg-accent rounded-2xl py-3 flex-row items-center justify-center gap-2"
              >
                <Play size={18} color="#FFFFFF" />
                <Text className="text-sm font-bold text-white">{saving ? "Loading ad…" : "Skip the wait — watch an ad ▸"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {gateModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>{lesson.title}</Text>
      </View>

      {/* Sticky reading-progress bar */}
      <View className="h-1 bg-gray-100 dark:bg-gray-800">
        <View className="h-1 bg-primary" style={{ width: `${reading.scrollPct}%` }} />
      </View>

      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={32}
        onScroll={reading.onScroll}
        onTouchStart={reading.onInteraction}
        onLayout={(e) => { viewportRef.current = e.nativeEvent.layout.height; }}
        onContentSizeChange={(_w, h) => {
          if (htmlReadyRef.current && viewportRef.current > 0 && h <= viewportRef.current + 4) reading.markVisibleAll();
        }}
        contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Estimated reading time */}
        <View className="flex-row items-center gap-1.5 mb-3">
          <Clock size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Estimated reading time: {reading.requiredMinutes} min
          </Text>
        </View>

        {/* PDF */}
        {lesson.pdf_url ? (
          <TouchableOpacity onPress={() => Linking.openURL(lesson.pdf_url!)} className="flex-row items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4">
            <FileText size={20} color="#EF4444" />
            <Text className="flex-1 text-sm font-semibold text-red-600 dark:text-red-400" numberOfLines={1}>{lesson.pdf_name ?? "Open PDF document"}</Text>
            <Text className="text-xs text-red-500">Open ↗</Text>
          </TouchableOpacity>
        ) : null}

        {/* Reading progress banner */}
        {!reading.alreadyCompleted && (
          <ReadingProgressBanner
            timeSpent={reading.timeSpent}
            requiredMinutes={reading.requiredMinutes}
            scrollPct={reading.scrollPct}
            remainingSeconds={reading.remainingSeconds}
          />
        )}

        {/* Section indicators (long lessons only) */}
        {sections.length >= 2 && (
          <View className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-5 border border-gray-100 dark:border-gray-800">
            <Text className="text-xs font-bold uppercase text-gray-400 mb-2">Sections</Text>
            {sections.map((s, i) => (
              <View key={`${s.title}-${i}`} className="flex-row items-center py-1.5">
                {states[i] === "completed" ? (
                  <CheckCircle2 size={16} color="#22C55E" />
                ) : states[i] === "current" ? (
                  <Circle size={16} color="#2563EB" fill="#2563EB" />
                ) : (
                  <Lock size={14} color="#9CA3AF" />
                )}
                <Text
                  className={`ml-2.5 text-sm ${
                    states[i] === "locked" ? "text-gray-400" : "text-gray-800 dark:text-gray-200 font-medium"
                  }`}
                  numberOfLines={1}
                >
                  {s.title}
                </Text>
                {states[i] === "current" && <Text className="ml-auto text-[11px] font-semibold text-primary">Reading</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Content — rich HTML (Tiptap) when present, else markdown fallback */}
        {lesson.content_html ? (
          <LessonHtml html={lesson.content_html} onHeight={() => { htmlReadyRef.current = true; }} />
        ) : lesson.body ? (
          <LessonMarkdown content={lesson.body} />
        ) : (
          <Text className="text-gray-400">This lesson has no written content.</Text>
        )}
      </ScrollView>

      {/* Floating completion bar */}
      <View style={{ paddingBottom: bottomBarPad }} className="absolute left-0 right-0 bottom-0 px-5 pt-3 bg-white/95 dark:bg-gray-950/95 border-t border-gray-100 dark:border-gray-800">
        {reading.alreadyCompleted ? (
          <View className="flex-row items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-2xl py-3.5">
            <CheckCircle2 size={20} color="#22C55E" />
            <Text className="text-base font-bold text-green-600 dark:text-green-400">Lesson Completed</Text>
          </View>
        ) : reading.canComplete ? (
          <TouchableOpacity
            onPress={onComplete}
            disabled={saving}
            activeOpacity={0.85}
            className="bg-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text className="text-base font-bold text-white">{saving ? "Saving…" : `Mark Lesson Complete · +${xp} XP`}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl py-3.5 items-center justify-center">
              <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {timeMet && reading.scrollPct < MIN_SCROLL_PERCENT
                  ? "Scroll to the end to finish"
                  : `Complete Lesson · Available in ${formatCountdown(reading.remainingSeconds)}`}
              </Text>
              {!timeMet && reading.scrollPct < MIN_SCROLL_PERCENT && (
                <Text className="text-[11px] text-gray-400 mt-0.5">Keep reading — you've viewed {reading.scrollPct}%</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onSkipWithAd}
              disabled={saving}
              activeOpacity={0.85}
              className="mt-2 bg-accent rounded-2xl py-3 flex-row items-center justify-center gap-2"
            >
              <Play size={18} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">{saving ? "Loading ad…" : "Skip the wait — watch an ad ▸"}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      {gateModal}
    </SafeAreaView>
  );
}
