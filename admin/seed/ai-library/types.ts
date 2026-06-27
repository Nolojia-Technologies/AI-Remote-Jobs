import { GenQuestionType } from "../types";

/** Authored, real quiz question. Type is inferred from options when omitted. */
export interface RealQ {
  type?: GenQuestionType;
  q: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

/** A real chapter: concise, accurate knowledge that expands into 3 lessons + a quiz. */
export interface RealChapter {
  title: string;
  summary: string;
  concepts: string[]; // key points (→ "Key concepts" lesson)
  steps: string[]; // how-to (→ "Step by step" lesson)
  example?: string; // a real worked example
  tips: string[];
  mistakes: string[];
  resources?: string[];
  quiz: RealQ[];
}

export interface RealStage {
  title: string;
  description?: string;
  chapters: RealChapter[]; // 4 per stage
}

export interface RealCourse {
  slug: string;
  description?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  category?: string;
  stages: RealStage[]; // 5 stages
}
