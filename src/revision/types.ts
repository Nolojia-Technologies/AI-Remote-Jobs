export type MemoryLevel = "weak" | "moderate" | "strong";

export interface LessonReview {
  lessonId: string;
  moduleId: string;
  topic: string; // module/chapter title
  strength: number; // 0–100 stored value
  strengthUpdatedAt: number;
  intervalIndex: number; // index into REVIEW_INTERVALS
  nextReviewAt: number;
  lastReviewedAt: number | null;
  reps: number;
  lapses: number;
}

export interface DayActivity {
  lessons: number;
  revisions: number;
  challenges: number;
  xp: number;
  milestone: boolean;
}

export interface RevisionState {
  reviews: Record<string, LessonReview>;
  revisionStreak: number;
  lastRevisionDate: string | null;
  chestSessions: number; // cumulative completed sessions
  chestClaimedTier: number; // index of highest claimed tier
  earnedBadges: string[];
  history: Record<string, DayActivity>; // keyed yyyy-mm-dd
  revisionXpToday: number;
  goalDate: string;
}

export type RevisionItemType = "multiple_choice" | "true_false" | "flashcard";

export interface RevisionItem {
  lessonId: string;
  topic: string;
  type: RevisionItemType;
  prompt: string;
  options?: string[]; // multiple_choice
  answer: string; // canonical correct answer
  statement?: string; // true_false
  statementIsTrue?: boolean;
  front?: string; // flashcard
  back?: string;
}

export interface WeakTopic {
  topic: string;
  moduleId: string;
  averageStrength: number;
  lessonCount: number;
  dueCount: number;
}

export interface RevisionSessionResult {
  correct: number;
  total: number;
  xpEarned: number;
  topicsStrengthened: string[];
}

export interface DailyGoal {
  id: string;
  label: string;
  emoji: string;
  target: number;
  current: number;
}
