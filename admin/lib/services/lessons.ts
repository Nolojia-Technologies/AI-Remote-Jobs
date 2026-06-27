import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";
import type { Lesson, LessonInput } from "@/types/db";

const TABLE = "cms_lessons";

export const lessonsService = {
  async listByCourse(courseId: string): Promise<Lesson[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("course_id", courseId).order("order_index");
    if (error) throw error;
    return (data ?? []) as Lesson[];
  },

  async listByChapter(chapterId: string): Promise<Lesson[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("chapter_id", chapterId).order("order_index");
    if (error) throw error;
    return (data ?? []) as Lesson[];
  },

  async get(id: string): Promise<Lesson | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
    if (error) return null;
    return data as Lesson;
  },

  async create(input: LessonInput, adminEmail: string): Promise<Lesson> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).insert(input as any).select("*").single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "create", entity: "lesson", entityId: data.id, detail: input.title });
    return data as Lesson;
  },

  async update(id: string, patch: Partial<LessonInput>, adminEmail: string): Promise<Lesson> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...patch, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "update", entity: "lesson", entityId: id });
    return data as Lesson;
  },

  async remove(id: string, adminEmail: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "delete", entity: "lesson", entityId: id });
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const supabase = await createClient();
    await Promise.all(orderedIds.map((id, i) => supabase.from(TABLE).update({ order_index: i } as any).eq("id", id)));
  },
};
