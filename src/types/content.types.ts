// Shared, user-facing content types for the learner app.
// These mirror the Supabase columns the consumer screens read (courses, cms_*).
// Authoring of this content now lives in the web admin portal (admin/), not the app.

export type CourseStatus = "draft" | "published" | "archived";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert" | "master";
export type LessonType = "text" | "video" | "image" | "code" | "exercise" | "checklist" | "resources" | "pdf";
export type QuestionType = "multiple_choice" | "true_false" | "fill_blank" | "scenario";

export interface Course {
  id: string;
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
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  stage_id: string | null;
  chapter_id: string | null;
  title: string;
  type: LessonType;
  /** 'rich_text' (html/markdown) or 'pdf' (native PDF rendering). */
  lesson_type?: "rich_text" | "pdf";
  /** Page count for native PDF lessons (pdf_path stays server-only). */
  pdf_pages?: number | null;
  body: string;
  /** Rich HTML from the portal editor; preferred over `body` when present. */
  content_html?: string | null;
  /** Tiptap JSON document (not used by the reader, kept for parity). */
  content?: any;
  media_url: string | null;
  pdf_url: string | null;
  pdf_name: string | null;
  duration_minutes: number;
  xp_reward: number;
  order_index: number;
  status: CourseStatus;
  character_count?: number | null;
  estimated_reading_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface LessonProgress {
  lesson_id: string;
  time_spent_seconds: number;
  scroll_percentage: number;
  last_scroll_position: number;
  current_page?: number | null;
  total_pages?: number | null;
  status: LessonProgressStatus;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface Quiz {
  id: string;
  course_id: string;
  stage_id: string | null;
  chapter_id: string | null;
  title: string;
  kind: string;
  passing_score: number;
  xp_reward: number;
  cooldown_minutes: number;
  retry_limit: number;
  order_index: number;
  pdf_url: string | null;
  pdf_name: string | null;
  created_at: string;
}

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

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  text: "Text",
  video: "Video",
  image: "Image",
  code: "Code",
  exercise: "Exercise",
  checklist: "Checklist",
  resources: "Resources",
  pdf: "PDF",
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / False",
  fill_blank: "Fill blank",
  scenario: "Scenario",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
  master: "Master",
};
