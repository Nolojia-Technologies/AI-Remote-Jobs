import { Job } from "../types/jobs.types";
import { MOCK_JOBS } from "../data/jobs";

// ============================================================
// Deterministic social-proof engine.
// All numbers are pure functions of (job data + current time), so they
// are identical across app launches yet grow as real time passes —
// no backend required. Popular jobs grow faster.
// ============================================================

export const SOCIAL_COLORS = {
  popular: "#2563EB", // blue
  growing: "#22C55E", // green
  trending: "#F97316", // orange
  featured: "#8B5CF6", // purple
  hot: "#EF4444", // red
  viral: "#EC4899", // pink
  gray: "#94A3B8",
} as const;

// FNV-1a hash → unsigned 32-bit
function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mulberry32 seeded PRNG → 0..1
function rand(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function hoursSince(iso: string): number {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 3600000);
}

// ─── Applicants (grows over time) ────────────────────────────
export function getApplicantBase(job: Job): number {
  const h = hashStr(job.id);
  let base = 250 + (h % 3200); // 250–3,450
  if (job.featured) base = Math.floor(base * 1.8);
  if (job.featuredTag === "high_paying") base += 4200;
  else if (job.featuredTag === "trending") base += 2600;
  else if (job.featuredTag === "urgent") base += 1500;
  if (job.difficulty === "beginner") base += 1200; // accessible → more applicants
  return base;
}

export function getGrowthPerHour(job: Job): number {
  return Math.max(1, Math.round(getApplicantBase(job) / 1200)); // popular jobs grow faster
}

export function getApplicants(job: Job): number {
  return getApplicantBase(job) + Math.floor(hoursSince(job.postedAt) * getGrowthPerHour(job));
}

// "+N this hour" style growth indicator
export function getRecentGrowth(job: Job): number {
  return getGrowthPerHour(job);
}

// ─── People viewing now (refreshes every ~3 min) ─────────────
export function getViewersNow(job: Job): number {
  const bucket = Math.floor(Date.now() / 180000); // 3-minute buckets
  const r = rand(hashStr(job.id) ^ bucket);
  const maxV = 20 + Math.min(260, Math.floor(getApplicants(job) / 45));
  return 8 + Math.floor(r * maxV);
}

// ─── Popularity tiers ────────────────────────────────────────
export type PopularityTier = "Low" | "Medium" | "High" | "Trending" | "Hot" | "Viral";

const TIER_COLOR: Record<PopularityTier, string> = {
  Low: SOCIAL_COLORS.gray,
  Medium: SOCIAL_COLORS.popular,
  High: SOCIAL_COLORS.growing,
  Trending: SOCIAL_COLORS.trending,
  Hot: SOCIAL_COLORS.hot,
  Viral: SOCIAL_COLORS.viral,
};

const TIER_LABEL: Record<PopularityTier, string> = {
  Low: "New",
  Medium: "Popular",
  High: "Growing",
  Trending: "Trending",
  Hot: "Hot",
  Viral: "Viral",
};

export interface Popularity {
  tier: PopularityTier;
  score: number; // 0–100
  color: string;
  label: string;
}

export function getPopularity(job: Job): Popularity {
  const a = getApplicants(job);
  let tier: PopularityTier;
  if (a < 800) tier = "Low";
  else if (a < 2000) tier = "Medium";
  else if (a < 4500) tier = "High";
  else if (a < 8000) tier = "Trending";
  else if (a < 14000) tier = "Hot";
  else tier = "Viral";
  return {
    tier,
    score: Math.min(100, Math.round(a / 200)),
    color: TIER_COLOR[tier],
    label: TIER_LABEL[tier],
  };
}

// ─── Trending badge (separate from tier, per spec) ───────────
export interface TrendingBadgeInfo {
  label: string;
  emoji: string;
  color: string;
  pulse: boolean;
}

export function getTrendingBadge(job: Job): TrendingBadgeInfo | null {
  if (job.featured) {
    return { label: "Featured", emoji: "⭐", color: SOCIAL_COLORS.featured, pulse: false };
  }
  const { tier } = getPopularity(job);
  if (tier === "Hot" || tier === "Viral") {
    return { label: "Hot Opportunity", emoji: "🚀", color: SOCIAL_COLORS.hot, pulse: true };
  }
  if (tier === "Trending" || tier === "High") {
    return { label: "Trending", emoji: "🔥", color: SOCIAL_COLORS.trending, pulse: true };
  }
  return null;
}

// ─── Milestones ──────────────────────────────────────────────
const MILESTONES = [1000, 2500, 5000, 10000, 25000, 50000];

export interface Milestone {
  value: number;
  label: string;
  emoji: string;
}

export function getMilestone(count: number): Milestone | null {
  let passed: number | null = null;
  for (const m of MILESTONES) if (count >= m) passed = m;
  if (passed === null) return null;
  const emoji = passed >= 10000 ? "🚀" : passed >= 5000 ? "🔥" : "🎉";
  return { value: passed, label: `${passed.toLocaleString()} applicants reached`, emoji };
}

// ─── Competition message (locked jobs) ───────────────────────
export function getCompetitionMessage(
  applicants: number,
  coursesRemaining: number,
  testsRemaining: number,
  levelMet: boolean,
  minLevel: number
): string {
  const a = applicants.toLocaleString();
  if (!levelMet) return `Reach Level ${minLevel} to unlock this opportunity.`;
  if (coursesRemaining > 0)
    return `Complete ${coursesRemaining} more course${coursesRemaining > 1 ? "s" : ""} to compete with ${a} applicants.`;
  if (testsRemaining > 0)
    return `Only ${testsRemaining} quiz left before you can join ${a} applicants.`;
  return `Almost there — keep earning XP to join ${a} applicants.`;
}

