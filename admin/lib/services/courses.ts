import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import type { Course, CourseInput, CourseStatus } from "@/types/db";

export interface CourseListOptions {
  search?: string;
  status?: CourseStatus | "all";
  category?: string;
  sort?: "order" | "newest" | "title";
}

/**
 * Returns a slug guaranteed not to collide with an existing course. `courses.slug`
 * is UNIQUE, so two courses whose titles slugify the same (e.g. a second "Virtual
 * Assistant") would otherwise fail the insert with Postgres 23505. Appends -2, -3…
 * until free.
 */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string
): Promise<string> {
  const { data } = await supabase.from("courses").select("slug").ilike("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r: { slug: string | null }) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export const coursesService = {
  async list(opts: CourseListOptions = {}): Promise<Course[]> {
    const supabase = await createClient();
    let q = supabase.from("courses").select("*");

    if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);
    if (opts.category) q = q.eq("category", opts.category);
    if (opts.search?.trim()) q = q.ilike("title", `%${opts.search.trim()}%`);

    if (opts.sort === "newest") q = q.order("created_at", { ascending: false });
    else if (opts.sort === "title") q = q.order("title", { ascending: true });
    else q = q.order("order_index", { ascending: true }).order("created_at", { ascending: false });

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Course[];
  },

  async get(id: string): Promise<Course | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("courses").select("*").eq("id", id).single();
    if (error) return null;
    return data as Course;
  },

  async create(input: CourseInput, adminEmail: string): Promise<Course> {
    const supabase = await createClient();
    // Compute the slug AFTER spreading input so it can't be clobbered, and make
    // it unique so duplicate titles don't violate the UNIQUE(slug) constraint.
    const slug = await uniqueSlug(supabase, input.slug ?? slugify(input.title));
    const payload = { ...input, slug };
    const { data, error } = await supabase.from("courses").insert(payload as any).select("*").single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "create", entity: "course", entityId: data.id, detail: input.title });
    return data as Course;
  },

  async update(id: string, patch: Partial<CourseInput>, adminEmail: string): Promise<Course> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .update({ ...patch, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "update", entity: "course", entityId: id });
    return data as Course;
  },

  async setStatus(id: string, status: CourseStatus, adminEmail: string): Promise<void> {
    await this.update(id, { status }, adminEmail);
    await logActivity({ email: adminEmail, action: status, entity: "course", entityId: id });
  },

  async remove(id: string, adminEmail: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "delete", entity: "course", entityId: id });
  },

  /** Deep-clones a course header (structure clone handled by the duplicate route). */
  async duplicate(id: string, adminEmail: string): Promise<Course> {
    const original = await this.get(id);
    if (!original) throw new Error("Course not found");
    const { id: _id, created_at, updated_at, slug, ...rest } = original;
    const copy = await this.create(
      { ...(rest as CourseInput), title: `${original.title} (Copy)`, slug: `${slug ?? slugify(original.title)}-copy-${Date.now()}`, status: "draft" },
      adminEmail
    );
    return copy;
  },

  async reorder(orderedIds: string[], adminEmail: string): Promise<void> {
    const supabase = await createClient();
    await Promise.all(
      orderedIds.map((id, index) => supabase.from("courses").update({ order_index: index } as any).eq("id", id))
    );
    await logActivity({ email: adminEmail, action: "reorder", entity: "course" });
  },

  async count(status?: CourseStatus): Promise<number> {
    const supabase = await createClient();
    let q = supabase.from("courses").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    const { count } = await q;
    return count ?? 0;
  },
};
