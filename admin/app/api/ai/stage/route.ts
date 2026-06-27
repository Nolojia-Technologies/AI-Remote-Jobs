import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { stageSchema } from "@/lib/ai/schema";
import { stagePrompt } from "@/lib/ai/prompts";
import { ASSESSMENT_SPEC } from "@/types/db";
import { coursesService } from "@/lib/services/courses";
import { stagesService } from "@/lib/services/stages";
import { chaptersService } from "@/lib/services/chapters";
import { lessonsService } from "@/lib/services/lessons";
import { quizzesService } from "@/lib/services/quizzes";
import { questionsService } from "@/lib/services/questions";

export const maxDuration = 300;

/**
 * Layer 2 — generate full content for ONE stage: lessons for every chapter plus
 * a mini-challenge each. Body: { courseId, stageId, market? }.
 */
export const POST = adminRoute<{ courseId: string; stageId: string; market?: string }>(async (body, ctx) => {
  const market = body.market || "Global Remote";
  const course = await coursesService.get(body.courseId);
  if (!course) throw new Error("Course not found");

  const stages = await stagesService.listByCourse(body.courseId);
  const stage = stages.find((s) => s.id === body.stageId);
  if (!stage) throw new Error("Stage not found");

  const chapters = (await chaptersService.listByCourse(body.courseId)).filter((c) => c.stage_id === stage.id);

  const prompt = stagePrompt({
    courseTitle: course.title,
    stageTitle: stage.title,
    chapters: chapters.map((c) => c.title),
    difficulty: course.difficulty,
    market,
  });
  const out = await generateJSON({ ...prompt, schema: stageSchema });

  let lessonCount = 0;
  let quizCount = 0;

  for (const chapter of chapters) {
    const gen = out.chapters.find((c) => c.title.trim().toLowerCase() === chapter.title.trim().toLowerCase()) ?? out.chapters[chapters.indexOf(chapter)];
    if (!gen) continue;

    for (let li = 0; li < gen.lessons.length; li++) {
      const l = gen.lessons[li];
      await lessonsService.create(
        { course_id: body.courseId, stage_id: stage.id, chapter_id: chapter.id, title: l.title, type: (l.type as any) || "text", body: l.body, order_index: li, xp_reward: 15 },
        ctx.email
      );
      lessonCount++;
    }

    if (gen.mini_challenge) {
      const spec = ASSESSMENT_SPEC.mini;
      const quiz = await quizzesService.create(
        { course_id: body.courseId, stage_id: stage.id, chapter_id: chapter.id, title: gen.mini_challenge.title, kind: "mini", passing_score: spec.passing_score, xp_reward: spec.xp_reward, order_index: 99 },
        ctx.email
      );
      await questionsService.replaceForQuiz(
        quiz.id,
        gen.mini_challenge.questions.map((q, i) => ({ type: q.type as any, prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation, order_index: i }))
      );
      quizCount++;
    }
  }

  await logGeneration({ courseId: body.courseId, kind: "stage", targetId: stage.id, userId: ctx.userId });
  return { stageId: stage.id, lessonCount, quizCount };
});
