// AI Tasks & Earnings Hub types.

export type TaskKind = "microtask" | "captcha" | "annotation" | "survey";
export type TaskDifficulty = "easy" | "medium" | "hard";
export type CaptchaGenerator = "text" | "math" | "selection" | "slider" | "image";

/** Question payload rendered by the task runner (never contains answers). */
export interface TaskContent {
  question?: string;
  options?: string[];
  emoji?: string;
  /** Real photo to annotate (e.g. Wikimedia CDN URL). */
  image_url?: string;
  /** Captcha rows: which local generator to use. */
  generator?: CaptchaGenerator;
  /** Image captcha rows: labeled photo pool the grid is built from. */
  images?: { label: string; url: string }[];
  /** Survey rows: list of questions. */
  questions?: { q: string; options: string[] }[];
}

export interface AiTask {
  id: string;
  kind: TaskKind;
  category: string;
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  rewardCents: number;
  xp: number;
  estSeconds: number;
  content: TaskContent;
  repeatable: boolean;
  minTaskLevel: number;
  requiredCourseId: string | null;
  /** True for bundled fallback tasks (completed locally, not via RPC). */
  isLocal?: boolean;
}

export interface TaskCompletionResult {
  ok: boolean;
  correct: boolean;
  rewardCents: number;
  xp: number;
  balanceCents: number;
  tasksToday: number;
  allowedToday: number;
  taskLevel: number;
  /** Set when blocked: 'daily_limit' | human-readable message. */
  error?: string;
}

export interface WalletSummary {
  balanceCents: number;
  pendingCents: number;
  lifetimeCents: number;
  taskCents: number;
  surveyCents: number;
  referralCents: number;
  bonusCents: number;
}

export interface EarnToday {
  tasksCompleted: number;
  captchasCompleted: number;
  earnedCents: number;
  xpEarned: number;
  adBatches: number;
  allowedToday: number;
}

export interface EarnSummary {
  wallet: WalletSummary;
  today: EarnToday;
  weekCents: number;
  monthCents: number;
  streak: { current: number; best: number };
  referrals: { total: number; qualified: number; pending: number };
  tasksCompletedTotal: number;
  taskLevel: number;
}

export type WalletTxType =
  | "task"
  | "captcha"
  | "annotation"
  | "survey"
  | "referral"
  | "bonus"
  | "withdrawal"
  | "adjustment";

export interface WalletTransaction {
  id: string;
  amountCents: number;
  type: WalletTxType;
  status: "completed" | "pending" | "rejected";
  description: string;
  createdAt: string;
}

export interface TopEarner {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  cents: number;
  tasks: number;
}
