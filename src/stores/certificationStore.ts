import { create } from "zustand";
import { certApi } from "../certification/api";
import { CertAttempt, CertResult, CertReview, CertStatus } from "../certification/types";

/**
 * Certification store — wraps the server RPCs. Holds the hub status, the active
 * attempt (with the server `expires_at`), the latest result, and a review. All
 * authority (scoring, timer, eligibility) lives server-side; this store is a
 * thin, resilient client cache. Phase 3 builds the screens on top of it.
 */
interface CertificationState {
  status: CertStatus | null;
  activeAttempt: CertAttempt | null;
  lastResult: CertResult | null;
  review: CertReview | null;
  loading: boolean;
  error: string | null;

  refreshStatus: () => Promise<CertStatus | null>;
  resumeActive: () => Promise<CertAttempt | null>;
  recordAd: () => Promise<CertStatus | null>;
  startAttempt: () => Promise<CertAttempt | null>;
  saveAnswer: (questionId: string, selected: string | null) => Promise<void>;
  submit: () => Promise<CertResult | null>;
  loadReview: (attemptId: string) => Promise<CertReview | null>;
  reset: () => void;
}

export const useCertificationStore = create<CertificationState>((set, get) => ({
  status: null,
  activeAttempt: null,
  lastResult: null,
  review: null,
  loading: false,
  error: null,

  refreshStatus: async () => {
    set({ loading: true, error: null });
    try {
      const status = await certApi.status();
      set({ status, loading: false });
      return status;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load status", loading: false });
      return null;
    }
  },

  resumeActive: async () => {
    try {
      const res = await certApi.getActiveAttempt();
      if (res.active && res.attempt) {
        set({ activeAttempt: res.attempt });
        return res.attempt;
      }
      // Expired while away → server auto-submitted; surface the result.
      if (res.expired && res.result) set({ activeAttempt: null, lastResult: res.result });
      else set({ activeAttempt: null });
      return null;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to resume attempt" });
      return null;
    }
  },

  recordAd: async () => {
    try {
      const status = await certApi.recordAd();
      set({ status });
      return status;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to record ad" });
      return null;
    }
  },

  startAttempt: async () => {
    set({ loading: true, error: null });
    try {
      const attempt = await certApi.startAttempt();
      set({ activeAttempt: attempt, lastResult: null, review: null, loading: false });
      return attempt;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to start attempt", loading: false });
      return null;
    }
  },

  saveAnswer: async (questionId, selected) => {
    const attempt = get().activeAttempt;
    if (!attempt) return;
    // Optimistic local update so the runner UI stays responsive offline.
    set({
      activeAttempt: {
        ...attempt,
        questions: attempt.questions.map((q) =>
          q.id === questionId ? { ...q, selected_answer: selected } : q
        ),
      },
    });
    try {
      await certApi.saveAnswer(attempt.attempt_id, questionId, selected);
    } catch {
      // Autosave is best-effort; final answers are re-sent on submit.
    }
  },

  submit: async () => {
    const attempt = get().activeAttempt;
    if (!attempt) return null;
    try {
      const result = await certApi.submitAttempt(attempt.attempt_id);
      set({ activeAttempt: null, lastResult: result });
      await get().refreshStatus();
      return result;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to submit attempt" });
      return null;
    }
  },

  loadReview: async (attemptId) => {
    try {
      const review = await certApi.review(attemptId);
      set({ review });
      return review;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load review" });
      return null;
    }
  },

  reset: () => set({ activeAttempt: null, lastResult: null, review: null, error: null }),
}));
