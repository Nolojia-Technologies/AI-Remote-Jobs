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

// ─── Improve / translate ─────────────────────────────────────────────────────
export const textSchema = z.object({ title: z.string().optional(), body: z.string() });
export type TextOutput = z.infer<typeof textSchema>;
