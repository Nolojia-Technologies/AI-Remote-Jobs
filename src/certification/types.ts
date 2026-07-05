/**
 * Job Readiness Certification — client types.
 *
 * These mirror the JSON returned by the Postgres RPCs (migrations 016–018).
 * The server is authoritative for scoring, the timer (`expires_at`), and the
 * question bank; the client never receives correct answers until review.
 */

export type CertQuestionType = "multiple_choice" | "true_false" | "scenario";

export interface CertConfig {
  title: string;
  time_limit_minutes: number;
  questions_per_attempt: number;
  passing_score: number;
  unlock_ads_required: number;
  retake_ads_required: number;
  retake_cooldown_minutes: number;
}

/** Aggregate state for the certification hub (one `cert_status` call). */
export interface CertStatus {
  available: boolean;
  completion_percent: number;
  completion_required?: number;
  meets_completion?: boolean;
  is_job_ready: boolean;
  certified_at?: string | null;
  certification_percentage?: number | null;
  attempts_used?: number;
  cooldown_until?: string | null;
  in_cooldown?: boolean;
  ads_watched?: number;
  ads_required?: number;
  ready_to_start?: boolean;
  bank_size?: number;
  active_attempt?: {
    id: string;
    expires_at: string;
    seconds_remaining: number;
    total_questions: number;
  } | null;
  config?: CertConfig;
}

/** A question as served to the learner (no correct answer). */
export interface CertQuestion {
  id: string;
  order_index: number;
  type: CertQuestionType;
  prompt: string;
  options: string[];
  estimated_seconds: number;
  selected_answer: string | null;
}

/** The active-attempt payload from `cert_start_attempt` / `cert_active_payload`. */
export interface CertAttempt {
  attempt_id: string;
  status: "in_progress" | "submitted" | "expired";
  started_at: string;
  expires_at: string;
  seconds_remaining: number;
  total_questions: number;
  questions: CertQuestion[];
}

export interface CertResult {
  attempt_id: string;
  status: "submitted" | "expired";
  passed: boolean;
  percentage: number;
  passing_score: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  total_questions: number;
  seconds_taken: number;
  expired: boolean;
}

export interface CertReviewQuestion {
  question_id: string;
  type: CertQuestionType;
  prompt: string;
  options: string[];
  selected_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  topic: string;
  course_category: string;
}

export interface CertReview {
  attempt_id: string;
  passed: boolean;
  percentage: number;
  questions: CertReviewQuestion[];
  weak_topics: string[];
  strong_topics: string[];
}
