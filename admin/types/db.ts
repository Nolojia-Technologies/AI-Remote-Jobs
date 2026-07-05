// ─────────────────────────────────────────────────────────────────────────────
// Shared types for the admin portal.
//
// The Supabase project predates generated types, so `Database` is intentionally
// permissive (keeps the supabase-js generic happy without a brittle hand-written
// schema). Services annotate their own return types with the rich domain types
// below, so call sites stay fully typed even though the raw client is loose.
// Regenerate strict types later with: `supabase gen types typescript`.
// ─────────────────────────────────────────────────────────────────────────────

// `any` so the supabase-js generic stays permissive (a partial hand-written
// schema makes inserts resolve to `never`). Services annotate their own return
// types with the domain types below, so call sites remain fully typed.
// Regenerate strict types later with: `supabase gen types typescript`.
export type Database = any;

// ─── Enums / unions ──────────────────────────────────────────────────────────
export type CourseStatus = "draft" | "published" | "archived";
export type JobStatus = "draft" | "published" | "closed" | "archived";
export type JobType = "remote" | "hybrid" | "full_time" | "part_time" | "freelance";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert" | "master";
export type LessonType =
  | "text"
  | "example"
  | "case_study"
  | "exercise"
  | "checklist"
  | "ai_prompt"
  | "tips"
  | "common_mistakes"
  | "resources"
  | "video"
  | "image"
  | "code"
  | "pdf";
export type QuestionType = "multiple_choice" | "true_false" | "fill_blank" | "scenario";
export type AssessmentKind = "chapter" | "mini" | "milestone" | "final";

// ─── Courses ─────────────────────────────────────────────────────────────────
export interface Course {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  thumbnail_url: string | null;
  difficulty: Difficulty;
  category: string;
  estimated_hours: number;
  xp_reward: number;
  required_level: number;
  tags: string[];
  status: CourseStatus;
  job_category: string | null;
  ai_generated: boolean | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}
export type CourseInput = { title: string } & Partial<Omit<Course, "id" | "title" | "created_at" | "updated_at">>;

// ─── Hierarchy ───────────────────────────────────────────────────────────────
export interface Stage {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
}
export type StageInput = { course_id: string; title: string } & Partial<Omit<Stage, "id" | "course_id" | "title" | "created_at">>;

export interface Chapter {
  id: string;
  course_id: string;
  stage_id: string | null;
  title: string;
  description: string;
  is_milestone: boolean;
  order_index: number;
  created_at: string;
}
export type ChapterInput = { course_id: string; title: string } & Partial<Omit<Chapter, "id" | "course_id" | "title" | "created_at">>;

// ─── Lessons ─────────────────────────────────────────────────────────────────
export interface Lesson {
  id: string;
  course_id: string;
  stage_id: string | null;
  chapter_id: string | null;
  title: string;
  type: LessonType;
  /** 'rich_text' (content_html) or 'pdf' (rendered natively). */
  lesson_type: "rich_text" | "pdf";
  pdf_path: string | null;
  pdf_pages: number | null;
  body: string;
  /** Rich HTML from the Tiptap editor (preferred render source). */
  content_html: string | null;
  /** Tiptap JSON document (for lossless re-editing). */
  content: any;
  media_url: string | null;
  pdf_url: string | null;
  pdf_name: string | null;
  duration_minutes: number;
  xp_reward: number;
  character_count: number | null;
  estimated_reading_minutes: number | null;
  order_index: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}
export type LessonInput = { course_id: string; title: string } & Partial<Omit<Lesson, "id" | "course_id" | "title" | "created_at" | "updated_at">>;

// ─── Quizzes + questions ─────────────────────────────────────────────────────
export interface Quiz {
  id: string;
  course_id: string;
  stage_id: string | null;
  chapter_id: string | null;
  title: string;
  kind: AssessmentKind | string;
  passing_score: number;
  xp_reward: number;
  cooldown_minutes: number;
  retry_limit: number;
  order_index: number;
  pdf_url: string | null;
  pdf_name: string | null;
  created_at: string;
}
export type QuizInput = { course_id: string; title: string } & Partial<Omit<Quiz, "id" | "course_id" | "title" | "created_at">>;

