import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { lessonSchema } from "@/lib/ai/schema";
import { lessonPrompt } from "@/lib/ai/prompts";
import { coursesService } from "@/lib/services/courses";
import { chaptersService } from "@/lib/services/chapters";
import { lessonsService } from "@/lib/services/lessons";

export const maxDuration = 120;

/**
 * Layer 3 — generate ONE professional lesson. Body either targets an existing
 * lesson ({ lessonId }) to regenerate, or a chapter + title ({ courseId,
 * chapterId, lessonTitle }) to create a new one.
 */
export const POST = adminRoute<{
  courseId: string;
  chapterId?: string;
  lessonId?: string;
  lessonTitle?: string;
  market?: string;
}>(async (body, ctx) => {
  const market = body.market || "Global Remote";
  const course = await coursesService.get(body.courseId);
  if (!course) throw new Error("Course not found");

  const existing = body.lessonId ? await lessonsService.get(body.lessonId) : null;
  const chapterId = body.chapterId ?? existing?.chapter_id ?? null;
  const chapter = chapterId ? (await chaptersService.listByCourse(body.courseId)).find((c) => c.id === chapterId) : null;
  const lessonTitle = body.lessonTitle || existing?.title || "Lesson";

  const prompt = lessonPrompt({ courseTitle: course.title, chapterTitle: chapter?.title ?? course.title, lessonTitle, market });
  const out = await generateJSON({ ...prompt, schema: lessonSchema });

  let lesson;
  if (existing) {
    lesson = await lessonsService.update(existing.id, { title: out.title, body: out.body, type: (out.type as any) || "text" }, ctx.email);
  } else {
    lesson = await lessonsService.create(
      { course_id: body.courseId, chapter_id: chapterId, stage_id: chapter?.stage_id ?? null, title: out.title, type: (out.type as any) || "text", body: out.body, xp_reward: 15 },
      ctx.email
    );
  }

  await logGeneration({ courseId: body.courseId, kind: "lesson", targetId: lesson.id, userId: ctx.userId });
  return { lesson };
});
