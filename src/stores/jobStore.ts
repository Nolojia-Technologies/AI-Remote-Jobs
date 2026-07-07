import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Profile } from "../types/app.types";
import {
  Job,
  JobApplication,
  JobEligibility,
  JobWithStatus,
  RequirementCheck,
  EmploymentType,
  RemoteType,
  JobDifficulty,
} from "../types/jobs.types";
import { MOCK_JOBS } from "../data/jobs";
import { useUserStore } from "./userStore";
import { logEvent } from "../lib/analytics";
import { recordRatingSignal } from "../hooks/useRating";
import { lifetimeAdXp } from "../ads/adXp";
import { JOB_AD_XP_FRACTION } from "../constants/xp";

export const JOB_XP = {
  VIEW: 2,
  SAVE: 5,
  SHARE: 5,
  APPLY: 50,
  UNLOCK: 100,
  DAILY_CHECKIN: 10,
} as const;

// Partial unlock: completing this many full courses opens the first
// PARTIAL_JOB_LIMIT jobs before full certification (which unlocks all jobs).
export const COURSES_FOR_PARTIAL_UNLOCK = 2;
export const PARTIAL_JOB_LIMIT = 5;

interface JobProgress {
  completedModules: number;
  passedQuizzes: number;
}

// Map a published DB `jobs` row (admin CMS) → the mobile Job shape. Fields the
// CMS doesn't store get sensible defaults; jobs gate on certification / partial
// unlock, so the requirement numbers here are informational only.
const CATEGORY_EMOJI: Record<string, string> = {
  "ai-content-writing": "✍️",
  "virtual-assistant": "🗂️",
  "customer-support": "🎧",
  "social-media": "📱",
  "prompt-engineering": "🧠",
  "data-entry": "⌨️",
  research: "🔎",
};

function mapDbJob(r: any): Job {
  const created = r.created_at ?? new Date().toISOString();
  const dbType = String(r.type ?? "remote");
  const employmentType: EmploymentType =
    dbType === "part_time" ? "part_time" : dbType === "freelance" ? "contract" : "full_time";
  const remoteType: RemoteType = dbType === "hybrid" ? "hybrid" : "remote";
  const diff = String(r.difficulty ?? "beginner");
  const difficulty: JobDifficulty =
    diff === "intermediate" ? "intermediate" : diff === "beginner" ? "beginner" : "advanced";
  return {
    id: String(r.id),
    title: r.title ?? "Remote role",
    company: r.company ?? "",
    companyLogo: CATEGORY_EMOJI[r.category] ?? "💼",
    categoryId: r.category ?? "general",
    country: r.country ?? "Remote",
    countryFlag: r.country_flag ?? "🌍",
    salaryMin: Number(r.salary_min) || 0,
    salaryMax: Number(r.salary_max) || 0,
    salaryCurrency: r.salary_currency ?? "USD",
    remoteType,
    employmentType,
    difficulty,
    postedAt: created,
    featured: false,
    description: r.description ?? "",
    responsibilities: [],
    benefits: [],
    companyDescription: "",
    skills: [],
    applicationDeadline: new Date(new Date(created).getTime() + 30 * 86400000).toISOString(),
    requirements: {
      requiredModuleIds: Array.isArray(r.required_course_ids) ? r.required_course_ids.map(String) : [],
      requiredCourses: [],
      minXP: Number(r.required_xp) || 0,
      minLevel: Number(r.required_level) || 1,
      minStreakDays: 0,
      completionPercent: 100,
      requiresFinalQuiz: false,
    },
  };
}

