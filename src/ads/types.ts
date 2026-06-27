// ============================================================
// Ad Intelligence Engine — type definitions
// ============================================================

export type AdType = "rewarded" | "interstitial" | "app_open" | "banner" | "none";

export type UserType =
  | "new"
  | "casual"
  | "engaged"
  | "power"
  | "whale"
  | "dormant"
  | "returning";

export type AdScreen =
  | "home"
  | "jobs"
  | "leaderboard"
  | "profile"
  | "challenges"
  | "learn"
  | "lesson"
  | "quiz"
  | "challenge_detail"
  | "application"
  | "job_detail"
  | "opportunities"
  | "certificates"
  | "achievements"
  | "onboarding"
  | "auth"
  | "other";

/** High-value moments — the best times to surface an ad. */
export type HighValueMoment =
  | "challenge_completed"
  | "certificate_generated"
  | "level_up"
  | "achievement_unlocked"
  | "job_unlocked"
  | "application_submitted"
  | "daily_reward_claimed"
  | "mystery_box_opened"
  | "leaderboard_milestone"
  | "quiz_passed"
  | "module_completed"
  | "job_opened"
  | "badge_unlock"
  | "manual";

/** Rewarded-ad triggers — always user-initiated, never forced. */
export type RewardedTrigger =
  | "double_xp"
  | "retry_quiz"
  | "reopen_quiz"
  | "streak_shield"
  | "reveal_salary"
  | "reveal_company"
  | "reveal_requirements"
  | "lucky_wheel"
  | "mystery_box"
  | "extra_spin"
  | "booster"
  | "extra_challenge"
  | "bonus_xp"
  | "restore_energy"
  | "unlock_chapter"
  | "unlock_bonus"
  | "skip_waiting"
  | "unlock_lesson";

export interface AdDailyCounters {
  date: string; // yyyy-mm-dd
  total: number;
  rewarded: number;
  interstitial: number;
  appOpen: number;
  bannerImpressions: number;
}

export interface AdTimestamps {
  lastAdAt: number | null;
  lastInterstitialAt: number | null;
  lastRewardedAt: number | null;
  lastAppOpenAt: number | null;
  lastActiveAt: number | null;
}

export interface AdLifetime {
  rewardedWatched: number;
  interstitialsShown: number;
  appOpenShown: number;
  bannerImpressions: number;
  sessionCount: number;
}

/** Meaningful actions that drive the interstitial action-counter. */
export type MeaningfulAction =
  | "lesson_completed"
  | "quiz_completed"
  | "challenge_completed"
  | "job_viewed"
  | "job_unlocked"
  | "application_submitted"
  | "certificate_generated"
  | "level_up"
  | "achievement_unlocked"
  | "chapter_unlocked"
  | "profile_completed"
  | "milestone_completed"
  | "leaderboard_promotion"
  | "badge_unlock"
  | "daily_chest"
  | "mystery_box";

export interface AdSessionState {
  sessionStartAt: number;
  currentScreen: AdScreen;
  cameFromNotification: boolean;
  interstitialsThisSession: number;
  actionsThisSession: number;
  jobsViewedThisSession: number;
  visitedLeaderboard: boolean;
  // Action-counter model
  actionCounter: number; // total weighted actions this session
  actionsSinceInterstitial: number; // resets when an interstitial shows
  jobViewsSinceInterstitial: number; // resets when an interstitial shows
}

export interface AdRevenue {
  date: string;
  todayTotal: number;
  lifetimeTotal: number;
  byTypeLifetime: Record<Exclude<AdType, "none">, number>;
}

/** Behaviour counters specific to ad logic (XP/level/streak come from userStore). */
export interface AdBehavior {
  lessonsCompleted: number;
  challengesCompleted: number;
  jobsViewed: number;
  applicationsSubmitted: number;
  achievementsEarned: number;
}

/** Anti-abuse ledger for rewarded "bonus XP" ads. */
export interface AdXpLedger {
  date: string; // yyyy-mm-dd (daily reset)
  todayCount: number; // bonus ads watched today
  todayXp: number; // bonus XP earned today
  weekStart: string; // yyyy-mm-dd (Monday) of current week
  weekXp: number;
  lifetimeXp: number;
}

export interface AdState {
  timestamps: AdTimestamps;
  daily: AdDailyCounters;
  lifetime: AdLifetime;
  session: AdSessionState;
  behavior: AdBehavior;
  revenue: AdRevenue;
  adXp: AdXpLedger;
  firstUseDate: string; // yyyy-mm-dd of first launch → drives day-number caps
  engagementScore: number; // 0–100
  retentionScore: number; // 0–100
  userType: UserType;
  hydrated: boolean;
}

/** Snapshot fed into the pure decision/scoring services. */
export interface BehaviorSnapshot {
  // from userStore / profile
  level: number;
  xp: number;
  streakDays: number;
  // from ad behaviour + session
  lessonsCompleted: number;
  challengesCompleted: number;
  jobsViewed: number;
  applicationsSubmitted: number;
  achievementsEarned: number;
  rewardedWatched: number;
  sessionLengthMs: number;
  actionsThisSession: number;
  sessionCount: number;
  msSinceLastActive: number;
  visitedLeaderboard: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
}

export interface AdDecision {
  show: boolean;
  type: AdType;
  reason: string;
  moment?: HighValueMoment;
}

export interface ScoreResult {
  engagementScore: number;
  retentionScore: number;
  userType: UserType;
}

export interface AdAnalyticsSnapshot {
  arpdau: number;
  rewardedRevenue: number;
  interstitialRevenue: number;
  appOpenRevenue: number;
  bannerRevenue: number;
  totalRevenue: number;
  avgAdsPerSession: number;
  avgRewardedPerUser: number;
  averageSessionMinutes: number;
  dailyTotalAds: number;
}
