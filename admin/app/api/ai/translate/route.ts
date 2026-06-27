import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { textSchema } from "@/lib/ai/schema";
import { translatePrompt } from "@/lib/ai/prompts";
import { lessonsService } from "@/lib/services/lessons";

export const maxDuration = 120;

/**
 * Translate lesson content. Body: { lessonId, language }. Returns the translated
 * text (not persisted destructively — full multi-locale storage is a future
 * `locale` column; see plan §2g). Pass { apply: true } to overwrite the body.
 */
export const POST = adminRoute<{ lessonId: string; language: string; apply?: boolean }>(async (body, ctx) => {
  const lesson = await lessonsService.get(body.lessonId);
  if (!lesson) throw new Error("Lesson not found");

  const out = await generateJSON({ ...translatePrompt({ body: lesson.body, language: body.language }), schema: textSchema });
  if (body.apply) await lessonsService.update(lesson.id, { body: out.body }, ctx.email);

  await logGeneration({ courseId: lesson.course_id, kind: "translate", targetId: lesson.id, userId: ctx.userId, prompt: body.language });
  return { body: out.body, applied: !!body.apply };
});
