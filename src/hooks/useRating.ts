import { useCallback } from "react";
import { useRatingStore } from "../stores/ratingStore";
import { RatingManager } from "../rating/RatingManager";
import { RatingSignal } from "../rating/types";

/**
 * Record an engagement signal from a completed lesson / quiz / job unlock.
 *
 * This NEVER interrupts the current flow — the call site is usually a protected
 * screen (a lesson, quiz, or the job-unlock modal). Instead it bumps the
 * relevant engagement counter and "arms" a pending source, so the rating
 * prompt can appear a moment later once the user is back on a safe screen.
 * Fire-and-forget from anywhere.
 */
export function recordRatingSignal(signal: RatingSignal): void {
  const store = useRatingStore.getState();
  switch (signal) {
    case "lesson":
      store.incEngagement("lessonsCompleted");
      break;
    case "quiz":
      store.incEngagement("quizzesCompleted");
      break;
    case "job_unlock":
      store.incEngagement("jobsUnlocked");
      break;
  }
  store.armPending(signal);
}

export function useRatingSignal() {
  return useCallback((signal: RatingSignal) => recordRatingSignal(signal), []);
}

/**
 * Suspend the rating prompt for the duration of a transient flow that has no
 * protected screen of its own — payment, certificate generation, or the
 * job-unlock modal. Auto-resumes even if `fn` throws.
 *
 *   await withRatingSuspended(() => runPaymentFlow());
 */
export function withRatingSuspended<T>(fn: () => Promise<T>): Promise<T> {
  return RatingManager.during(fn);
}

/** Bind the live prompt state + handlers for a modal component. */
export function useRatingPrompt() {
  const visible = useRatingStore((s) => s.promptVisible);
  const source = useRatingStore((s) => s.promptSource);

  const onRate = useCallback(() => RatingManager.rateApp(), []);
  const onMaybeLater = useCallback(() => RatingManager.maybeLater(), []);
  const onNoThanks = useCallback(() => RatingManager.noThanks(), []);

  return { visible, source, onRate, onMaybeLater, onNoThanks };
}