// ─── Pure eligibility engine (used by screens & components) ───────────────────
export function computeEligibility(
  job: Job,
  profile: Profile | null,
  progress: JobProgress,
  adXpLifetime = 0,
  unlocked = false,
  globalCompletion = 0
): JobEligibility {
  const totalXp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.streak_days ?? 0;
  const req = job.requirements;

  // Ads can only contribute a capped fraction of a job's required XP — the rest
  // must be earned through learning. `effectiveXp` is what counts toward unlock.
  const adXpCap = Math.round(req.minXP * JOB_AD_XP_FRACTION);
  const learningXp = Math.max(0, totalXp - adXpLifetime);
  const adXpAllowed = Math.min(adXpLifetime, adXpCap);
  const effectiveXp = learningXp + adXpAllowed;
  const xp = effectiveXp;

  const totalCourses = req.requiredModuleIds.length;
  const neededCourses = Math.ceil((totalCourses * req.completionPercent) / 100);
  const coursesDone = Math.min(progress.completedModules, totalCourses);

  const checks: RequirementCheck[] = [
    { label: "Experience Points", current: effectiveXp, target: req.minXP, met: effectiveXp >= req.minXP, unit: "XP" },
    { label: "Level", current: level, target: req.minLevel, met: level >= req.minLevel },
    {
      label: "Daily Streak",
      current: streak,
      target: req.minStreakDays,
      met: streak >= req.minStreakDays,
      unit: "days",
    },
  ];

  if (totalCourses > 0) {
    checks.push({
      label: "Courses Completed",
      current: coursesDone,
      target: neededCourses,
      met: coursesDone >= neededCourses,
    });
  }

  if (req.requiresFinalQuiz) {
    checks.push({
      label: "Final Assessment",
      current: progress.passedQuizzes,
      target: 1,
      met: progress.passedQuizzes >= 1,
    });
  }

  // A job unlocks either via full certification (all jobs) or the partial-unlock
  // rule (first N jobs after 2 completed courses) — decided by the caller and
  // passed in as `unlocked`. Locked cards show the overall course-completion %.
  const completionPercent = globalCompletion;
  const isUnlocked = unlocked;

  const matchReasons: string[] = [];
  if (checks.find((c) => c.label === "Courses Completed")?.met ?? totalCourses === 0)
    matchReasons.push("Completed required courses");
  if (xp >= req.minXP) matchReasons.push(`Strong XP (${xp.toLocaleString()})`);
  if (level >= req.minLevel) matchReasons.push(`Reached Level ${level}`);
  if (req.minStreakDays > 0 && streak >= req.minStreakDays)
    matchReasons.push(`${streak}-day streak`);
  if (req.requiresFinalQuiz && progress.passedQuizzes >= 1)
    matchReasons.push("Passed assessments");

  return {
    isUnlocked,
    matchScore: completionPercent,
    completionPercent,
    checks,
    matchReasons,
    coursesRemaining: Math.max(0, neededCourses - progress.completedModules),
    testsRemaining: req.requiresFinalQuiz && progress.passedQuizzes < 1 ? 1 : 0,
    learningXp,
    adXpAllowed,
    adXpCap,
  };
}

interface JobState {
  jobs: Job[];
  savedJobIds: Set<string>;
  viewedJobIds: Set<string>;
  applications: JobApplication[];
  unlockedJobIds: Set<string>;
  progress: JobProgress;
  dailyRewardClaimed: boolean;
  isLoading: boolean;
  /** Global Job Readiness Certification status — unlocks ALL jobs. */
  isJobReady: boolean;
  /** Overall course-completion % (drives locked-card progress). */
  certCompletionPercent: number;
  /** Number of fully-completed courses (partial unlock: 2 → first N jobs). */
  completedCourses: number;

  loadUserJobData: (userId: string) => Promise<void>;
  toggleSave: (userId: string, jobId: string) => Promise<void>;
  recordView: (userId: string, jobId: string) => Promise<void>;
  recordShare: (userId: string, jobId: string) => Promise<void>;
  recordUnlock: (userId: string, job: Job) => Promise<boolean>;
  applyToJob: (
    userId: string,
    job: Job,
    matchScore: number,
    resume: string
  ) => Promise<{ error: string | null }>;
  claimDailyReward: (userId: string) => Promise<boolean>;

  getJobWithStatus: (jobId: string) => JobWithStatus | undefined;
  getAllWithStatus: () => JobWithStatus[];
  isNew: (job: Job) => boolean;
}

