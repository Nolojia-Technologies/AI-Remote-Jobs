import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { quizSchema } from "@/lib/ai/schema";
import { quizPrompt } from "@/lib/ai/prompts";
import { ASSESSMENT_SPEC } from "@/types/db";
import { coursesService } from "@/lib/services/courses";
import { quizzesService } from "@/lib/services/quizzes";
import { questionsService } from "@/lib/services/questions";

export const maxDuration = 240;

/**
 * Layer 6 — final assessment for the whole course (30 Q with practical
 * scenarios/writing tasks, pass 90%, 300 XP, unlocks the certificate).
 * Body: { courseId, market? }.
 */
export const POST = adminRoute<{ courseId: string; market?: string }>(async (body, ctx) => {
  const market = body.market || "Global Remote";
  const spec = ASSESSMENT_SPEC.final;
  const course = await coursesService.get(body.courseId);
  if (!course) throw new Error("Course not found");

  const out = await generateJSON({
    ...quizPrompt({ courseTitle: course.title, context: `the entire course "${course.title}"`, count: spec.questions, passingScore: spec.passing_score, market, practical: true }),
    schema: quizSchema,
  });

  const quiz = await quizzesService.create(
    { course_id: body.courseId, stage_id: null, chapter_id: null, title: out.title || `${course.title} — Final Assessment`, kind: "final", passing_score: spec.passing_score, xp_reward: spec.xp_reward, order_index: 1000 },
    ctx.email
  );
  await questionsService.replaceForQuiz(
    quiz.id,
    out.questions.map((q, i) => ({ type: q.type, prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation, order_index: i }))
  );

  await logGeneration({ courseId: body.courseId, kind: "final", targetId: quiz.id, userId: ctx.userId });
  return { quiz, questionCount: out.questions.length };
});
