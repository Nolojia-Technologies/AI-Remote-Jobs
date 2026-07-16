import { AdScreen, AdType, MeaningfulAction, UserType } from "./types";

const SEC = 1000;
const MIN = 60_000;
const HOUR = 60 * MIN;

// Screens where NO interstitial/app-open may ever appear (protect the user).
export const PROTECTED_SCREENS: AdScreen[] = [
  "lesson",
  "quiz",
  "application",
  "onboarding",
  "auth",
];

// Screens allowed to show an adaptive banner.
export const BANNER_SCREENS: AdScreen[] = [
  "home",
  "jobs",
  "leaderboard",
  "profile",
  "challenges",
];

// How much each meaningful action contributes to the session action counter.
export const ACTION_WEIGHTS: Record<MeaningfulAction, number> = {
  lesson_completed: 1,
  quiz_completed: 1,
  challenge_completed: 1,
  job_viewed: 1,
  job_unlocked: 1,
  achievement_unlocked: 1,
  chapter_unlocked: 1,
  profile_completed: 1,
  daily_chest: 1,
  mystery_box: 1,
  badge_unlock: 1,
  application_submitted: 2,
  certificate_generated: 2,
  level_up: 2,
  leaderboard_promotion: 2,
  milestone_completed: 2,
};

// High-value moments that attempt an interstitial immediately (still gated by
// cooldown / session-cap / daily-limit / protected-screen).
export const FORCED_MOMENT_ACTIONS: Set<MeaningfulAction> = new Set([
  "challenge_completed",
  "job_unlocked",
  "application_submitted",
  "level_up",
  "certificate_generated",
  "milestone_completed",
  "leaderboard_promotion",
  "badge_unlock",
  "daily_chest",
  "mystery_box",
]);

export const AD_CONFIG = {
  interstitial: {
    // MAXIMUM-PRESSURE MODE (product decision 2026-07): every trigger is
    // eligible; the only pacing left is a 10s anti-double-fire guard so two
    // transitions in a row can't stack ads back-to-back (that exact pattern
    // is what AdMob flags). AdMob publishes no numeric limit — if a policy
    // warning ever arrives, restore: cooldown 45s+, thresholds 2/3, daily
    // caps 10/16/24, session caps 3/8/13/20.
    firstThreshold: 1, // first interstitial after the 1st meaningful action
    recurringThreshold: 1, // then on every eligible action
    jobViewsPerAd: 2, // Jobs tab: interstitial every 2 job views
    cooldownByType: {
      new: 10 * SEC,
      casual: 10 * SEC,
      engaged: 10 * SEC,
      power: 10 * SEC,
      whale: 10 * SEC,
      returning: 10 * SEC,
      dormant: 10 * SEC,
    } as Record<UserType, number>,
    // Caps effectively removed — the cooldown is the sole limiter.
    dailyByDay: { 1: 999, 2: 999, default: 999 },
    powerDailyLimit: 999,
    sessionCaps: [
      { upToMs: 5 * MIN, cap: 999 },
      { upToMs: 15 * MIN, cap: 999 },
      { upToMs: 30 * MIN, cap: 999 },
      { upToMs: 60 * MIN, cap: 999 },
    ],
  },
  appOpen: {
    // MAXIMUM-PRESSURE MODE (product decision 2026-07): any resume after a
    // 1-minute background counts, capped only nominally. Rollback values:
    // inactivityMs 5 * MIN, dailyLimit 15, interstitialGuardMs 15 * SEC.
    inactivityMs: 1 * MIN, // show on resume after >1 minute in background
    dailyLimit: 999,
    interstitialGuardMs: 10 * SEC,
  },
  rewarded: {
    dailyLimit: Infinity,
  },
  banner: {
    allowedScreens: BANNER_SCREENS,
  },
  ecpm: {
    rewarded: 12,
    interstitial: 8,
    app_open: 6,
    banner: 0.5,
  } as Record<Exclude<AdType, "none">, number>,
} as const;

export type AdConfig = typeof AD_CONFIG;

// ─── Helpers ─────────────────────────────────────────────────
export function interstitialDailyLimit(userType: UserType, dayNumber: number): number {
  if (userType === "power" || userType === "whale") return AD_CONFIG.interstitial.powerDailyLimit;
  if (dayNumber <= 1) return AD_CONFIG.interstitial.dailyByDay[1];
  if (dayNumber === 2) return AD_CONFIG.interstitial.dailyByDay[2];
  return AD_CONFIG.interstitial.dailyByDay.default;
}

export function interstitialSessionCap(sessionMs: number): number {
  for (const tier of AD_CONFIG.interstitial.sessionCaps) {
    if (sessionMs <= tier.upToMs) return tier.cap;
  }
  return Infinity; // 60+ minutes
}

export function interstitialCooldownMs(userType: UserType): number {
  return AD_CONFIG.interstitial.cooldownByType[userType] ?? 90 * SEC;
}
