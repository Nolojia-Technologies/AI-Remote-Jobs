import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { quizSchema } from "@/lib/ai/schema";
import { quizPrompt } from "@/lib/ai/prompts";
import { ASSESSMENT_SPEC } from "@/types/db";
import { coursesService } from "@/lib/services/courses";
import { chaptersService } from "@/lib/services/chapters";
import { quizzesService } from "@/lib/services/quizzes";
import { questionsService } from "@/lib/services/questions";

export const maxDuration = 180;

/**
 * Layer 4 — generate a chapter quiz (10 Q, pass 80%, 50 XP).
 * Body: { courseId, chapterId, market?, quizId? } — quizId regenerates an existing quiz.
 */
export const POST = adminRoute<{ courseId: string; chapterId: string; market?: string; quizId?: string }>(async (body, ctx) => {
  const market = body.market || "Global Remote";
  const spec = ASSESSMENT_SPEC.chapter;
  const course = await coursesService.get(body.courseId);
  if (!course) throw new Error("Course not found");
  const chapter = (await chaptersService.listByCourse(body.courseId)).find((c) => c.id === body.chapterId);
  if (!chapter) throw new Error("Chapter not found");

  const out = await generateJSON({
    ...quizPrompt({ courseTitle: course.title, context: chapter.title, count: spec.questions, passingScore: spec.passing_score, market }),
    schema: quizSchema,
  });

  const quiz = body.quizId
    ? await quizzesService.get(body.quizId)
    : await quizzesService.create(
        { course_id: body.courseId, stage_id: chapter.stage_id, chapter_id: chapter.id, title: out.title || `${chapter.title} — Quiz`, kind: "chapter", passing_score: spec.passing_score, xp_reward: spec.xp_reward, order_index: 50 },
        ctx.email
      );
  if (!quiz) throw new Error("Quiz not found");

  await questionsService.replaceForQuiz(
    quiz.id,
    out.questions.map((q, i) => ({ type: q.type, prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation, order_index: i }))
  );

  await logGeneration({ courseId: body.courseId, kind: "quiz", targetId: quiz.id, userId: ctx.userId });
  return { quiz, questionCount: out.questions.length };
});
