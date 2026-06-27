/**
 * Forward-looking architecture for user-feedback surfaces beyond the Play Store
 * rating. Nothing here is wired into the UI yet — it defines the contracts so
 * the rating engine, analytics, and modal infrastructure can be reused for:
 *
 *   - iOS App Store reviews (already handled platform-agnostically in StoreReview)
 *   - a custom in-app feedback form
 *   - a bug-report form
 *   - a feature-request form
 *   - periodic user-satisfaction surveys (e.g. NPS / CSAT)
 *
 * Implementations should persist via a store mirroring `ratingStore` and gate
 * appearance through the same eligibility/frequency primitives in RatingManager.
 */

export type FeedbackKind =
  | "app_review"
  | "feedback_form"
  | "bug_report"
  | "feature_request"
  | "satisfaction_survey";

export interface FeedbackSubmission {
  kind: FeedbackKind;
  /** Free-text body (form/bug/feature) or null for a pure rating. */
  message?: string;
  /** 1–5 satisfaction / star rating where applicable. */
  rating?: number;
  /** Arbitrary structured answers for surveys. */
  answers?: Record<string, string | number | boolean>;
  /** Attribution so analytics can compare channels. */
  source?: string;
  createdAt: number;
}

/** A pluggable channel that knows how to collect one kind of feedback. */
export interface FeedbackChannel {
  kind: FeedbackKind;
  /** Whether this channel is currently eligible to be shown. */
  isEligible: () => boolean | Promise<boolean>;
  /** Persist / transmit a submission (Supabase, email, analytics, …). */
  submit: (submission: FeedbackSubmission) => Promise<void>;
}

const channels = new Map<FeedbackKind, FeedbackChannel>();

/** Register a feedback channel (called from a future feature's bootstrap). */
export function registerFeedbackChannel(channel: FeedbackChannel): void {
  channels.set(channel.kind, channel);
}

export function getFeedbackChannel(kind: FeedbackKind): FeedbackChannel | undefined {
  return channels.get(kind);
}

/** Submit through a registered channel; no-ops safely if none is registered. */
export async function submitFeedback(submission: FeedbackSubmission): Promise<void> {
  const channel = channels.get(submission.kind);
  if (!channel) return;
  await channel.submit(submission);
}
