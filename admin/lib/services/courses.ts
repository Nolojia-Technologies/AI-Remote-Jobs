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

  /**
   * Bulk-import courses, each with a flat list of lessons. Lessons are created
   * directly under the course (chapter_id = null), which the app renders as a
   * sequential lesson list. Returns how many courses + lessons were created.
   */
  async bulkImport(
    items: (CourseInput & { lessons?: { title: string; body?: string; duration_minutes?: number; xp_reward?: number }[] })[],
    adminEmail: string
  ): Promise<{ courses: number; lessons: number }> {
    const supabase = await createClient();
    let courses = 0;
    let lessons = 0;
    for (const item of items) {
      const { lessons: lessonList = [], ...courseFields } = item;
      if (!courseFields.title?.trim()) continue;
      const course = await this.create(courseFields as CourseInput, adminEmail);
      courses++;
      const valid = lessonList.filter((l) => l?.title?.trim());
      if (valid.length) {
        const rows = valid.map((l, i) => {
          const body = l.body ?? "";
          return {
            course_id: course.id,
            chapter_id: null,
            title: l.title,
            type: "text",
            body,
            duration_minutes: l.duration_minutes ?? 5,
            xp_reward: l.xp_reward ?? 15,
            order_index: i,
            status: courseFields.status ?? "draft",
            character_count: body.length,
            estimated_reading_minutes: Math.max(1, Math.ceil(body.length / 1000)),
          };
        });
        const { error } = await supabase.from("cms_lessons").insert(rows as any);
        if (error) throw error;
        lessons += rows.length;
      }
    }
    await logActivity({ email: adminEmail, action: "bulk_import", entity: "course", detail: `${courses} courses, ${lessons} lessons` });
    return { courses, lessons };
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
