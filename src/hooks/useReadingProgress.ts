import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useFocusEffect } from "expo-router";
import { computeReadingTime, IDLE_LIMIT_MS, MIN_SCROLL_PERCENT, stripHtml } from "../lib/readingTime";
import { userProgressService } from "../services/userProgressService";
import { Lesson } from "../types/content.types";

const AUTOSAVE_MS = 10_000;

/**
 * Drives the smart-completion experience for one lesson:
 *  - counts reading time, but only while the app is active, the screen is
 *    focused, and the user has interacted within the last 2 minutes;
 *  - tracks how far the learner has scrolled (max %);
 *  - persists progress (debounced + on background/blur/unmount) and resumes it;
 *  - exposes `canComplete` = enough time AND ≥90% scrolled.
 */
export function useReadingProgress(params: {
  lesson: Lesson | null;
  userId: string | undefined;
  courseId: string;
  chapterId: string | null;
}) {
  const { lesson, userId, courseId, chapterId } = params;
  const base = computeReadingTime(lesson?.body || stripHtml(lesson?.content_html), lesson?.character_count);
  const isPdf = lesson?.lesson_type === "pdf";
  // PDF lessons have no character count — size the required time by page count,
  // floored at the short-lesson tier (3 min) to match the anti-skim policy.
  const requiredSeconds = isPdf ? Math.max(180, (lesson?.pdf_pages || 1) * 45) : base.requiredSeconds;
  const requiredMinutes = Math.max(1, Math.ceil(requiredSeconds / 60));

  const [timeSpent, setTimeSpent] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [resumePage, setResumePage] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [restoreOffset, setRestoreOffset] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const timeRef = useRef(0);
  const scrollPctRef = useRef(0);
  const scrollPosRef = useRef(0);
  const pageRef = useRef(0);
  const totalPagesRef = useRef(0);
  const lastInteractionRef = useRef(Date.now());
  const appActiveRef = useRef(true);
  const focusedRef = useRef(true);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);
  const dirtyRef = useRef(false);
  const lastSaveRef = useRef(Date.now());

  // ── Load any saved progress (resume point) ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!lesson || !userId) {
      setLoadingProgress(false);
      return;
    }
    setLoadingProgress(true);
    userProgressService
      .getLessonProgress(userId, lesson.id)
      .then((p) => {
        if (cancelled || !p) return;
        timeRef.current = p.time_spent_seconds ?? 0;
        scrollPctRef.current = p.scroll_percentage ?? 0;
        scrollPosRef.current = p.last_scroll_position ?? 0;
        pageRef.current = p.current_page ?? 0;
        totalPagesRef.current = p.total_pages ?? 0;
        startedAtRef.current = p.started_at ?? startedAtRef.current;
        completedRef.current = p.status === "completed";
        setTimeSpent(timeRef.current);
        setScrollPct(scrollPctRef.current);
        setRestoreOffset(scrollPosRef.current);
        setResumePage(pageRef.current);
        setCurrentPage(pageRef.current);
        setTotalPages(totalPagesRef.current);
        setAlreadyCompleted(p.status === "completed");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingProgress(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lesson?.id, userId]);

  const save = useCallback(() => {
    if (!lesson || !userId || completedRef.current || !dirtyRef.current) return;
    lastSaveRef.current = Date.now();
    dirtyRef.current = false;
    userProgressService
      .saveLessonProgress({
        userId,
        courseId,
        chapterId,
        lessonId: lesson.id,
        timeSpentSeconds: timeRef.current,
        scrollPercentage: scrollPctRef.current,
        lastScrollPosition: scrollPosRef.current,
        currentPage: pageRef.current,
        totalPages: totalPagesRef.current,
        startedAt: startedAtRef.current,
        status: "in_progress",
      })
      .catch(() => {});
  }, [lesson?.id, userId, courseId, chapterId]);

  // ── 1-second tick: count engaged time + debounced autosave ────────────────
  useEffect(() => {
    if (!lesson) return;
    const iv = setInterval(() => {
      if (completedRef.current) return;
      const engaged =
        appActiveRef.current && focusedRef.current && Date.now() - lastInteractionRef.current < IDLE_LIMIT_MS;
      if (engaged) {
        timeRef.current += 1;
        dirtyRef.current = true;
        setTimeSpent(timeRef.current);
      }
      if (dirtyRef.current && Date.now() - lastSaveRef.current >= AUTOSAVE_MS) save();
    }, 1000);
    return () => clearInterval(iv);
  }, [lesson?.id, save]);

  // ── Pause when app is backgrounded; resume on return ──────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      const active = s === "active";
      if (!active && appActiveRef.current) save();
      appActiveRef.current = active;
      if (active) lastInteractionRef.current = Date.now();
    });
    return () => sub.remove();
  }, [save]);

  // ── Pause when the screen loses focus ─────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      lastInteractionRef.current = Date.now();
      return () => {
        focusedRef.current = false;
        save();
      };
    }, [save])
  );

  // ── Flush on unmount ──────────────────────────────────────────────────────
  useEffect(() => () => save(), [save]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const reached = ((contentOffset.y + layoutMeasurement.height) / Math.max(1, contentSize.height)) * 100;
    const pct = Math.max(0, Math.min(100, Math.round(reached)));
    scrollPosRef.current = contentOffset.y;
    lastInteractionRef.current = Date.now();
    dirtyRef.current = true;
    if (pct > scrollPctRef.current) {
      scrollPctRef.current = pct;
      setScrollPct(pct);
    }
  }, []);

  /** Lessons that fit on one screen (no scrolling possible) count as fully viewed. */
  const markVisibleAll = useCallback(() => {
    if (scrollPctRef.current < 100) {
      scrollPctRef.current = 100;
      dirtyRef.current = true;
      setScrollPct(100);
    }
  }, []);

  const onInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  /** PDF lessons: report progress as a percentage (max reached counts). */
  const reportProgress = useCallback((pct: number) => {
    const p = Math.max(0, Math.min(100, Math.round(pct)));
    lastInteractionRef.current = Date.now();
    dirtyRef.current = true;
    if (p > scrollPctRef.current) {
      scrollPctRef.current = p;
      setScrollPct(p);
    }
  }, []);

  /** PDF lessons: report current/total page (drives progress + resume + "Page X of Y"). */
  const reportPages = useCallback(
    (cur: number, total: number) => {
      pageRef.current = cur;
      totalPagesRef.current = total;
      setCurrentPage(cur);
      setTotalPages(total);
      reportProgress(total > 0 ? (cur / total) * 100 : 0);
    },
    [reportProgress]
  );

  const markComplete = useCallback(async (): Promise<boolean> => {
    if (!lesson || !userId) return false;
    completedRef.current = true;
    try {
      await userProgressService.completeLesson({
        userId,
        courseId,
        chapterId,
        lessonId: lesson.id,
        timeSpentSeconds: timeRef.current,
        scrollPercentage: Math.max(scrollPctRef.current, MIN_SCROLL_PERCENT),
        lastScrollPosition: scrollPosRef.current,
        currentPage: pageRef.current,
        totalPages: totalPagesRef.current,
        startedAt: startedAtRef.current,
      });
      return true;
    } catch {
      completedRef.current = false;
      return false;
    }
  }, [lesson?.id, userId, courseId, chapterId]);

  const canComplete = timeSpent >= requiredSeconds && scrollPct >= MIN_SCROLL_PERCENT;
  const remainingSeconds = Math.max(0, requiredSeconds - timeSpent);

  return {
    timeSpent,
    scrollPct,
    currentPage,
    totalPages,
    resumePage,
    loadingProgress,
    restoreOffset,
    alreadyCompleted,
    requiredSeconds,
    requiredMinutes,
    remainingSeconds,
    canComplete,
    onScroll,
    onInteraction,
    reportProgress,
    reportPages,
    markVisibleAll,
    markComplete,
  };
}
