import { ModuleLevel } from "../types/app.types";

export type StageId = "beginner" | "intermediate" | "advanced" | "expert" | "master";

export interface StageConfig {
  id: StageId;
  label: string;
  emoji: string;
  color: string;
}

export const STAGES: StageConfig[] = [
  { id: "beginner", label: "Beginner", emoji: "🌱", color: "#22C55E" },
  { id: "intermediate", label: "Intermediate", emoji: "🌿", color: "#0EA5E9" },
  { id: "advanced", label: "Advanced", emoji: "🌳", color: "#8B5CF6" },
  { id: "expert", label: "Expert", emoji: "🔥", color: "#F59E0B" },
  { id: "master", label: "Master", emoji: "👑", color: "#EF4444" },
];

export const STAGE_BY_ID: Record<StageId, StageConfig> = STAGES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<StageId, StageConfig>
);

/** Existing modules only carry beginner/intermediate/advanced — map them in. */
export function levelToStage(level: ModuleLevel): StageId {
  return level as StageId;
}

const MIN = 60_000;
const HOUR = 60 * MIN;

export const PROGRESSION = {
  energy: {
    dailyGrant: 5,
    max: 10,
    regenIntervalMs: 2 * HOUR, // +1 every 2h
    costPerLesson: 1,
    adRestore: 2,
  },
  daily: {
    baseChapters: 2, // chapters per day
    bonusChapters: 1, // +1 via rewarded ad
  },
  unlock: {
    autoUnlockMs: 12 * HOUR, // next chapter auto-unlocks after 12h
  },
  quiz: {
    passMark: 0.8, // 80%
    milestonePassMark: 0.85, // 85% on milestone chapters
    maxAttempts: 3,
    failRetryWaitMs: 3 * HOUR, // wait 3h after a failed attempt (or rewarded ad)
    cooldownAfterMaxMs: 12 * HOUR, // 12h cooldown after the 3rd failure (or rewarded ad)
    abandonLockMs: 2 * HOUR, // exiting a quiz before submitting locks it for 2h (or ad)
    questionsPerQuiz: 5,
  },
  milestoneEvery: 5, // every 5th chapter is a milestone assessment
  rewards: {
    chapterXP: 50, // quiz pass
    milestoneXP: 100, // milestone test
    stageXP: 200, // stage completion bonus
    revisionXP: 20,
  },
} as const;
