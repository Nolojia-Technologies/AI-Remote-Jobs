import { ModuleWithProgress } from "../types/app.types";
import { StageId } from "./config";

export type QuizStatus = "idle" | "in_progress" | "abandoned";

export interface ChapterProgress {
  quizAttempts: number;
  quizPassed: boolean;
  completedAt: number | null;
  unlockedManually: boolean; // unlocked via rewarded ad
  // Quiz session / gating
  quizStatus: QuizStatus;
  quizAnswers: Record<number, string>; // partial progress (by question index)
  quizCurrentIndex: number;
  retryAvailableAt: number | null; // fail cooldown (3h) or post-3rd-fail (12h)
  abandonLockUntil: number | null; // 2h lock after exiting without submitting
}

export type QuizGateKind = "available" | "abandon_locked" | "cooldown" | "passed";

export interface QuizGate {
  kind: QuizGateKind;
  canStart: boolean;
  availableAt: number | null;
  attemptsLeft: number;
  hasPartial: boolean; // an abandoned-but-resumable session exists
}

export interface WeakArea {
  topic: string;
  question: string;
}

export interface ProgressionState {
  energy: number;
  energyUpdatedAt: number;
  dailyDate: string; // yyyy-mm-dd
  chaptersToday: number;
  bonusChapterUsed: boolean;
  lastDailyGrantDate: string;
  chapters: Record<string, ChapterProgress>;
}

export type ChapterStatusKind = "completed" | "active" | "locked";

export interface ChapterStatus {
  kind: ChapterStatusKind;
  reason?: string;
  autoUnlockAt?: number | null; // when the 12h auto-unlock fires
  canUnlockWithAd?: boolean; // immediate unlock available via rewarded ad
  dailyBlocked?: boolean; // daily chapter limit hit
  bonusAvailable?: boolean; // can spend the +1 bonus chapter (rewarded ad)
}

/** A module rendered as a gamified "chapter" with its stage + global index. */
export interface Chapter extends ModuleWithProgress {
  stage: StageId;
  chapterIndex: number; // 1-based global order
  isMilestone: boolean;
}

export interface QuizGateQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface QuizGateResult {
  passed: boolean;
  correct: number;
  total: number;
  scorePercent: number;
}
