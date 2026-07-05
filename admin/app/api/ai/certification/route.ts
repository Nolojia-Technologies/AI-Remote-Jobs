import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { certQuestionGenSchema } from "@/lib/ai/schema";
import { certQuestionsPrompt } from "@/lib/ai/prompts";
import { certificationService } from "@/lib/services/certification";

export const maxDuration = 180;

/**
 * Generate certification-bank questions with AI. They land as status='draft',
 * source='ai', ai_reviewed=false — an admin must review + approve before they
 * enter the live pool (review-before-publish).
 * Body: { quizId?, count?, category?, topics?, market? }
 */
export const POST = adminRoute<{
  quizId?: string;
  count?: number;
  category?: string;
  topics?: string[];
  market?: string;
}>(async (body, ctx) => {
  const count = Math.min(50, Math.max(1, body.count ?? 15));
  const quiz = body.quizId
    ? await certificationService.getQuiz(body.quizId)
    : await certificationService.getLiveQuiz();
  if (!quiz) throw new Error("No certification quiz found — create one first.");

  const out = await generateJSON({
    ...certQuestionsPrompt({
      category: body.category || "general",
      topics: body.topics ?? [],
      count,
      market: body.market || "Global Remote",
    }),
    schema: certQuestionGenSchema,
  });

  const inserted = await certificationService.bulkInsert(
    quiz.id,
    out.questions.map((q) => ({
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correct_answer: q.answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      course_category: body.category || "general",
      topic: q.topic,
      estimated_seconds: 60,
      weight: 1,
      status: "draft",
      source: "ai",
      ai_reviewed: false,
    }))
  );

  await logGeneration({ kind: "certification", targetId: quiz.id, userId: ctx.userId });
  return { count: inserted, quizId: quiz.id };
});
