import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PROGRESSION } from "../learning/config";
import { ChapterProgress, ProgressionState } from "../learning/types";
import { ProgressionEngine } from "../learning/progressionEngine";
import { recordRatingSignal } from "../hooks/useRating";

function todayStr(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

function emptyChapter(): ChapterProgress {
  return {
    quizAttempts: 0,
    quizPassed: false,
    completedAt: null,
    unlockedManually: false,
    quizStatus: "idle",
    quizAnswers: {},
    quizCurrentIndex: 0,
    retryAvailableAt: null,
    abandonLockUntil: null,
  };
}

const initial: ProgressionState = {
  energy: PROGRESSION.energy.dailyGrant,
  energyUpdatedAt: Date.now(),
  dailyDate: todayStr(),
  chaptersToday: 0,
  bonusChapterUsed: false,
  lastDailyGrantDate: todayStr(),
  chapters: {},
};

interface ProgressionStore extends ProgressionState {
  hydrated: boolean;
  userId: string | null;

  hydrate: (userId: string) => Promise<void>;
  normalize: () => void;
  consumeEnergy: () => boolean;
  restoreEnergy: (n?: number) => void;
  unlockChapter: (chapterId: string) => void;
  useBonusChapter: () => void;
  getChapter: (chapterId: string) => ChapterProgress;
  // Quiz session lifecycle
  startQuizSession: (chapterId: string) => void;
  saveQuizProgress: (chapterId: string, answers: Record<number, string>, currentIndex: number) => void;
  abandonQuizSession: (chapterId: string) => void;
  submitQuizResult: (
    chapterId: string,
    passed: boolean
  ) => { passed: boolean; cooldown: boolean; attemptsLeft: number };
  adRetryQuiz: (chapterId: string) => void; // rewarded: clear lock/cooldown, grant fresh attempts
}

function key(userId: string) {
  return `@aha/progression/${userId}`;
}

function persist(userId: string | null, state: ProgressionState) {
  if (!userId) return;
  const data: ProgressionState = {
    energy: state.energy,
    energyUpdatedAt: state.energyUpdatedAt,
    dailyDate: state.dailyDate,
    chaptersToday: state.chaptersToday,
    bonusChapterUsed: state.bonusChapterUsed,
    lastDailyGrantDate: state.lastDailyGrantDate,
    chapters: state.chapters,
  };
  AsyncStorage.setItem(key(userId), JSON.stringify(data)).catch(() => {});
}

export const useProgressionStore = create<ProgressionStore>((set, get) => ({
  ...initial,
  hydrated: false,
  userId: null,

  hydrate: async (userId) => {
    set({ userId });
    try {
      const raw = await AsyncStorage.getItem(key(userId));
      if (raw) {
        const data = JSON.parse(raw) as ProgressionState;
        set({ ...data });
      }
    } catch {
      // ignore
    }
    get().normalize();
    set({ hydrated: true });
  },

  /** Fold in energy regen, daily energy grant, and daily chapter reset. */
  normalize: () => {
    const now = Date.now();
    const s = get();
    const today = todayStr();
    let { energy, energyUpdatedAt, lastDailyGrantDate, dailyDate, chaptersToday, bonusChapterUsed } = s;
    const { max, regenIntervalMs, dailyGrant } = PROGRESSION.energy;

    // passive regen
    if (energy < max) {
      const regen = Math.floor((now - energyUpdatedAt) / regenIntervalMs);
      if (regen > 0) {
        energy = Math.min(max, energy + regen);
        energyUpdatedAt = energy >= max ? now : energyUpdatedAt + regen * regenIntervalMs;
      }
    }

    // daily energy grant (once per day)
    if (lastDailyGrantDate !== today) {
      energy = Math.min(max, energy + dailyGrant);
      lastDailyGrantDate = today;
    }

    // daily chapter reset
    if (dailyDate !== today) {
      dailyDate = today;
      chaptersToday = 0;
      bonusChapterUsed = false;
    }

    set({ energy, energyUpdatedAt, lastDailyGrantDate, dailyDate, chaptersToday, bonusChapterUsed });
    persist(get().userId, get());
  },

  consumeEnergy: () => {
    get().normalize();
    const now = Date.now();
    const energy = ProgressionEngine.getEnergy(get(), now);
    if (energy < PROGRESSION.energy.costPerLesson) return false;
    set({ energy: energy - PROGRESSION.energy.costPerLesson, energyUpdatedAt: now });
    persist(get().userId, get());
    return true;
  },

  restoreEnergy: (n = PROGRESSION.energy.adRestore) => {
    get().normalize();
    const now = Date.now();
    const energy = Math.min(PROGRESSION.energy.max, ProgressionEngine.getEnergy(get(), now) + n);
    set({ energy, energyUpdatedAt: now });
    persist(get().userId, get());
  },

  // ─── Quiz session lifecycle ────────────────────────────────
  startQuizSession: (chapterId) => {
    const now = Date.now();
    const chapters = { ...get().chapters };
    const cp = { ...(chapters[chapterId] ?? emptyChapter()) };

    // A passed cooldown resets the round of attempts.
    if (cp.retryAvailableAt && now >= cp.retryAvailableAt) {
      cp.quizAttempts = 0;
      cp.retryAvailableAt = null;
    }
    // Resume an abandoned session (keep saved answers); otherwise start fresh.
    if (cp.quizStatus !== "abandoned") {
      cp.quizAnswers = {};
      cp.quizCurrentIndex = 0;
    }
    cp.quizStatus = "in_progress";
    cp.abandonLockUntil = null;
    chapters[chapterId] = cp;
    set({ chapters });
    persist(get().userId, get());
  },

  saveQuizProgress: (chapterId, answers, currentIndex) => {
    const chapters = { ...get().chapters };
    const cp = { ...(chapters[chapterId] ?? emptyChapter()) };
    if (cp.quizPassed) return;
    cp.quizAnswers = answers;
    cp.quizCurrentIndex = currentIndex;
    chapters[chapterId] = cp;
    set({ chapters });
    persist(get().userId, get());
  },

  abandonQuizSession: (chapterId) => {
    const now = Date.now();
    const chapters = { ...get().chapters };
    const cp = { ...(chapters[chapterId] ?? emptyChapter()) };
    // Only an in-progress, not-yet-passed quiz can be abandoned.
    if (cp.quizStatus !== "in_progress" || cp.quizPassed) return;
    cp.quizStatus = "abandoned";
    cp.abandonLockUntil = now + PROGRESSION.quiz.abandonLockMs;
    chapters[chapterId] = cp;
    set({ chapters });
    persist(get().userId, get());
  },

  submitQuizResult: (chapterId, passed) => {
    get().normalize();
    const now = Date.now();
    const chapters = { ...get().chapters };
    const cp = { ...(chapters[chapterId] ?? emptyChapter()) };

    cp.quizAttempts += 1;
    cp.quizAnswers = {};
    cp.quizCurrentIndex = 0;
    cp.quizStatus = "idle";
    cp.abandonLockUntil = null;
    let cooldown = false;

    if (passed) {
      const already = cp.quizPassed;
      cp.quizPassed = true;
      cp.completedAt = cp.completedAt ?? now;
      cp.retryAvailableAt = null;
      chapters[chapterId] = cp;
      const chaptersToday = already ? get().chaptersToday : get().chaptersToday + 1;
      set({ chapters, chaptersToday });
      if (!already) recordRatingSignal("quiz");
    } else {
      const maxed = cp.quizAttempts >= PROGRESSION.quiz.maxAttempts;
      cp.retryAvailableAt = now + (maxed ? PROGRESSION.quiz.cooldownAfterMaxMs : PROGRESSION.quiz.failRetryWaitMs);
      cooldown = maxed;
      chapters[chapterId] = cp;
      set({ chapters });
    }

    persist(get().userId, get());
    return { passed, cooldown, attemptsLeft: ProgressionEngine.attemptsLeft(cp) };
  },

  adRetryQuiz: (chapterId) => {
    const chapters = { ...get().chapters };
    const cp = { ...(chapters[chapterId] ?? emptyChapter()) };
    // Rewarded ad clears any lock/cooldown and grants a fresh round of attempts.
    cp.retryAvailableAt = null;
    cp.abandonLockUntil = null;
    if (cp.quizAttempts >= PROGRESSION.quiz.maxAttempts) cp.quizAttempts = 0;
    chapters[chapterId] = cp;
    set({ chapters });
    persist(get().userId, get());
  },

  unlockChapter: (chapterId) => {
    const chapters = { ...get().chapters };
    chapters[chapterId] = { ...(chapters[chapterId] ?? emptyChapter()), unlockedManually: true };
    set({ chapters });
    persist(get().userId, get());
  },

  useBonusChapter: () => {
    set({ bonusChapterUsed: true });
    persist(get().userId, get());
  },

  getChapter: (chapterId) => get().chapters[chapterId] ?? emptyChapter(),
}));
