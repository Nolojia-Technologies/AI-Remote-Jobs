import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { quizSchema } from "@/lib/ai/schema";
import { quizPrompt } from "@/lib/ai/prompts";
import { ASSESSMENT_SPEC } from "@/types/db";
import { coursesService } from "@/lib/services/courses";
import { stagesService } from "@/lib/services/stages";
import { chaptersService } from "@/lib/services/chapters";
import { quizzesService } from "@/lib/services/quizzes";
import { questionsService } from "@/lib/services/questions";

export const maxDuration = 180;

/**
 * Layer 5 — milestone test for a stage (20 Q, pass 85%, 100 XP).
 * Body: { courseId, stageId, market? }.
 */
export const POST = adminRoute<{ courseId: string; stageId: string; market?: string }>(async (body, ctx) => {
  const market = body.market || "Global Remote";
  const spec = ASSESSMENT_SPEC.milestone;
  const course = await coursesService.get(body.courseId);
  if (!course) throw new Error("Course not found");
  const stage = (await stagesService.listByCourse(body.courseId)).find((s) => s.id === body.stageId);
  if (!stage) throw new Error("Stage not found");
  const chapters = (await chaptersService.listByCourse(body.courseId)).filter((c) => c.stage_id === stage.id);
  const milestoneChapter = chapters.find((c) => c.is_milestone) ?? chapters[chapters.length - 1] ?? null;

  const out = await generateJSON({
    ...quizPrompt({ courseTitle: course.title, context: `the entire "${stage.title}" stage (${chapters.map((c) => c.title).join(", ")})`, count: spec.questions, passingScore: spec.passing_score, market }),
    schema: quizSchema,
  });

  const quiz = await quizzesService.create(
    { course_id: body.courseId, stage_id: stage.id, chapter_id: milestoneChapter?.id ?? null, title: out.title || `${stage.title} — Milestone Test`, kind: "milestone", passing_score: spec.passing_score, xp_reward: spec.xp_reward, order_index: 100 },
    ctx.email
  );
  await questionsService.replaceForQuiz(
    quiz.id,
    out.questions.map((q, i) => ({ type: q.type, prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation, order_index: i }))
  );

  await logGeneration({ courseId: body.courseId, kind: "milestone", targetId: quiz.id, userId: ctx.userId });
  return { quiz, questionCount: out.questions.length };
});
