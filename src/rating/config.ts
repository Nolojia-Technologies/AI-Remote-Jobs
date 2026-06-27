import { AdScreen } from "../ads/types";

/**
 * Tunables for the rating system. Centralised so the "feel" of the prompt can
 * be adjusted without touching the engine logic.
 */
export const RATING_CONFIG = {
  /** A user is eligible if ANY one of these engagement thresholds is met. */
  eligibility: {
    minLessons: 3,
    minQuizzes: 2,
    minActiveMs: 20 * 60 * 1000, // 20 minutes total in-app time
    minAppOpens: 5,
    minJobsUnlocked: 1,
  },

  /** Frequency caps. */
  frequency: {
    /** Minimum gap between any two prompts (a "Maybe Later" also enforces this). */
    minGapMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    /** Cooldown applied after the user taps "No Thanks". */
    noThanksCooldownMs: 60 * 24 * 60 * 60 * 1000, // 60 days
    /** Cooldown applied after the user taps "Maybe Later". */
    maybeLaterCooldownMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    /** Cooldown applied after a review is launched (so we never re-ask). */
    reviewedCooldownMs: 365 * 24 * 60 * 60 * 1000, // ~never again
  },

  /** Randomised appearance so the prompt feels natural and unpredictable. */
  random: {
    /** Per-eligible-session chance window: a value is picked in [min, max]. */
    minChance: 0.1, // 10%
    maxChance: 0.2, // 20%
    /** The exit-app trigger is rarer still — only occasionally on exit. */
    exitChance: 0.35,
  },

  /** Timing guards. */
  timing: {
    /** Never show within this long of the app launching / session starting. */
    minSessionAgeMs: 90 * 1000, // 90s after launch
    /** Treat a prompt as off-limits if an ad was shown this recently. */
    recentAdGuardMs: 6 * 1000,
    /** A pending engagement signal stays "armed" for this long. */
    pendingSignalTtlMs: 10 * 60 * 1000, // 10 minutes
  },

  /** Play Store listing for the fallback redirect (Android package id). */
  android: {
    packageName: "com.aihustleacademy.app",
  },
} as const;

/**
 * Screens where the prompt must NEVER appear — quizzes, lessons, the job-unlock
 * flow, payment/certificate flows, ad surfaces, onboarding and auth. The engine
 * also respects an imperative suspend() for flows without a dedicated screen
 * (rewarded/interstitial ads, in-progress payments).
 */
export const RATING_PROTECTED_SCREENS: ReadonlySet<AdScreen> = new Set<AdScreen>([
  "lesson",
  "quiz",
  "challenge_detail",
  "job_detail",
  "application",
  "certificates",
  "onboarding",
  "auth",
]);

/** Tab/list screens where it is safe and natural to surface the prompt. */
export const RATING_SAFE_SCREENS: ReadonlySet<AdScreen> = new Set<AdScreen>([
  "home",
  "learn",
  "jobs",
  "challenges",
  "profile",
]);
