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
    firstThreshold: 3, // first interstitial after 3 meaningful actions (new users)
    recurringThreshold: 4, // then every 4 actions
    jobViewsPerAd: 6, // Jobs tab: interstitial every 6 job views
    // Cooldown since the previous interstitial, by user type. A 60s+ floor keeps
    // interstitials at natural breakpoints rather than on every navigation —
    // which is what AdMob policy expects. Never set to 0 (accidental-click /
    // "too many interstitials" violations risk account suspension).
    cooldownByType: {
      new: 90 * SEC,
      casual: 75 * SEC,
      engaged: 60 * SEC,
      power: 60 * SEC,
      whale: 60 * SEC,
      returning: 75 * SEC,
      dormant: 90 * SEC,
    } as Record<UserType, number>,
    // Daily caps by day-number since first use (power/whale override).
    dailyByDay: { 1: 8, 2: 12, default: 15 },
    powerDailyLimit: 20,
    // Max interstitials allowed by elapsed session time (cumulative).
    // 60+ min => unlimited (cooldown only).
    sessionCaps: [
      { upToMs: 5 * MIN, cap: 2 },
      { upToMs: 15 * MIN, cap: 5 },
      { upToMs: 30 * MIN, cap: 8 },
      { upToMs: 60 * MIN, cap: 12 },
    ],
  },
  appOpen: {
    inactivityMs: 30 * MIN, // show on resume after >30 minutes in background
    dailyLimit: 3,
    interstitialGuardMs: 30 * SEC,
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
