// Balanced XP economy — learning is the primary source of XP.
export const XP_REWARDS = {
  LESSON_COMPLETE: 15,
  MINI_CHALLENGE: 20,
  QUIZ_PASS: 50,
  MILESTONE_TEST: 100,
  STAGE_COMPLETE: 200,
  JOB_UNLOCK: 100,
  DAILY_STREAK: 25,
  REVISION_SESSION: 20,
  ACHIEVEMENT_UNLOCK: 100,
  // legacy aliases (kept so existing call sites compile)
  CHALLENGE_COMPLETE: 20,
  DAILY_LOGIN: 25,
  STREAK_7_DAYS: 100,
  STREAK_14_DAYS: 150,
  STREAK_30_DAYS: 250,
} as const;

// Rewarded "bonus XP" ads: small, escalating, hard daily cap.
export const AD_BONUS_XP = {
  schedule: [5, 5, 10, 10, 15], // 1st…5th ad of the day
  maxAdsPerDay: 5,
  maxPerDay: 45, // total bonus XP cap per day
} as const;

// How much of a job's required XP may come from ads (rest must be learning).
export const JOB_AD_XP_FRACTION = 0.2; // ≤ 20%

// XP thresholds for each level
export const LEVEL_THRESHOLDS: number[] = [
  0,     // Level 1: 0–100
  101,   // Level 2: 101–300
  301,   // Level 3: 301–700
  701,   // Level 4: 701–1,500
  1501,  // Level 5: 1,501–3,100
  3101,  // Level 6: 3,101–6,300
  6301,  // Level 7: 6,301–12,700
  12701, // Level 8: 12,701–25,500
  25501, // Level 9: 25,501–51,100
  51101, // Level 10: 51,101+
];

export const LEVEL_TITLES: string[] = [
  "AI Newcomer",
  "AI Learner",
  "AI Explorer",
  "AI Practitioner",
  "AI Specialist",
  "AI Expert",
  "AI Master",
  "AI Champion",
  "AI Legend",
  "AI Grandmaster",
];

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelInfo(xp: number) {
  const level = getLevelFromXP(xp);
  const thresholdIndex = level - 1;
  const currentLevelXP = LEVEL_THRESHOLDS[thresholdIndex] ?? 0;
  const nextLevelXP = LEVEL_THRESHOLDS[thresholdIndex + 1] ?? currentLevelXP + 10000;

  const xpInLevel = xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  return {
    level,
    currentXP: xp,
    xpForCurrentLevel: currentLevelXP,
    xpForNextLevel: nextLevelXP,
    xpInLevel,
    xpNeeded,
    progressPercent,
    title: LEVEL_TITLES[Math.min(thresholdIndex, LEVEL_TITLES.length - 1)],
  };
}
