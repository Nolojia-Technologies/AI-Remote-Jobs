import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";

export type AiTaskKind = "microtask" | "captcha" | "annotation" | "survey";
export type AiTaskStatus = "draft" | "published" | "paused" | "archived";

export interface AiTaskRow {
  id: string;
  kind: AiTaskKind;
  category: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  reward_cents: number;
  xp: number;
  est_seconds: number;
  content: Record<string, any>;
  repeatable: boolean;
  min_task_level: number;
  required_course_id: string | null;
  status: AiTaskStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AiTaskInput {
  kind: AiTaskKind;
  category: string;
  title: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  reward_cents?: number;
  xp?: number;
  est_seconds?: number;
  content?: Record<string, any>;
  repeatable?: boolean;
  min_task_level?: number;
  required_course_id?: string | null;
  status?: AiTaskStatus;
  order_index?: number;
  /** Correct answer (e.g. { choice: 0 }) — stored in ai_task_answers, never sent to clients. */
  answer?: Record<string, any> | null;
}

export interface AiTaskListOptions {
  search?: string;
  status?: AiTaskStatus | "all";
  kind?: AiTaskKind | "all";
}

async function upsertAnswer(taskId: string, answer: Record<string, any> | null | undefined) {
  if (answer === undefined) return;
  const supabase = await createClient();
  if (answer === null) {
    await supabase.from("ai_task_answers").delete().eq("task_id", taskId);
  } else {
    const { error } = await supabase
      .from("ai_task_answers")
      .upsert({ task_id: taskId, answer, updated_at: new Date().toISOString() } as any);
    if (error) throw error;
  }
}

export const aiTasksService = {
  async list(opts: AiTaskListOptions = {}): Promise<AiTaskRow[]> {
    const supabase = await createClient();
    let q = supabase.from("ai_tasks").select("*");
    if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);
    if (opts.kind && opts.kind !== "all") q = q.eq("kind", opts.kind);
    if (opts.search?.trim())
      q = q.or(`title.ilike.%${opts.search.trim()}%,category.ilike.%${opts.search.trim()}%`);
    q = q.order("order_index", { ascending: true }).order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as AiTaskRow[];
  },

  async get(id: string): Promise<AiTaskRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("ai_tasks").select("*").eq("id", id).single();
    if (error) return null;
    return data as AiTaskRow;
  },

  async getAnswer(id: string): Promise<Record<string, any> | null> {
    const supabase = await createClient();
    const { data } = await supabase.from("ai_task_answers").select("answer").eq("task_id", id).maybeSingle();
    return (data as any)?.answer ?? null;
  },

  async create(input: AiTaskInput, adminEmail: string): Promise<AiTaskRow> {
    const supabase = await createClient();
    const { answer, ...row } = input;
    const { data, error } = await supabase.from("ai_tasks").insert(row as any).select("*").single();
    if (error) throw error;
    await upsertAnswer(data.id, answer);
    await logActivity({ email: adminEmail, action: "create", entity: "ai_task", entityId: data.id, detail: input.title });
    return data as AiTaskRow;
  },

  async update(id: string, patch: Partial<AiTaskInput>, adminEmail: string): Promise<AiTaskRow> {
    const supabase = await createClient();
    const { answer, ...row } = patch;
    const { data, error } = await supabase
      .from("ai_tasks")
      .update({ ...row, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await upsertAnswer(id, answer);
    await logActivity({ email: adminEmail, action: "update", entity: "ai_task", entityId: id });
    return data as AiTaskRow;
  },

  async setStatus(id: string, status: AiTaskStatus, adminEmail: string): Promise<void> {
    await this.update(id, { status }, adminEmail);
    await logActivity({ email: adminEmail, action: status, entity: "ai_task", entityId: id });
  },

  async remove(id: string, adminEmail: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("ai_tasks").delete().eq("id", id);
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "delete", entity: "ai_task", entityId: id });
  },

  async duplicate(id: string, adminEmail: string): Promise<AiTaskRow> {
    const original = await this.get(id);
    if (!original) throw new Error("Task not found");
    const answer = await this.getAnswer(id);
    const { id: _id, created_at, updated_at, ...rest } = original;
    return this.create(
      { ...(rest as AiTaskInput), title: `${original.title} (Copy)`, status: "draft", answer },
      adminEmail
    );
  },

  /** Bulk insert (AI generation / JSON import). Returns rows created. */
  async bulkInsert(rows: AiTaskInput[], adminEmail: string): Promise<number> {
    if (rows.length === 0) return 0;
    const supabase = await createClient();
    const payload = rows.map(({ answer, ...r }) => r);
    const { data, error } = await supabase.from("ai_tasks").insert(payload as any).select("id");
    if (error) throw error;
    const ids = (data ?? []).map((d: any) => d.id as string);
    const answers = rows
      .map((r, i) => ({ task_id: ids[i], answer: r.answer }))
      .filter((a) => a.task_id && a.answer);
    if (answers.length > 0) {
      const { error: aErr } = await supabase.from("ai_task_answers").insert(answers as any);
      if (aErr) throw aErr;
    }
    await logActivity({ email: adminEmail, action: "bulk_create", entity: "ai_task", detail: `${ids.length} tasks` });
    return ids.length;
  },

  /**
   * Bulk repricing: set reward (in mills, 1/1000 USD) for every non-archived
   * task matching kind+difficulty. Rules with reward < 0 are skipped.
   */
  async bulkReprice(
    rules: { kind: AiTaskKind; difficulty: "easy" | "medium" | "hard"; reward_cents: number }[],
    adminEmail: string
  ): Promise<number> {
    const supabase = await createClient();
    let updated = 0;
    for (const r of rules) {
      if (r.reward_cents < 0) continue;
      const { data, error } = await supabase
        .from("ai_tasks")
        .update({ reward_cents: Math.min(5000, Math.round(r.reward_cents)), updated_at: new Date().toISOString() } as any)
        .eq("kind", r.kind)
        .eq("difficulty", r.difficulty)
        .neq("status", "archived")
        .select("id");
      if (error) throw error;
      updated += (data ?? []).length;
    }
    await logActivity({ email: adminEmail, action: "bulk_reprice", entity: "ai_task", detail: `${updated} tasks` });
    return updated;
  },

  async count(status?: AiTaskStatus): Promise<number> {
    const supabase = await createClient();
    let q = supabase.from("ai_tasks").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    const { count } = await q;
    return count ?? 0;
  },
};
