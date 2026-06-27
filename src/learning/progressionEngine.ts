import { ModuleWithProgress } from "../types/app.types";
import { PROGRESSION, STAGES, levelToStage } from "./config";
import { Chapter, ChapterProgress, ChapterStatus, ProgressionState, QuizGate } from "./types";

const STAGE_ORDER = STAGES.reduce(
  (acc, s, i) => ({ ...acc, [s.id]: i }),
  {} as Record<string, number>
);

/**
 * Pure progression brain. No side effects — every function takes raw state
 * (+ now) and returns a derived value. The store applies the mutations.
 */
export const ProgressionEngine = {
  // ─── Chapter assembly ──────────────────────────────────────
  buildChapters(modules: ModuleWithProgress[]): Chapter[] {
    const sorted = [...modules].sort((a, b) => {
      const sa = STAGE_ORDER[levelToStage(a.level)] ?? 99;
      const sb = STAGE_ORDER[levelToStage(b.level)] ?? 99;
      if (sa !== sb) return sa - sb;
      return a.order_index - b.order_index;
    });
    return sorted.map((m, i) => ({
      ...m,
      stage: levelToStage(m.level),
      chapterIndex: i + 1,
      isMilestone: (i + 1) % PROGRESSION.milestoneEvery === 0,
    }));
  },

  // ─── Energy ────────────────────────────────────────────────
  /** Regen-aware current energy (does not mutate). */
  getEnergy(state: ProgressionState, now: number): number {
    const { max, regenIntervalMs } = PROGRESSION.energy;
    if (state.energy >= max) return max;
    const regen = Math.floor((now - state.energyUpdatedAt) / regenIntervalMs);
    return Math.min(max, state.energy + Math.max(0, regen));
  },

  /** Timestamp of the next +1 energy regen, or null if full. */
  nextEnergyAt(state: ProgressionState, now: number): number | null {
    const { max, regenIntervalMs } = PROGRESSION.energy;
    if (this.getEnergy(state, now) >= max) return null;
    const elapsed = now - state.energyUpdatedAt;
    const sinceLast = elapsed % regenIntervalMs;
    return now + (regenIntervalMs - sinceLast);
  },

  // ─── Daily limits ──────────────────────────────────────────
  effectiveDailyLimit(state: ProgressionState): number {
    return PROGRESSION.daily.baseChapters + (state.bonusChapterUsed ? PROGRESSION.daily.bonusChapters : 0);
  },

  dailyLimitReached(state: ProgressionState): boolean {
    return state.chaptersToday >= this.effectiveDailyLimit(state);
  },

  bonusAvailable(state: ProgressionState): boolean {
    return !state.bonusChapterUsed && state.chaptersToday >= PROGRESSION.daily.baseChapters;
  },

  // ─── Quiz gating ───────────────────────────────────────────
  passMarkFor(chapter: Chapter): number {
    return chapter.isMilestone ? PROGRESSION.quiz.milestonePassMark : PROGRESSION.quiz.passMark;
  },

  attemptsLeft(cp: ChapterProgress | undefined): number {
    const used = cp?.quizAttempts ?? 0;
    return Math.max(0, PROGRESSION.quiz.maxAttempts - used);
  },

  hasPartialQuiz(cp: ChapterProgress | undefined): boolean {
    return !!cp && cp.quizStatus === "abandoned" && Object.keys(cp.quizAnswers ?? {}).length > 0;
  },

  /** Full quiz-gate status: available / abandon-locked / cooldown / passed. */
  quizGate(cp: ChapterProgress | undefined, now: number): QuizGate {
    const c = cp ?? {
      quizAttempts: 0,
      quizPassed: false,
      quizStatus: "idle" as const,
      quizAnswers: {},
      retryAvailableAt: null,
      abandonLockUntil: null,
    } as ChapterProgress;

    if (c.quizPassed) {
      return { kind: "passed", canStart: false, availableAt: null, attemptsLeft: 0, hasPartial: false };
    }
    if (c.abandonLockUntil && now < c.abandonLockUntil) {
      return {
        kind: "abandon_locked",
        canStart: false,
        availableAt: c.abandonLockUntil,
        attemptsLeft: this.attemptsLeft(c),
        hasPartial: this.hasPartialQuiz(c),
      };
    }
    if (c.retryAvailableAt && now < c.retryAvailableAt) {
      return {
        kind: "cooldown",
        canStart: false,
        availableAt: c.retryAvailableAt,
        attemptsLeft: this.attemptsLeft(c),
        hasPartial: this.hasPartialQuiz(c),
      };
    }
    // available — a passed cooldown means a fresh round of attempts
    const cooldownCleared = c.retryAvailableAt != null && now >= c.retryAvailableAt;
    const effectiveAttempts = cooldownCleared ? 0 : c.quizAttempts;
    return {
      kind: "available",
      canStart: true,
      availableAt: null,
      attemptsLeft: Math.max(0, PROGRESSION.quiz.maxAttempts - effectiveAttempts),
      hasPartial: this.hasPartialQuiz(c),
    };
  },

  // ─── Chapter lock status ───────────────────────────────────
  chapterStatus(
    orderedIds: string[],
    index: number,
    state: ProgressionState,
    now: number
  ): ChapterStatus {
    const id = orderedIds[index];
    const cp = state.chapters[id];
    if (cp?.quizPassed) return { kind: "completed" };

    // First chapter is always available.
    if (index === 0) return { kind: "active" };

    const prevId = orderedIds[index - 1];
    const prev = state.chapters[prevId];
    if (!prev?.quizPassed) {
      return { kind: "locked", reason: "Complete the previous chapter first" };
    }

    const autoUnlockAt = (prev.completedAt ?? now) + PROGRESSION.unlock.autoUnlockMs;
    const timeUnlocked = now >= autoUnlockAt;
    const unlocked = cp?.unlockedManually || timeUnlocked;

    // Daily limit gates *unlocking the next* chapter.
    if (this.dailyLimitReached(state) && !cp?.unlockedManually) {
      return {
        kind: "locked",
        reason: "Daily learning limit reached",
        dailyBlocked: true,
        bonusAvailable: this.bonusAvailable(state),
        autoUnlockAt,
      };
    }

    if (unlocked) return { kind: "active" };

    return {
      kind: "locked",
      reason: "Unlock to continue",
      canUnlockWithAd: true,
      autoUnlockAt,
    };
  },

  /** Index of the next chapter the user should work on (first non-completed active). */
  nextActiveIndex(orderedIds: string[], state: ProgressionState, now: number): number {
    for (let i = 0; i < orderedIds.length; i++) {
      const st = this.chapterStatus(orderedIds, i, state, now);
      if (st.kind === "active") return i;
    }
    return -1;
  },
};
