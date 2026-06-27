import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persists the post-completion cooldown gate so it survives app restarts —
 * a learner who closes the app mid-cooldown resumes exactly where they were
 * (spec: "save cooldown timer … resume exactly where the learner left off").
 *
 * Keyed by the COMPLETED lesson's id: `gates[lessonId]` describes the gate that
 * guards whatever comes after that lesson. `bypassed` is set once a rewarded ad
 * has unlocked it, so the gate never re-locks.
 */
const STORAGE_KEY = "@aha/course-gate/v1";

interface Gate {
  /** Epoch ms when the cooldown ends. */
  cooldownUntil: number;
  /** True once a rewarded ad has unlocked the next lesson. */
  bypassed: boolean;
}

interface CourseGateStore {
  gates: Record<string, Gate>;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  /** Begin a cooldown after completing `lessonId` (no-op if already bypassed). */
  startCooldown: (lessonId: string, ms: number) => void;
  /** Mark the gate after `lessonId` as unlocked via a rewarded ad. */
  bypass: (lessonId: string) => void;
  /** Remaining cooldown in ms (0 if none / expired / bypassed). */
  remainingMs: (lessonId: string, now?: number) => number;
  /** True while the gate after `lessonId` is still holding the next lesson. */
  isGated: (lessonId: string, now?: number) => boolean;
}

function persist(gates: Record<string, Gate>) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gates)).catch(() => {});
}

/** Drop gates whose cooldown ended a while ago to keep storage small. */
function prune(gates: Record<string, Gate>, now: number): Record<string, Gate> {
  const out: Record<string, Gate> = {};
  for (const [id, g] of Object.entries(gates)) {
    // keep active cooldowns and recently-resolved ones (24h) for resume safety
    if (!g.bypassed && (g.cooldownUntil > now || now - g.cooldownUntil < 24 * 3600_000)) out[id] = g;
  }
  return out;
}

export const useCourseGateStore = create<CourseGateStore>((set, get) => ({
  gates: {},
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const gates = raw ? prune(JSON.parse(raw) as Record<string, Gate>, Date.now()) : {};
      set({ gates, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  startCooldown: (lessonId, ms) => {
    const existing = get().gates[lessonId];
    if (existing?.bypassed) return; // already unlocked — never re-lock
    const gates = { ...get().gates, [lessonId]: { cooldownUntil: Date.now() + ms, bypassed: false } };
    set({ gates });
    persist(gates);
  },

  bypass: (lessonId) => {
    const gates = { ...get().gates, [lessonId]: { cooldownUntil: Date.now(), bypassed: true } };
    set({ gates });
    persist(gates);
  },

  remainingMs: (lessonId, now = Date.now()) => {
    const g = get().gates[lessonId];
    if (!g || g.bypassed) return 0;
    return Math.max(0, g.cooldownUntil - now);
  },

  isGated: (lessonId, now = Date.now()) => {
    const g = get().gates[lessonId];
    return !!g && !g.bypassed && g.cooldownUntil > now;
  },
}));