function isNewJob(job: Job): boolean {
  return Date.now() - new Date(job.postedAt).getTime() < 3 * 86400000;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: MOCK_JOBS,
  savedJobIds: new Set(),
  viewedJobIds: new Set(),
  applications: [],
  unlockedJobIds: new Set(),
  progress: { completedModules: 0, passedQuizzes: 0 },
  dailyRewardClaimed: false,
  isLoading: false,
  isJobReady: false,
  certCompletionPercent: 0,
  completedCourses: 0,

  loadUserJobData: async (userId) => {
    set({ isLoading: true });

    // Live jobs from the admin CMS (published). Falls back to MOCK_JOBS when the
    // table is empty or unreachable so the Jobs tab is never blank.
    let jobs: Job[] = get().jobs;
    try {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "published")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });
      const mapped = (data as any[])?.map(mapDbJob) ?? [];
      if (mapped.length > 0) jobs = mapped;
    } catch {
      // keep MOCK_JOBS
    }

    // Compute course/quiz progress from learning data (graceful on failure).
    let completedModules = 0;
    let passedQuizzes = 0;
    try {
      const [lessonsRes, progressRes, quizRes] = await Promise.all([
        supabase.from("lessons").select("id, module_id"),
        supabase.from("user_lesson_progress").select("lesson_id").eq("user_id", userId).eq("completed", true),
        supabase.from("user_quiz_results").select("id").eq("user_id", userId).eq("passed", true),
      ]);

      const completedLessonIds = new Set(
        (progressRes.data as any[])?.map((r) => r.lesson_id) ?? []
      );
      const byModule = new Map<string, { total: number; done: number }>();
      for (const l of (lessonsRes.data as any[]) ?? []) {
        const m = byModule.get(l.module_id) ?? { total: 0, done: 0 };
        m.total += 1;
        if (completedLessonIds.has(l.id)) m.done += 1;
        byModule.set(l.module_id, m);
      }
      for (const m of byModule.values()) {
        if (m.total > 0 && m.done === m.total) completedModules += 1;
      }
      passedQuizzes = (quizRes.data as any[])?.length ?? 0;
    } catch {
      // keep defaults
    }

    // Saved jobs, applications, daily reward (each guarded individually).
    const savedJobIds = new Set<string>();
    let applications: JobApplication[] = [];
    let dailyRewardClaimed = false;

    try {
      const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", userId);
      (data as any[])?.forEach((r) => savedJobIds.add(r.job_id));
    } catch {}

    try {
      const { data } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", userId)
        .order("applied_at", { ascending: false });
      if (data) applications = data as unknown as JobApplication[];
    } catch {}

    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_job_rewards")
        .select("id")
        .eq("user_id", userId)
        .eq("reward_date", today)
        .maybeSingle();
      dailyRewardClaimed = !!data;
    } catch {}

    // Certification (unlocks all jobs) + partial unlock (2 courses → first N jobs).
    let isJobReady = false;
    let certCompletionPercent = 0;
    let completedCourses = 0;
    try {
      const [eligRes, compRes, coursesRes] = await Promise.all([
        supabase.from("job_eligibility").select("is_job_ready").eq("user_id", userId).maybeSingle(),
        (supabase as any).rpc("get_course_completion"),
        (supabase as any).rpc("get_completed_courses_count"),
      ]);
      isJobReady = !!(eligRes.data as any)?.is_job_ready;
      certCompletionPercent = Number(compRes.data) || 0;
      completedCourses = Number(coursesRes.data) || 0;
    } catch {
      // Certification tables/RPCs not present yet → jobs stay locked, 0% shown.
    }

    set({
      jobs,
      progress: { completedModules, passedQuizzes },
      savedJobIds,
      applications,
      dailyRewardClaimed,
      isJobReady,
      certCompletionPercent,
      completedCourses,
      isLoading: false,
    });
  },

  toggleSave: async (userId, jobId) => {
    const saved = new Set(get().savedJobIds);
    const wasSaved = saved.has(jobId);

    if (wasSaved) {
      saved.delete(jobId);
      set({ savedJobIds: saved });
      try {
        await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId);
      } catch {}
    } else {
      saved.add(jobId);
      set({ savedJobIds: saved });
      try {
        await supabase.from("saved_jobs").insert({ user_id: userId, job_id: jobId } as any);
      } catch {}
      await useUserStore.getState().awardXP(userId, JOB_XP.SAVE, "job_save", "Saved a job");
    }
  },

  recordView: async (userId, jobId) => {
    if (get().viewedJobIds.has(jobId)) return;
    const viewed = new Set(get().viewedJobIds);
    viewed.add(jobId);
    set({ viewedJobIds: viewed });
    try {
      await supabase.from("job_views").insert({ user_id: userId, job_id: jobId } as any);
    } catch {}
    await useUserStore.getState().awardXP(userId, JOB_XP.VIEW, "job_view", "Viewed a job");
    logEvent("job_view", { job_id: jobId });
  },

  recordShare: async (userId, jobId) => {
    await useUserStore.getState().awardXP(userId, JOB_XP.SHARE, "job_share", "Shared a job");
    logEvent("job_share", { job_id: jobId });
  },

  recordUnlock: async (userId, job) => {
    if (get().unlockedJobIds.has(job.id)) return false;
    const unlocked = new Set(get().unlockedJobIds);
    unlocked.add(job.id);
    set({ unlockedJobIds: unlocked });

    let firstTime = true;
    try {
      const { error } = await supabase
        .from("job_unlocks")
        .insert({ user_id: userId, job_id: job.id } as any);
      if (error && error.code === "23505") firstTime = false; // already recorded
    } catch {}

    if (firstTime) {
      await useUserStore
        .getState()
        .awardXP(userId, JOB_XP.UNLOCK, "job_unlock", `Unlocked: ${job.title}`);
      logEvent("job_unlock", { job_id: job.id });
      recordRatingSignal("job_unlock");
    }
    return firstTime;
  },

  applyToJob: async (userId, job, matchScore, resume) => {
    if (get().applications.some((a) => a.job_id === job.id)) {
      return { error: "You have already applied to this job." };
    }
    const application: JobApplication = {
      id: `local-${Date.now()}`,
      user_id: userId,
      job_id: job.id,
      status: "applied",
      match_score: matchScore,
      resume_snapshot: resume,
      applied_at: new Date().toISOString(),
    };

    try {
      const { data } = await supabase
        .from("job_applications")
        .insert({
          user_id: userId,
          job_id: job.id,
          status: "applied",
          match_score: matchScore,
          resume_snapshot: resume,
        } as any)
        .select()
        .single();
      if (data) Object.assign(application, data);
    } catch {}

    set({ applications: [application, ...get().applications] });
    await useUserStore.getState().awardXP(userId, JOB_XP.APPLY, "job_apply", `Applied: ${job.title}`);
    logEvent("job_apply", { job_id: job.id });
    return { error: null };
  },

  claimDailyReward: async (userId) => {
    if (get().dailyRewardClaimed) return false;
    set({ dailyRewardClaimed: true });

    let isFirst = true;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("daily_job_rewards")
        .insert({ user_id: userId, reward_date: today } as any);
      if (error && error.code === "23505") isFirst = false;
    } catch {}

    if (isFirst) {
      await useUserStore
        .getState()
        .awardXP(userId, JOB_XP.DAILY_CHECKIN, "daily_job_checkin", "Daily jobs check-in");
    }
    return isFirst;
  },

  getJobWithStatus: (jobId) => {
    const job = get().jobs.find((j) => j.id === jobId);
    if (!job) return undefined;
    return get().getAllWithStatus().find((j) => j.id === jobId);
  },

  getAllWithStatus: () => {
    const { jobs, savedJobIds, progress, applications, isJobReady, certCompletionPercent, completedCourses } = get();
    const profile = useUserStore.getState().profile;
    const adXp = lifetimeAdXp();
    // Partial unlock: the first PARTIAL_JOB_LIMIT jobs open after 2 completed
    // courses; certification unlocks everything.
    const partialUnlocks = completedCourses >= COURSES_FOR_PARTIAL_UNLOCK;
    return jobs.map((job, i) => {
      const unlocked = isJobReady || (partialUnlocks && i < PARTIAL_JOB_LIMIT);
      const eligibility = computeEligibility(job, profile, progress, adXp, unlocked, certCompletionPercent);
      return {
        ...job,
        eligibility,
        isSaved: savedJobIds.has(job.id),
        isNew: isNewJob(job),
        application: applications.find((a) => a.job_id === job.id),
      };
    });
  },

  isNew: isNewJob,
}));
