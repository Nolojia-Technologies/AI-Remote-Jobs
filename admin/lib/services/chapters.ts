import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";
import type { Chapter, ChapterInput } from "@/types/db";

const TABLE = "cms_chapters";

export const chaptersService = {
  async listByCourse(courseId: string): Promise<Chapter[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("course_id", courseId).order("order_index");
    if (error) throw error;
    return (data ?? []) as Chapter[];
  },

  async listByStage(stageId: string): Promise<Chapter[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("stage_id", stageId).order("order_index");
    if (error) throw error;
    return (data ?? []) as Chapter[];
  },

  async create(input: ChapterInput, adminEmail: string): Promise<Chapter> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).insert(input as any).select("*").single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "create", entity: "chapter", entityId: data.id, detail: input.title });
    return data as Chapter;
  },

  async update(id: string, patch: Partial<ChapterInput>, adminEmail: string): Promise<Chapter> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).update(patch as any).eq("id", id).select("*").single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "update", entity: "chapter", entityId: id });
    return data as Chapter;
  },

  async remove(id: string, adminEmail: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "delete", entity: "chapter", entityId: id });
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const supabase = await createClient();
    await Promise.all(orderedIds.map((id, i) => supabase.from(TABLE).update({ order_index: i } as any).eq("id", id)));
  },
};
