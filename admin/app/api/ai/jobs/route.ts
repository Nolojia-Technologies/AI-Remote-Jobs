import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { jobGenSchema } from "@/lib/ai/schema";
import { jobsPrompt } from "@/lib/ai/prompts";
import { jobsService } from "@/lib/services/jobs";
import type { JobInput, JobStatus } from "@/types/db";

export const maxDuration = 180;

/**
 * Generate remote job listings with the configured AI provider and insert them.
 * Body: { count?, focus?, market?, publish? }. publish=false imports as drafts.
 */
export const POST = adminRoute<{ count?: number; focus?: string; market?: string; publish?: boolean }>(
  async (body, ctx) => {
    const count = Math.min(50, Math.max(1, body.count ?? 15));
    const status: JobStatus = body.publish === false ? "draft" : "published";

    const out = await generateJSON({
      ...jobsPrompt({ count, focus: body.focus || "", market: body.market || "Global Remote" }),
      schema: jobGenSchema,
    });

    const rows: JobInput[] = out.jobs
      .map((j) => ({
        title: j.title,
        company: j.company,
        description: j.description,
        salary_min: Math.round(j.salary_min ?? 0),
        salary_max: Math.round(j.salary_max ?? 0),
        salary_currency: j.salary_currency || "USD",
        country: j.country || "Remote",
        country_flag: j.country_flag || "🌍",
        category: j.category || "general",
        type: j.type,
        required_xp: 0,
        required_level: 1,
        required_course_ids: [],
        difficulty: j.difficulty || "beginner",
        application_url: j.application_url,
        status,
      }))
      .filter((r) => r.title && r.company);

    const created = await jobsService.bulkInsert(rows, ctx.email);
    await logGeneration({ kind: "jobs", userId: ctx.userId });
    return { count: created, status };
  }
);
