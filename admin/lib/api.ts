import "server-only";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { activeAiModel } from "@/lib/ai/config";

/**
 * Wraps a route handler with admin auth + uniform error handling. The handler
 * receives the parsed JSON body and the admin's email.
 */
export function adminRoute<T = any>(
  handler: (body: T, ctx: { email: string; userId: string }) => Promise<any>
) {
  return async (req: Request) => {
    let ctx;
    try {
      ctx = await requireAdmin();
    } catch (e) {
      const msg = (e as Error).message;
      const code = msg === "UNAUTHENTICATED" ? 401 : 403;
      return NextResponse.json({ error: msg }, { status: code });
    }
    try {
      const body = (await req.json().catch(() => ({}))) as T;
      const result = await handler(body, ctx);
      return NextResponse.json(result ?? { ok: true });
    } catch (e) {
      console.error("[adminRoute]", e);
      return NextResponse.json({ error: (e as Error).message || "Internal error" }, { status: 500 });
    }
  };
}

/** Records a generation in the ai_generations audit table (best-effort). */
export async function logGeneration(input: {
  courseId?: string | null;
  kind: string;
  targetId?: string | null;
  userId: string;
  prompt?: string;
}) {
  try {
    const admin = createAdminClient();
    const { provider, model } = await activeAiModel();
    await admin.from("ai_generations").insert({
      course_id: input.courseId ?? null,
      kind: input.kind,
      provider,
      model,
      target_id: input.targetId ?? null,
      status: "completed",
      prompt: input.prompt ?? null,
      created_by: input.userId,
    } as any);
  } catch {
    // Audit is best-effort.
  }
}
