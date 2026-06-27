import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { textSchema } from "@/lib/ai/schema";
import { improvePrompt } from "@/lib/ai/prompts";
import { lessonsService } from "@/lib/services/lessons";

export const maxDuration = 120;

/** Improve an existing lesson in place. Body: { lessonId }. */
export const POST = adminRoute<{ lessonId: string }>(async (body, ctx) => {
  const lesson = await lessonsService.get(body.lessonId);
  if (!lesson) throw new Error("Lesson not found");

  const out = await generateJSON({ ...improvePrompt({ title: lesson.title, body: lesson.body }), schema: textSchema });
  const updated = await lessonsService.update(lesson.id, { title: out.title || lesson.title, body: out.body }, ctx.email);

  await logGeneration({ courseId: lesson.course_id, kind: "improve", targetId: lesson.id, userId: ctx.userId });
  return { lesson: updated };
});
