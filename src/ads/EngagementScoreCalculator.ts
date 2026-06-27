import { BehaviorSnapshot, ScoreResult, UserType } from "./types";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Pure engagement/retention scoring + user classification.
 * Kept side-effect free so it can later be replaced by an ML model
 * with the same (snapshot) -> (scores) signature.
 */
export const EngagementScoreCalculator = {
  /** Weighted 0–100 engagement score. Weights sum to 100. */
  engagement(s: BehaviorSnapshot): number {
    const parts: Array<[number, number]> = [
      [15, clamp01(s.sessionLengthMs / (15 * 60_000))], // session length, cap 15 min
      [15, clamp01(s.xp / 5000)], // XP, cap 5k
      [15, clamp01(s.streakDays / 30)], // streak, cap 30 days
      [10, clamp01(s.challengesCompleted / 20)], // challenges, cap 20
      [15, clamp01(s.lessonsCompleted / 30)], // courses/lessons, cap 30
      [10, clamp01(s.applicationsSubmitted / 10)], // applications, cap 10
      [10, clamp01(s.rewardedWatched / 20)], // rewarded watched, cap 20
      [5, clamp01(s.actionsThisSession / 20)], // in-session activity
      [5, s.visitedLeaderboard ? 1 : 0], // leaderboard participation
    ];
    const score = parts.reduce((sum, [w, v]) => sum + w * v, 0);
    return Math.round(Math.max(0, Math.min(100, score)));
  },

  /** Retention propensity 0–100 (streak + habit + recency). */
  retention(s: BehaviorSnapshot): number {
    const streak = clamp01(s.streakDays / 21) * 45;
    const habit = clamp01(s.sessionCount / 20) * 30;
    const recency = (1 - clamp01(s.msSinceLastActive / (3 * DAY))) * 25;
    return Math.round(Math.max(0, Math.min(100, streak + habit + recency)));
  },

  classify(s: BehaviorSnapshot, engagement: number): UserType {
    if (s.sessionCount <= 1) return "new";
    if (s.msSinceLastActive > 7 * DAY) return "dormant";
    if (s.msSinceLastActive > 4 * HOUR) return "returning";
    if (s.rewardedWatched >= 15 && s.xp >= 3000) return "whale";
    if (engagement >= 75) return "power";
    if (engagement >= 50) return "engaged";
    return "casual";
  },

  compute(s: BehaviorSnapshot): ScoreResult {
    const engagementScore = this.engagement(s);
    const retentionScore = this.retention(s);
    const userType = this.classify(s, engagementScore);
    return { engagementScore, retentionScore, userType };
  },
};
