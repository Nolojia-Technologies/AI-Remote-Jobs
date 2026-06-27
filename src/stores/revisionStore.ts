import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DayActivity, LessonReview, RevisionState, RevisionSessionResult } from "../revision/types";
import { RevisionEngine } from "../revision/revisionEngine";
import { REVISION_XP, MEMORY_BADGES } from "../revision/config";
import { useUserStore } from "./userStore";

function todayStr(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

function emptyDay(): DayActivity {
  return { lessons: 0, revisions: 0, challenges: 0, xp: 0, milestone: false };
}

const initial: RevisionState = {
  reviews: {},
  revisionStreak: 0,
  lastRevisionDate: null,
  chestSessions: 0,
  chestClaimedTier: -1,
  earnedBadges: [],
  history: {},
  revisionXpToday: 0,
  goalDate: todayStr(),
};

interface RevisionStore extends RevisionState {
  hydrated: boolean;
  userId: string | null;

  hydrate: (userId: string) => Promise<void>;
  normalize: () => void;
  scheduleLesson: (lessonId: string, moduleId: string, topic: string) => void;
  recordReviewResult: (lessonId: string, correct: boolean) => void;
  completeSession: (correct: number, total: number, topics: string[]) => RevisionSessionResult;
  recordActivity: (kind: "lesson" | "revision" | "challenge" | "milestone", xp: number) => void;
  claimChest: () => void;
}

function key(userId: string) {
  return `@aha/revision/${userId}`;
}

function persist(userId: string | null, s: RevisionState) {
  if (!userId) return;
  const data: RevisionState = {
    reviews: s.reviews,
    revisionStreak: s.revisionStreak,
    lastRevisionDate: s.lastRevisionDate,
    chestSessions: s.chestSessions,
    chestClaimedTier: s.chestClaimedTier,
    earnedBadges: s.earnedBadges,
    history: s.history,
    revisionXpToday: s.revisionXpToday,
    goalDate: s.goalDate,
  };
  AsyncStorage.setItem(key(userId), JSON.stringify(data)).catch(() => {});
}

export const useRevisionStore = create<RevisionStore>((set, get) => ({
  ...initial,
  hydrated: false,
  userId: null,

  hydrate: async (userId) => {
    set({ userId });
    try {
      const raw = await AsyncStorage.getItem(key(userId));
      if (raw) set({ ...(JSON.parse(raw) as RevisionState) });
    } catch {
      // ignore
    }
    get().normalize();
    set({ hydrated: true });
  },

  normalize: () => {
    const today = todayStr();
    if (get().goalDate !== today) {
      set({ goalDate: today, revisionXpToday: 0 });
      persist(get().userId, get());
    }
  },

  scheduleLesson: (lessonId, moduleId, topic) => {
    const now = Date.now();
    const reviews = { ...get().reviews };
    // Don't reset an existing schedule (preserve memory strength on re-complete).
    if (!reviews[lessonId]) {
      reviews[lessonId] = RevisionEngine.scheduleNew(lessonId, moduleId, topic, now);
      set({ reviews });
      persist(get().userId, get());
    }
  },

  recordReviewResult: (lessonId, correct) => {
    const now = Date.now();
    const reviews = { ...get().reviews };
    const r = reviews[lessonId];
    if (!r) return;
    reviews[lessonId] = RevisionEngine.applyResult(r, correct, now);
    set({ reviews });
    persist(get().userId, get());
  },

  completeSession: (correct, total, topics) => {
    get().normalize();
    const today = todayStr();
    const now = Date.now();

    // XP
    const xpEarned = Math.min(
      REVISION_XP.sessionMax,
      REVISION_XP.sessionBase + correct * REVISION_XP.perCorrect
    );

    // Revision streak (once per day)
    let { revisionStreak, lastRevisionDate, earnedBadges } = get();
    if (lastRevisionDate !== today) {
      const y = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      revisionStreak = lastRevisionDate === y ? revisionStreak + 1 : 1;
      lastRevisionDate = today;
      // award streak badges
      for (const b of MEMORY_BADGES) {
        if (revisionStreak >= b.streakDays && !earnedBadges.includes(b.id)) {
          earnedBadges = [...earnedBadges, b.id];
        }
      }
    }

    // Chest + history
    const chestSessions = get().chestSessions + 1;
    const history = { ...get().history };
    const day = { ...(history[today] ?? emptyDay()) };
    day.revisions += 1;
    day.xp += xpEarned;
    history[today] = day;

    set({
      revisionStreak,
      lastRevisionDate,
      earnedBadges,
      chestSessions,
      history,
      revisionXpToday: get().revisionXpToday + xpEarned,
    });
    persist(get().userId, get());

    // Award XP to the profile
    const uid = get().userId;
    if (uid) {
      useUserStore.getState().awardXP(uid, xpEarned, "revision", "Revision session complete");
    }

    return { correct, total, xpEarned, topicsStrengthened: Array.from(new Set(topics)) };
  },

  recordActivity: (kind, xp) => {
    const today = todayStr();
    const history = { ...get().history };
    const day = { ...(history[today] ?? emptyDay()) };
    if (kind === "lesson") day.lessons += 1;
    else if (kind === "revision") day.revisions += 1;
    else if (kind === "challenge") day.challenges += 1;
    else if (kind === "milestone") day.milestone = true;
    day.xp += xp;
    history[today] = day;
    set({ history });
    persist(get().userId, get());
  },

  claimChest: () => {
    const claimable = RevisionEngine.claimableTierIndex(get());
    if (claimable < 0) return;
    set({ chestClaimedTier: claimable });
    persist(get().userId, get());
  },
}));
