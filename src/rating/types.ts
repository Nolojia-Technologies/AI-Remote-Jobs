/**
 * Types for the app rating / review system.
 *
 * The architecture is intentionally provider-agnostic so the same engine can
 * later drive Apple App Store reviews, a custom feedback form, a bug-report
 * form, a feature-request form, or satisfaction surveys (see `feedback.ts`).
 */

/** What caused us to (attempt to) surface the rating prompt. */
export type RatingSource =
  | "random_session"
  | "exit_app"
  | "lesson"
  | "quiz"
  | "job_unlock";

/** Engagement signals that feed the eligibility check (and prompt attribution). */
export type RatingSignal = "lesson" | "quiz" | "job_unlock";

/** The choice a user made the last time the prompt was shown. */
export type RatingChoice = "rate" | "later" | "no_thanks" | null;

/** Cumulative engagement metrics used to decide if a user is "engaged enough". */
export interface RatingEngagement {
  lessonsCompleted: number;
  quizzesCompleted: number;
  jobsUnlocked: number;
  /** Distinct app opens (sessions started). */
  appOpens: number;
  /** Total foreground time across the app's lifetime, in milliseconds. */
  totalActiveMs: number;
}

/** Everything we persist locally about the rating lifecycle. */
export interface RatingPersistedState {
  /** How many times the prompt has been shown to this user. */
  timesShown: number;
  /** Epoch ms of the last time the prompt was shown (null = never). */
  lastShownAt: number | null;
  /** The user's most recent choice. */
  lastChoice: RatingChoice;
  /** Epoch ms before which we must not show the prompt again. */
  cooldownUntil: number | null;
  /** True once a review has been completed (best effort — see StoreReview). */
  reviewCompleted: boolean;
  /** Engagement counters. */
  engagement: RatingEngagement;
}
