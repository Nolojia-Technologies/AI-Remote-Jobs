import { z } from "zod";

// ─── Layer 1: course structure ──────────────────────────────────────────────
export const structureSchema = z.object({
  course: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
  }),
  stages: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().default(""),
        chapters: z
          .array(
            z.object({
              title: z.string(),
              description: z.string().default(""),
              is_milestone: z.boolean().default(false),
            })
          )
          .min(1),
      })
    )
    .min(1),
});
export type StructureOutput = z.infer<typeof structureSchema>;

// ─── Layer 2: a stage's chapters → lessons + mini challenge ──────────────────
export const stageSchema = z.object({
  chapters: z
    .array(
      z.object({
        title: z.string(),
        lessons: z
          .array(
            z.object({
              title: z.string(),
              type: z.string().default("text"),
              body: z.string(),
            })
          )
          .min(1),
        mini_challenge: z
          .object({
            title: z.string(),
            questions: z.array(
              z.object({
                type: z.string(),
                prompt: z.string(),
                options: z.array(z.string()).default([]),
                answer: z.string(),
                explanation: z.string().default(""),
              })
            ),
          })
          .optional(),
      })
    )
    .min(1),
});
export type StageOutput = z.infer<typeof stageSchema>;

// ─── Layer 3: a single lesson's full content ─────────────────────────────────
export const lessonSchema = z.object({
  title: z.string(),
  type: z.string().default("text"),
  body: z.string(),
});
export type LessonOutput = z.infer<typeof lessonSchema>;

// ─── Layers 4–6: question sets ───────────────────────────────────────────────
export const questionSchema = z.object({
  type: z.enum(["multiple_choice", "true_false", "fill_blank", "scenario"]),
  prompt: z.string(),
  options: z.array(z.string()).default([]),
  answer: z.string(),
  explanation: z.string().default(""),
});

export const quizSchema = z.object({
  title: z.string().default("Quiz"),
  questions: z.array(questionSchema).min(1),
});
export type QuizOutput = z.infer<typeof quizSchema>;

// ─── Job Readiness Certification: bank question generation ───────────────────
// Auto-graded types only (no essay/fill-blank) + the extra bank metadata.
export const certQuestionGenSchema = z.object({
  questions: z
    .array(
      z.object({
        type: z.enum(["multiple_choice", "true_false", "scenario"]),
        prompt: z.string(),
        options: z.array(z.string()).default([]),
        answer: z.string(),
        explanation: z.string().default(""),
        difficulty: z.enum(["beginner", "intermediate", "advanced", "expert", "master"]).default("intermediate"),
        topic: z.string().default(""),
      })
    )
    .min(1),
});
export type CertQuestionGenOutput = z.infer<typeof certQuestionGenSchema>;

// ─── Remote job listings generation ─────────────────────────────────────────
export const jobGenSchema = z.object({
  jobs: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        description: z.string().default(""),
        salary_min: z.number().default(0),
        salary_max: z.number().default(0),
        salary_currency: z.string().default("USD"),
        country: z.string().default("Remote"),
        country_flag: z.string().default("🌍"),
        category: z.string().default("general"),
        type: z.enum(["remote", "hybrid", "full_time", "part_time", "freelance"]).default("remote"),
        difficulty: z.string().default("beginner"),
        application_url: z.string().nullable().default(null),
      })
    )
    .min(1),
});
export type JobGenOutput = z.infer<typeof jobGenSchema>;

// ─── Improve / translate ─────────────────────────────────────────────────────
export const textSchema = z.object({ title: z.string().optional(), body: z.string() });
export type TextOutput = z.infer<typeof textSchema>;

// ─── AI Tasks (earning hub) generation ───────────────────────────────────────
export const aiTaskGenSchema = z.object({
  tasks: z
    .array(
      z.object({
        kind: z.enum(["microtask", "annotation", "survey"]).default("microtask"),
        category: z.string().default("text_classification"),
        title: z.string(),
        description: z.string().default(""),
        difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
        reward_cents: z.number().default(2),
        xp: z.number().default(3),
        est_seconds: z.number().default(20),
        question: z.string().default(""),
        options: z.array(z.string()).default([]),
        correct_option: z.number().nullable().default(null),
        image_url: z.string().nullable().default(null),
        survey_questions: z
          .array(z.object({ q: z.string(), options: z.array(z.string()) }))
          .nullable()
          .default(null),
        min_task_level: z.number().default(1),
      })
    )
    .min(1),
});
export type AiTaskGenOutput = z.infer<typeof aiTaskGenSchema>;
