const DAY = 24 * 3600_000;

// Spaced-repetition intervals (Anki/Duolingo style).
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60, 90];
export const REVIEW_INTERVALS_MS = REVIEW_INTERVALS_DAYS.map((d) => d * DAY);

export const MEMORY = {
  start: 50, // strength right after learning
  correctGain: 15,
  wrongLoss: 20,
  decayPerDay: 3, // knowledge decay once a review is overdue
  weakBelow: 40, // < 40 = weak (red)
  moderateBelow: 70, // 40–69 = moderate (yellow); >=70 strong (green)
} as const;

export const REVISION_XP = {
  sessionBase: 20,
  perCorrect: 10,
  sessionMax: 100,
} as const;

export const REVISION_SESSION = {
  maxItems: 8,
} as const;

export const REVISION_STREAK_MILESTONES = [3, 7, 14, 30, 60, 90];

export interface ChestTier {
  id: string;
  label: string;
  emoji: string;
  threshold: number; // cumulative completed sessions
  color: string;
}

export const CHEST_TIERS: ChestTier[] = [
  { id: "bronze", label: "Bronze Chest", emoji: "🥉", threshold: 3, color: "#B45309" },
  { id: "silver", label: "Silver Chest", emoji: "🥈", threshold: 6, color: "#94A3B8" },
  { id: "gold", label: "Gold Chest", emoji: "🥇", threshold: 10, color: "#F59E0B" },
  { id: "diamond", label: "Diamond Chest", emoji: "💎", threshold: 15, color: "#0EA5E9" },
];

export interface MemoryBadge {
  id: string;
  title: string;
  emoji: string;
  streakDays: number;
}

export const MEMORY_BADGES: MemoryBadge[] = [
  { id: "reviewer-7", title: "7-Day Reviewer", emoji: "🧠", streakDays: 7 },
  { id: "scholar-30", title: "30-Day Scholar", emoji: "🎓", streakDays: 30 },
  { id: "guardian", title: "Knowledge Guardian", emoji: "🛡️", streakDays: 60 },
  { id: "legend", title: "Learning Legend", emoji: "🏆", streakDays: 90 },
];

// Calendar day colors
export const CALENDAR_COLORS = {
  productive: "#22C55E", // green
  revision: "#2563EB", // blue
  milestone: "#F59E0B", // gold
  missed: "#EF4444", // red
  future: "#E5E7EB",
  empty: "#F1F5F9",
} as const;
