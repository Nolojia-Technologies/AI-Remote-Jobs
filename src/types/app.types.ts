import { Database } from "./database.types";

// ─── Profile ───────────────────────────────────────────────────────────────
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// ─── Career Paths ──────────────────────────────────────────────────────────
export type CareerPath = Database["public"]["Tables"]["career_paths"]["Row"];

export const CAREER_PATH_IDS = {
  AI_CONTENT_WRITER: "ai-content-writer",
  AI_VIRTUAL_ASSISTANT: "ai-virtual-assistant",
  AI_CUSTOMER_SUPPORT: "ai-customer-support",
  AI_RESEARCH_ASSISTANT: "ai-research-assistant",
  AI_SOCIAL_MEDIA_MANAGER: "ai-social-media-manager",
  PROMPT_ENGINEER: "prompt-engineer",
  DATA_ENTRY_SPECIALIST: "data-entry-specialist",
} as const;

export const GOALS = [
  { id: "earn_remote_income", label: "Earn Remote Income", icon: "💰" },
  { id: "learn_ai", label: "Learn AI", icon: "🤖" },
  { id: "get_freelance", label: "Get Freelance Work", icon: "💼" },
  { id: "improve_career", label: "Improve Career", icon: "📈" },
  { id: "build_side_hustle", label: "Build Side Hustle", icon: "🚀" },
] as const;

export type GoalId = (typeof GOALS)[number]["id"];

// ─── Learning ──────────────────────────────────────────────────────────────
export type Module = Database["public"]["Tables"]["modules"]["Row"];
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
export type UserLessonProgress = Database["public"]["Tables"]["user_lesson_progress"]["Row"];

export type ModuleLevel = "beginner" | "intermediate" | "advanced";

export interface ModuleWithProgress extends Module {
  lessons: LessonWithProgress[];
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

export interface LessonWithProgress extends Lesson {
  isCompleted: boolean;
}

// ─── Quiz ──────────────────────────────────────────────────────────────────
export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
export type UserQuizResult = Database["public"]["Tables"]["user_quiz_results"]["Row"];

export type QuestionType = "multiple_choice" | "true_false" | "scenario";

export interface ParsedQuizQuestion extends Omit<QuizQuestion, "options"> {
  options: string[];
}

export interface QuizAttempt {
  quizId: string;
  answers: Record<string, string>;
  startedAt: Date;
}

export interface QuizResult {
  quizId: string;
  score: number;
  passed: boolean;
  xpEarned: number;
  correctAnswers: number;
  totalQuestions: number;
}

// ─── Challenges ────────────────────────────────────────────────────────────
export type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
export type ChallengeSubmission = Database["public"]["Tables"]["challenge_submissions"]["Row"];

export type ChallengeDifficulty = "easy" | "medium" | "hard";

export interface ChallengeWithStatus extends Challenge {
  isCompleted: boolean;
  submission?: ChallengeSubmission;
  timeRemaining?: number;
}

// ─── Achievements ──────────────────────────────────────────────────────────
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];

export interface AchievementWithStatus extends Achievement {
  isEarned: boolean;
  earnedAt?: string;
}

// ─── Certificates ──────────────────────────────────────────────────────────
export type Certificate = Database["public"]["Tables"]["certificates"]["Row"];

export interface CertificateWithPath extends Certificate {
  careerPath: CareerPath;
}

// ─── Opportunities ─────────────────────────────────────────────────────────
export type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"];
export type OpportunityCategory = Opportunity["category"];

export interface OpportunityWithStatus extends Opportunity {
  isUnlocked: boolean;
  unlockProgress?: number;
}

// ─── XP & Leveling ─────────────────────────────────────────────────────────
export type XPLog = Database["public"]["Tables"]["xp_logs"]["Row"];

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  title: string;
}

export type XPSource =
  | "lesson_complete"
  | "quiz_pass"
  | "challenge_complete"
  | "daily_login"
  | "streak_7_days"
  | "streak_14_days"
  | "streak_30_days"
  | "achievement_unlock"
  | "job_view"
  | "job_save"
  | "job_share"
  | "job_apply"
  | "job_unlock"
  | "daily_job_checkin"
  | "revision"
  | "revision_streak"
  | "revision_chest"
  | "ad_bonus"
  | "double_xp"
  | "daily_spin"
  | "ai_task";

// ─── Leaderboard ───────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  rank: number;
  country: string | null;
  isCurrentUser?: boolean;
}

export type LeaderboardTab = "global" | "kenya" | "qatar" | "friends";

// ─── Notifications ─────────────────────────────────────────────────────────
export type AppNotification = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationType =
  | "daily_reminder"
  | "challenge_reminder"
  | "streak_reminder"
  | "new_content"
  | "achievement_earned"
  | "leaderboard_change";

// ─── Navigation ────────────────────────────────────────────────────────────
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
export type OnboardingStatus = "incomplete" | "career_selected" | "complete";