export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  order_index: number;
}
export type QuestionInput = { quiz_id: string; prompt: string; answer: string } & Partial<Omit<Question, "id" | "quiz_id" | "prompt" | "answer">>;

// ─── Job Readiness Certification ─────────────────────────────────────────────
export type CertQuizStatus = "draft" | "scheduled" | "published" | "archived";
export type CertQuestionStatus = "draft" | "published" | "archived";
export type CertQuestionType = "multiple_choice" | "true_false" | "scenario";
export type CertQuestionSource = "manual" | "import" | "ai";

export interface CertificationQuiz {
  id: string;
  title: string;
  description: string;
  status: CertQuizStatus;
  scheduled_at: string | null;
  time_limit_minutes: number;
  questions_per_attempt: number;
  passing_score: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  first_attempt_requires_ad: boolean;
  unlock_ads_required: number;
  retake_cooldown_minutes: number;
  retake_ads_required: number;
  suspicious_seconds: number;
  created_at: string;
  updated_at: string;
}
export type CertificationQuizInput = Partial<Omit<CertificationQuiz, "id" | "created_at" | "updated_at">>;

export interface CertificationQuestion {
  id: string;
  quiz_id: string;
  type: CertQuestionType;
  prompt: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: Difficulty;
  course_category: string;
  topic: string;
  tags: string[];
  estimated_seconds: number;
  weight: number;
  randomize_answers: boolean;
  status: CertQuestionStatus;
  source: CertQuestionSource;
  ai_reviewed: boolean;
  created_at: string;
  updated_at: string;
}
export type CertificationQuestionInput = { quiz_id: string; prompt: string; correct_answer: string } & Partial<
  Omit<CertificationQuestion, "id" | "quiz_id" | "prompt" | "correct_answer" | "created_at" | "updated_at">
>;

export const CERT_QUIZ_STATUS_LABELS: Record<CertQuizStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};
export const CERT_QUESTION_STATUS_LABELS: Record<CertQuestionStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};
export const CERT_QUESTION_TYPE_LABELS: Record<CertQuestionType, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  scenario: "Scenario",
};

// ─── Jobs ────────────────────────────────────────────────────────────────────
export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  country: string;
  country_flag: string;
  category: string;
  type: JobType;
  required_xp: number;
  required_level: number;
  required_course_ids: string[];
  difficulty: string;
  application_url: string | null;
  status: JobStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
}
export type JobInput = { title: string; company: string } & Partial<Omit<Job, "id" | "title" | "company" | "created_at" | "updated_at">>;

// ─── People / activity ───────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  level: number | null;
  xp: number | null;
  streak_count: number | null;
  is_admin: boolean | null;
  created_at: string;
  last_active_at: string | null;
}

export interface AdminActivity {
  id: string;
  admin_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detail: string | null;
  created_at: string;
}

// ─── Labels (shared UI) ──────────────────────────────────────────────────────
export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
};
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
  master: "Master",
};
export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  text: "Text",
  example: "Example",
  case_study: "Case Study",
  exercise: "Exercise",
  checklist: "Checklist",
  ai_prompt: "AI Prompt",
  tips: "Tips",
  common_mistakes: "Common Mistakes",
  resources: "Resources",
  video: "Video",
  image: "Image",
  code: "Code",
  pdf: "PDF",
};
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  fill_blank: "Fill in the Blank",
  scenario: "Scenario-Based",
};

// Assessment defaults straight from the product spec (per layer).
export const ASSESSMENT_SPEC = {
  chapter: { questions: 10, passing_score: 80, xp_reward: 50 },
  mini: { questions: 4, passing_score: 60, xp_reward: 20 },
  milestone: { questions: 20, passing_score: 85, xp_reward: 100 },
  final: { questions: 30, passing_score: 90, xp_reward: 300 },
} as const;
