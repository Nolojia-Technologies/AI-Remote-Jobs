import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RatingChoice,
  RatingPersistedState,
  RatingSignal,
  RatingSource,
} from "../rating/types";

const STORAGE_KEY = "@aha/rating/v1";

function emptyEngagement(): RatingPersistedState["engagement"] {
  return {
    lessonsCompleted: 0,
    quizzesCompleted: 0,
    jobsUnlocked: 0,
    appOpens: 0,
    totalActiveMs: 0,
  };
}

const initialPersisted: RatingPersistedState = {
  timesShown: 0,
  lastShownAt: null,
  lastChoice: null,
  cooldownUntil: null,
  reviewCompleted: false,
  engagement: emptyEngagement(),
};

interface RatingStore extends RatingPersistedState {
  hydrated: boolean;

  // ─── Ephemeral (per-session) state, never persisted ───────────
  /** True once the prompt has been shown in the current session. */
  shownThisSession: boolean;
  /** Whether the prompt modal is currently visible. */
  promptVisible: boolean;
  /** Attribution for the visible prompt. */
  promptSource: RatingSource | null;
  /** An engagement signal awaiting a safe screen to (maybe) prompt on. */
  pendingSource: RatingSignal | null;
  pendingSince: number | null;

  hydrate: () => Promise<void>;

  /** Reset per-session ephemeral flags (called on cold start + each foreground). */
  startSession: () => void;

  // Engagement
  recordAppOpen: () => void;
  addActiveMs: (ms: number) => void;
  incEngagement: (key: keyof RatingPersistedState["engagement"], by?: number) => void;
  armPending: (source: RatingSignal) => void;
  consumePending: (ttlMs: number) => RatingSignal | null;

  // Prompt lifecycle
  showPrompt: (source: RatingSource) => void;
  hidePrompt: () => void;
  recordShown: () => void;
  recordChoice: (choice: RatingChoice, cooldownUntil: number) => void;
  markReviewCompleted: () => void;
}

function persist(state: RatingStore) {
  const data: RatingPersistedState = {
    timesShown: state.timesShown,
    lastShownAt: state.lastShownAt,
    lastChoice: state.lastChoice,
    cooldownUntil: state.cooldownUntil,
    reviewCompleted: state.reviewCompleted,
    engagement: state.engagement,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

export const useRatingStore = create<RatingStore>((set, get) => ({
  ...initialPersisted,
  hydrated: false,
  shownThisSession: false,
  promptVisible: false,
  promptSource: null,
  pendingSource: null,
  pendingSince: null,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Partial<RatingPersistedState>;
        set({
          timesShown: data.timesShown ?? 0,
          lastShownAt: data.lastShownAt ?? null,
          lastChoice: data.lastChoice ?? null,
          cooldownUntil: data.cooldownUntil ?? null,
          reviewCompleted: data.reviewCompleted ?? false,
          engagement: { ...emptyEngagement(), ...data.engagement },
        });
      }
    } catch {
      // ignore corrupt storage
    }
    set({ hydrated: true });
  },

  startSession: () => set({ shownThisSession: false, promptVisible: false }),

  recordAppOpen: () => {
    set((s) => ({ engagement: { ...s.engagement, appOpens: s.engagement.appOpens + 1 } }));
    persist(get());
  },

  addActiveMs: (ms) => {
    if (ms <= 0) return;
    set((s) => ({ engagement: { ...s.engagement, totalActiveMs: s.engagement.totalActiveMs + ms } }));
    persist(get());
  },

  incEngagement: (key, by = 1) => {
    set((s) => ({ engagement: { ...s.engagement, [key]: s.engagement[key] + by } }));
    persist(get());
  },

  armPending: (source) => set({ pendingSource: source, pendingSince: Date.now() }),

  consumePending: (ttlMs) => {
    const { pendingSource, pendingSince } = get();
    if (!pendingSource || !pendingSince) return null;
    set({ pendingSource: null, pendingSince: null });
    if (Date.now() - pendingSince > ttlMs) return null; // expired
    return pendingSource;
  },

  showPrompt: (source) => set({ promptVisible: true, promptSource: source }),

  hidePrompt: () => set({ promptVisible: false }),

  recordShown: () => {
    set((s) => ({
      timesShown: s.timesShown + 1,
      lastShownAt: Date.now(),
      shownThisSession: true,
    }));
    persist(get());
  },

  recordChoice: (choice, cooldownUntil) => {
    set({ lastChoice: choice, cooldownUntil });
    persist(get());
  },

  markReviewCompleted: () => {
    set({ reviewCompleted: true });
    persist(get());
  },
}));
