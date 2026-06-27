import {
  MEMORY,
  REVIEW_INTERVALS_MS,
  CHEST_TIERS,
} from "./config";
import { LessonReview, MemoryLevel, RevisionState, WeakTopic } from "./types";

const DAY = 24 * 3600_000;

/**
 * Pure spaced-repetition brain. Scheduling, memory strength, knowledge decay,
 * due selection, weak-topic aggregation and chest tiers — all side-effect free.
 */
export const RevisionEngine = {
  // ─── Memory strength (with decay) ──────────────────────────
  effectiveStrength(review: LessonReview, now: number): number {
    const overdueMs = now - review.nextReviewAt;
    if (overdueMs <= 0) return review.strength;
    const daysOverdue = Math.floor(overdueMs / DAY);
    return Math.max(0, review.strength - daysOverdue * MEMORY.decayPerDay);
  },

  memoryLevel(strength: number): MemoryLevel {
    if (strength < MEMORY.weakBelow) return "weak";
    if (strength < MEMORY.moderateBelow) return "moderate";
    return "strong";
  },

  memoryColor(strength: number): string {
    const lvl = this.memoryLevel(strength);
    return lvl === "weak" ? "#EF4444" : lvl === "moderate" ? "#F59E0B" : "#22C55E";
  },

  // ─── Scheduling ────────────────────────────────────────────
  scheduleNew(lessonId: string, moduleId: string, topic: string, now: number): LessonReview {
    return {
      lessonId,
      moduleId,
      topic,
      strength: MEMORY.start,
      strengthUpdatedAt: now,
      intervalIndex: 0,
      nextReviewAt: now + REVIEW_INTERVALS_MS[0],
      lastReviewedAt: null,
      reps: 0,
      lapses: 0,
    };
  },

  applyResult(review: LessonReview, correct: boolean, now: number): LessonReview {
    if (correct) {
      const intervalIndex = Math.min(REVIEW_INTERVALS_MS.length - 1, review.intervalIndex + 1);
      return {
        ...review,
        strength: Math.min(100, review.strength + MEMORY.correctGain),
        strengthUpdatedAt: now,
        intervalIndex,
        nextReviewAt: now + REVIEW_INTERVALS_MS[intervalIndex],
        lastReviewedAt: now,
        reps: review.reps + 1,
      };
    }
    // wrong: drop a level, schedule soon
    const intervalIndex = Math.max(0, review.intervalIndex - 1);
    return {
      ...review,
      strength: Math.max(0, review.strength - MEMORY.wrongLoss),
      strengthUpdatedAt: now,
      intervalIndex,
      nextReviewAt: now + REVIEW_INTERVALS_MS[0],
      lastReviewedAt: now,
      lapses: review.lapses + 1,
    };
  },

  // ─── Due selection ─────────────────────────────────────────
  isDue(review: LessonReview, now: number): boolean {
    return review.nextReviewAt <= now;
  },

  getDue(reviews: Record<string, LessonReview>, now: number): LessonReview[] {
    return Object.values(reviews)
      .filter((r) => this.isDue(r, now))
      .sort((a, b) => {
        // weakest + most overdue first
        const sa = this.effectiveStrength(a, now);
        const sb = this.effectiveStrength(b, now);
        if (sa !== sb) return sa - sb;
        return a.nextReviewAt - b.nextReviewAt;
      });
  },

  dueCount(reviews: Record<string, LessonReview>, now: number): number {
    return this.getDue(reviews, now).length;
  },

  // ─── Weak topics ───────────────────────────────────────────
  weakTopics(reviews: Record<string, LessonReview>, now: number): WeakTopic[] {
    const byTopic = new Map<string, { moduleId: string; total: number; sum: number; due: number }>();
    for (const r of Object.values(reviews)) {
      const entry = byTopic.get(r.topic) ?? { moduleId: r.moduleId, total: 0, sum: 0, due: 0 };
      entry.total += 1;
      entry.sum += this.effectiveStrength(r, now);
      if (this.isDue(r, now)) entry.due += 1;
      byTopic.set(r.topic, entry);
    }
    return Array.from(byTopic.entries())
      .map(([topic, e]) => ({
        topic,
        moduleId: e.moduleId,
        averageStrength: Math.round(e.sum / e.total),
        lessonCount: e.total,
        dueCount: e.due,
      }))
      .sort((a, b) => a.averageStrength - b.averageStrength);
  },

  overallMemory(reviews: Record<string, LessonReview>, now: number): number {
    const vals = Object.values(reviews);
    if (vals.length === 0) return 0;
    const sum = vals.reduce((s, r) => s + this.effectiveStrength(r, now), 0);
    return Math.round(sum / vals.length);
  },

  // ─── Chests ────────────────────────────────────────────────
  reachedTierIndex(chestSessions: number): number {
    let idx = -1;
    CHEST_TIERS.forEach((t, i) => {
      if (chestSessions >= t.threshold) idx = i;
    });
    return idx;
  },

  claimableTierIndex(state: RevisionState): number {
    const reached = this.reachedTierIndex(state.chestSessions);
    return reached > state.chestClaimedTier ? reached : -1;
  },

  nextChest(chestSessions: number) {
    const next = CHEST_TIERS.find((t) => chestSessions < t.threshold) ?? CHEST_TIERS[CHEST_TIERS.length - 1];
    const prevThreshold = CHEST_TIERS.filter((t) => t.threshold <= chestSessions).slice(-1)[0]?.threshold ?? 0;
    const progress = Math.min(100, Math.round(((chestSessions - prevThreshold) / Math.max(1, next.threshold - prevThreshold)) * 100));
    return { next, progress, remaining: Math.max(0, next.threshold - chestSessions) };
  },
};
