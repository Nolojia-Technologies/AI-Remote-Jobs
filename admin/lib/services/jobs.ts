import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import type { Job, JobInput, JobStatus } from "@/types/db";

export interface JobListOptions {
  search?: string;
  status?: JobStatus | "all";
  country?: string;
  type?: string;
}

export const jobsService = {
  async list(opts: JobListOptions = {}): Promise<Job[]> {
    const supabase = await createClient();
    let q = supabase.from("jobs").select("*");
    if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);
    if (opts.country) q = q.eq("country", opts.country);
    if (opts.type) q = q.eq("type", opts.type);
    if (opts.search?.trim()) q = q.or(`title.ilike.%${opts.search.trim()}%,company.ilike.%${opts.search.trim()}%`);
    q = q.order("order_index", { ascending: true }).order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Job[];
  },

  async get(id: string): Promise<Job | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
    if (error) return null;
    return data as Job;
  },

  async create(input: JobInput, adminEmail: string): Promise<Job> {
    const supabase = await createClient();
    // jobs.id is a TEXT primary key with no default — generate a slug-style id.
    const id = `${slugify(input.title) || "job"}-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from("jobs").insert({ id, ...input } as any).select("*").single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "create", entity: "job", entityId: data.id, detail: input.title });
    return data as Job;
  },

  async update(id: string, patch: Partial<JobInput>, adminEmail: string): Promise<Job> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .update({ ...patch, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "update", entity: "job", entityId: id });
    return data as Job;
  },

  async setStatus(id: string, status: JobStatus, adminEmail: string): Promise<void> {
    await this.update(id, { status }, adminEmail);
    await logActivity({ email: adminEmail, action: status, entity: "job", entityId: id });
  },

  async remove(id: string, adminEmail: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "delete", entity: "job", entityId: id });
  },

  async duplicate(id: string, adminEmail: string): Promise<Job> {
    const original = await this.get(id);
    if (!original) throw new Error("Job not found");
    const { id: _id, created_at, updated_at, ...rest } = original;
    return this.create({ ...(rest as JobInput), title: `${original.title} (Copy)`, status: "draft" }, adminEmail);
  },

  async count(status?: JobStatus): Promise<number> {
    const supabase = await createClient();
    let q = supabase.from("jobs").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    const { count } = await q;
    return count ?? 0;
  },
};
