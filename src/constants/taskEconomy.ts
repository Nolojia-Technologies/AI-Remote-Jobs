// AI Tasks economy — mirrors public.earn_config() in migration 022.
// The server is the source of truth for rewards; these values drive the
// UI (progress bars, walls, level cards) and the offline fallback.

export const TASK_ECONOMY = {
  FREE_DAILY_TASKS: 100,
  BATCH_SIZE: 25,
  MAX_AD_BATCHES: 6,
  CAPTCHA_DAILY_CAP: 150,
  DAILY_GOAL_TASKS: 20, // soft goal shown on the dashboard
} as const;

/** Task levels — thresholds are lifetime approved tasks (mirrors get_task_level). */
export const TASK_LEVELS = [
  { level: 1, name: "Beginner", minTasks: 0, emoji: "🌱", color: "#94A3B8" },
  { level: 2, name: "Bronze", minTasks: 50, emoji: "🥉", color: "#B45309" },
  { level: 3, name: "Silver", minTasks: 150, emoji: "🥈", color: "#64748B" },
  { level: 4, name: "Gold", minTasks: 400, emoji: "🥇", color: "#F59E0B" },
  { level: 5, name: "Platinum", minTasks: 1000, emoji: "💎", color: "#0EA5E9" },
  { level: 6, name: "Expert", minTasks: 2500, emoji: "🚀", color: "#8B5CF6" },
  { level: 7, name: "Master", minTasks: 6000, emoji: "👑", color: "#EF4444" },
] as const;

export function taskLevelInfo(level: number) {
  return TASK_LEVELS.find((l) => l.level === level) ?? TASK_LEVELS[0];
}

export function taskLevelFromCount(tasks: number) {
  let current: (typeof TASK_LEVELS)[number] = TASK_LEVELS[0];
  for (const l of TASK_LEVELS) if (tasks >= l.minTasks) current = l;
  return current;
}

/** Next level (or null at Master) + progress toward it. */
export function taskLevelProgress(tasks: number) {
  const current = taskLevelFromCount(tasks);
  const next = TASK_LEVELS.find((l) => l.level === current.level + 1) ?? null;
  const pct = next
    ? Math.min(100, Math.round(((tasks - current.minTasks) / (next.minTasks - current.minTasks)) * 100))
    : 100;
  return { current, next, pct };
}

/** Cents → display string ($0.01 precision, always positive-formatted). */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

/** Earning category cards shown on the AI Tasks hub. */
export const EARN_CATEGORIES = [
  {
    id: "microtask",
    title: "AI Micro Tasks",
    description: "Help improve AI while earning money.",
    emoji: "🤖",
    color: "#2563EB",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "captcha",
    title: "Captcha Tasks",
    description: "Solve captchas and earn small rewards.",
    emoji: "🧩",
    color: "#16A34A",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    id: "annotation",
    title: "Data Annotation",
    description: "Help train AI models by labeling data.",
    emoji: "🏷️",
    color: "#9333EA",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    id: "survey",
    title: "Surveys",
    description: "Share your opinion for bigger rewards.",
    emoji: "📋",
    color: "#EA580C",
    bg: "bg-orange-50 dark:bg-orange-900/20",
  },
] as const;

export type EarnCategoryId = (typeof EARN_CATEGORIES)[number]["id"];

/** Micro-task sub-categories (labels for chips/filters). */
export const MICROTASK_CATEGORIES: Record<string, string> = {
  image_labeling: "Image Labeling",
  object_detection: "Object Detection",
  sentiment_analysis: "Sentiment Analysis",
  response_rating: "AI Response Rating",
  audio_validation: "Audio Validation",
  ocr_correction: "OCR Correction",
  text_classification: "Text Classification",
  translation_validation: "Translation Validation",
  prompt_evaluation: "Prompt Evaluation",
  chatbot_evaluation: "Chatbot Evaluation",
  emotion_labeling: "Emotion Labeling",
  entity_recognition: "Entity Recognition",
  intent_classification: "Intent Classification",
  captcha_text: "Text Captcha",
  captcha_math: "Math Captcha",
  captcha_selection: "Selection Captcha",
  captcha_slider: "Slider Captcha",
  survey: "Survey",
};
