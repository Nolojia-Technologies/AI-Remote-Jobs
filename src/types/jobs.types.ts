// ─── Job Categories ──────────────────────────────────────────────────────────
export interface JobCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

// ─── Job Status ──────────────────────────────────────────────────────────────
export type JobStatus =
  | "locked"
  | "eligible"
  | "applied"
  | "reviewed"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "saved";

export type EmploymentType = "full_time" | "part_time" | "contract";
export type RemoteType = "remote" | "hybrid";
export type JobDifficulty = "beginner" | "intermediate" | "advanced";
export type FeaturedTag = "high_paying" | "beginner_friendly" | "trending" | "urgent";

// ─── Job Requirements ────────────────────────────────────────────────────────
export interface JobRequirements {
  /** Module IDs the user must complete (maps to seeded modules where possible). */
  requiredModuleIds: string[];
  /** Human-readable course names shown in the UI. */
  requiredCourses: string[];
  minXP: number;
  minLevel: number;
  minStreakDays: number;
  /** % of required courses that must be complete (usually 80–100). */
  completionPercent: number;
  requiresFinalQuiz: boolean;
}

// ─── Job ─────────────────────────────────────────────────────────────────────
export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string; // emoji used as logo for mock data
  categoryId: string;
  country: string;
  countryFlag: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  remoteType: RemoteType;
  employmentType: EmploymentType;
  difficulty: JobDifficulty;
  postedAt: string; // ISO date
  featured: boolean;
  featuredTag?: FeaturedTag;
  description: string;
  responsibilities: string[];
  benefits: string[];
  companyDescription: string;
  skills: string[];
  applicationDeadline: string; // ISO date
  requirements: JobRequirements;
}

// ─── Eligibility (computed client-side) ──────────────────────────────────────
export interface RequirementCheck {
  label: string;
  met: boolean;
  current: number;
  target: number;
  unit?: string;
}

export interface JobEligibility {
  isUnlocked: boolean;
  matchScore: number; // 0–100
  completionPercent: number; // requirement completion 0–100
  checks: RequirementCheck[];
  matchReasons: string[];
  coursesRemaining: number;
  testsRemaining: number;
  // XP source split (ads can only contribute a capped fraction toward unlock)
  learningXp: number;
  adXpAllowed: number; // ad XP actually counted (≤ cap)
  adXpCap: number; // max ad XP allowed toward this job
}

export interface JobWithStatus extends Job {
  eligibility: JobEligibility;
  isSaved: boolean;
  isNew: boolean;
  application?: JobApplication;
}

// ─── Applications ────────────────────────────────────────────────────────────
export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  status: Exclude<JobStatus, "locked" | "eligible" | "saved">;
  match_score: number;
  resume_snapshot: string | null;
  applied_at: string;
}

// ─── Resume ──────────────────────────────────────────────────────────────────
export interface ResumeData {
  fullName: string;
  location: string;
  careerPath: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: string;
  education: string;
  achievements: string[];
  certificatesCount: number;
  level: number;
  xp: number;
}
