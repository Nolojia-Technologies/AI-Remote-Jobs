import { Lesson } from "../types/content.types";

/**
 * Configuration + pure helpers for the course "Continue" gate: after a learner
 * completes a lesson, the next lesson is held behind a short cooldown that a
 * rewarded ad can bypass. Durations scale with lesson length (a longer read
 * earns a longer break) and mirror the spec's normal / long / advanced tiers.
 *
 * Kept as plain config + pure functions so it can later be driven by
 * admin-configurable settings without touching call sites.
 */
export const COURSE_GATE = {
  /** Cooldown after completing a lesson, by tier. */
  cooldownMs: {
    normal: 3 * 60_000, // 3 min
    long: 5 * 60_000, // 5 min
    advanced: 10 * 60_000, // 10 min
  },
  /** Tier boundaries, by the lesson's estimated reading minutes. */
  tierThresholds: {
    longMin: 5,
    advancedMin: 10,
  },
  /** Mini-quiz gating (Part B). */
  quiz: {
    everyNLessons: 5, // a quiz block every ~4–6 lessons
    passPercent: 80,
  },
} as const;

export type CooldownTier = "normal" | "long" | "advanced";

type LessonLike = Pick<Lesson, "estimated_reading_minutes" | "duration_minutes">;

export function cooldownTier(lesson: LessonLike): CooldownTier {
  const mins = lesson.estimated_reading_minutes ?? lesson.duration_minutes ?? 1;
  if (mins >= COURSE_GATE.tierThresholds.advancedMin) return "advanced";
  if (mins >= COURSE_GATE.tierThresholds.longMin) return "long";
  return "normal";
}

/** Cooldown duration (ms) to apply after completing this lesson. */
export function cooldownMsForLesson(lesson: LessonLike): number {
  return COURSE_GATE.cooldownMs[cooldownTier(lesson)];
}
