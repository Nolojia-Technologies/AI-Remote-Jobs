import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";
import type { Stage, StageInput } from "@/types/db";

const TABLE = "cms_stages";

export const stagesService = {
  async listByCourse(courseId: string): Promise<Stage[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("course_id", courseId).order("order_index");
    if (error) throw error;
    return (data ?? []) as Stage[];
  },

  async create(input: StageInput, adminEmail: string): Promise<Stage> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).insert(input as any).select("*").single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "create", entity: "stage", entityId: data.id, detail: input.title });
    return data as Stage;
  },

  async update(id: string, patch: Partial<StageInput>, adminEmail: string): Promise<Stage> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).update(patch as any).eq("id", id).select("*").single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "update", entity: "stage", entityId: id });
    return data as Stage;
  },

  async remove(id: string, adminEmail: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "delete", entity: "stage", entityId: id });
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const supabase = await createClient();
    await Promise.all(orderedIds.map((id, i) => supabase.from(TABLE).update({ order_index: i } as any).eq("id", id)));
  },
};
