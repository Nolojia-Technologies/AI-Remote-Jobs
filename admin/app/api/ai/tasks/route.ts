import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { aiTaskGenSchema } from "@/lib/ai/schema";
import { aiTasksPrompt } from "@/lib/ai/prompts";
import { aiTasksService, type AiTaskInput, type AiTaskStatus } from "@/lib/services/aiTasks";

export const maxDuration = 180;

/**
 * Generate earning-hub AI tasks with the configured AI provider and insert
 * them (answer keys land in ai_task_answers, never exposed to clients).
 * Body: { count?, kind?, focus?, publish? }.
 */
export const POST = adminRoute<{ count?: number; kind?: string; focus?: string; publish?: boolean }>(
  async (body, ctx) => {
    const count = Math.min(50, Math.max(1, body.count ?? 15));
    const kind = ["microtask", "annotation", "survey", "mixed"].includes(body.kind ?? "")
      ? (body.kind as string)
      : "mixed";
    const status: AiTaskStatus = body.publish === false ? "draft" : "published";

    const out = await generateJSON({
      ...aiTasksPrompt({ count, kind, focus: body.focus || "" }),
      schema: aiTaskGenSchema,
    });

    const rows: AiTaskInput[] = out.tasks
      .map((t) => {
        const isSurvey = t.kind === "survey";
        const options = t.options ?? [];
        const content = isSurvey
          ? { questions: t.survey_questions ?? [] }
          : { question: t.question ?? "", options };
        const hasKey = !isSurvey && t.correct_option != null && options.length > 0;
        return {
          kind: t.kind ?? "microtask",
          category: t.category ?? "text_classification",
          title: t.title,
          description: t.description ?? "",
          difficulty: t.difficulty ?? "easy",
          reward_cents: Math.max(0, Math.min(500, Math.round(t.reward_cents ?? 2))),
          xp: Math.max(0, Math.min(100, Math.round(t.xp ?? 3))),
          est_seconds: Math.max(5, Math.round(t.est_seconds ?? 20)),
          content,
          min_task_level: Math.max(1, Math.min(7, Math.round(t.min_task_level ?? 1))),
          status,
          answer: hasKey ? { choice: t.correct_option } : null,
        } as AiTaskInput;
      })
      .filter((r) =>
        r.title &&
        (r.kind === "survey"
          ? (r.content?.questions?.length ?? 0) > 0
          : (r.content?.options?.length ?? 0) >= 2 && r.answer)
      );

    const created = await aiTasksService.bulkInsert(rows, ctx.email);
    await logGeneration({ kind: "ai_tasks", userId: ctx.userId });
    return { count: created, status };
  }
);