// ─── Per-job social stat cards (user notifications) ──────────
export function getJobStatNotes(job: Job): { emoji: string; text: string }[] {
  const a = getApplicants(job);
  const bucket = Math.floor(Date.now() / 3600000); // hourly seed
  const unlockedToday = 5 + Math.floor(rand(hashStr(job.id + "u") ^ bucket) * 40);
  const completedCourse = 12 + Math.floor(rand(hashStr(job.id + "c") ^ bucket) * 90);
  const viewedHour = 30 + Math.floor(rand(hashStr(job.id + "v") ^ bucket) * 180);
  return [
    { emoji: "📨", text: `${a.toLocaleString()} people have applied for this job.` },
    { emoji: "🔓", text: `${unlockedToday} users unlocked this job today.` },
    { emoji: "📚", text: `${completedCourse} users completed the required course.` },
    { emoji: "👁", text: `${viewedHour} people viewed this in the last hour.` },
  ];
}

// ─── Live activity feed (refreshes periodically) ─────────────
const NAMES = [
  "Mercy", "Ahmed", "John", "Sarah", "Brian", "Fatima", "David", "Aisha",
  "Kevin", "Noor", "Grace", "Omar", "Faith", "Yusuf", "Cynthia", "Layla",
  "Daniel", "Mohammed", "Wanjiru", "Zainab", "Peter", "Hassan", "Joy", "Amina",
];
const COUNTRIES = ["Kenya", "Qatar", "Nigeria", "UAE", "Uganda", "Egypt", "Ghana", "Tanzania"];
const COURSES = [
  "Prompt Engineering Basics", "Email Management", "ChatGPT for Writing",
  "Customer Support with AI", "Content Writing Fundamentals", "Research & Data Collection",
];
const TIMES = ["just now", "1m ago", "2m ago", "4m ago", "7m ago", "11m ago", "18m ago"];

export interface ActivityItem {
  id: string;
  emoji: string;
  text: string;
  time: string;
}

export function buildActivityFeed(count = 6): ActivityItem[] {
  const bucket = Math.floor(Date.now() / 25000); // rotates every 25s
  const titles = MOCK_JOBS.map((j) => j.title);
  const items: ActivityItem[] = [];
  for (let i = 0; i < count; i++) {
    const s = hashStr("act" + i) ^ bucket;
    const name = NAMES[Math.floor(rand(s) * NAMES.length)];
    const country = COUNTRIES[Math.floor(rand(s + 1) * COUNTRIES.length)];
    const title = titles[Math.floor(rand(s + 2) * titles.length)];
    const course = COURSES[Math.floor(rand(s + 3) * COURSES.length)];
    const level = 2 + Math.floor(rand(s + 4) * 6);
    const kind = Math.floor(rand(s + 5) * 5);

    let emoji = "👤";
    let text = "";
    switch (kind) {
      case 0: emoji = "🔓"; text = `${name} from ${country} unlocked ${title}.`; break;
      case 1: emoji = "📚"; text = `${name} completed ${course}.`; break;
      case 2: emoji = "📨"; text = `${name} applied for ${title}.`; break;
      case 3: emoji = "🏅"; text = `${name} earned the Job Ready badge.`; break;
      default: emoji = "⭐"; text = `${name} reached Level ${level}.`; break;
    }
    items.push({ id: `${bucket}-${i}`, emoji, text, time: TIMES[Math.min(i, TIMES.length - 1)] });
  }
  return items;
}

// ─── Daily highlights ────────────────────────────────────────
export interface Highlight {
  label: string;
  job: Job;
  metric: string;
  emoji: string;
  color: string;
}

export function getDailyHighlights(jobs: Job[]): Highlight[] {
  if (jobs.length === 0) return [];
  const byApplicants = [...jobs].sort((a, b) => getApplicants(b) - getApplicants(a));
  const byViewers = [...jobs].sort((a, b) => getViewersNow(b) - getViewersNow(a));
  const byGrowth = [...jobs].sort((a, b) => getGrowthPerHour(b) - getGrowthPerHour(a));
  const kenya = byApplicants.filter((j) => /kenya|global/i.test(j.country));
  const qatar = byApplicants.filter((j) => /qatar|global/i.test(j.country));

  const out: Highlight[] = [
    {
      label: "Most Applied Today",
      job: byApplicants[0],
      metric: `${getApplicants(byApplicants[0]).toLocaleString()} applicants`,
      emoji: "📨",
      color: SOCIAL_COLORS.popular,
    },
    {
      label: "Most Viewed",
      job: byViewers[0],
      metric: `${getViewersNow(byViewers[0])} viewing now`,
      emoji: "👁",
      color: SOCIAL_COLORS.growing,
    },
    {
      label: "Fastest Growing",
      job: byGrowth[0],
      metric: `+${getGrowthPerHour(byGrowth[0])}/hr`,
      emoji: "📈",
      color: SOCIAL_COLORS.trending,
    },
  ];
  if (kenya[0])
    out.push({
      label: "Trending in Kenya 🇰🇪",
      job: kenya[0],
      metric: `${getApplicants(kenya[0]).toLocaleString()} applicants`,
      emoji: "🔥",
      color: SOCIAL_COLORS.hot,
    });
  if (qatar[0])
    out.push({
      label: "Trending in Qatar 🇶🇦",
      job: qatar[0],
      metric: `${getApplicants(qatar[0]).toLocaleString()} applicants`,
      emoji: "🔥",
      color: SOCIAL_COLORS.featured,
    });
  out.push({
    label: "Top Remote This Week",
    job: byApplicants[1] ?? byApplicants[0],
    metric: getPopularity(byApplicants[1] ?? byApplicants[0]).label,
    emoji: "⭐",
    color: SOCIAL_COLORS.featured,
  });
  return out;
}
