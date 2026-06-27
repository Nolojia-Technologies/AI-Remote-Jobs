import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";
import type { Quiz, QuizInput } from "@/types/db";

const TABLE = "cms_quizzes";

export const quizzesService = {
  async listByCourse(courseId: string): Promise<Quiz[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("course_id", courseId).order("order_index");
    if (error) throw error;
    return (data ?? []) as Quiz[];
  },

  async get(id: string): Promise<Quiz | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
    if (error) return null;
    return data as Quiz;
  },

  async create(input: QuizInput, adminEmail: string): Promise<Quiz> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).insert(input as any).select("*").single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "create", entity: "quiz", entityId: data.id, detail: input.title });
    return data as Quiz;
  },

  async update(id: string, patch: Partial<QuizInput>, adminEmail: string): Promise<Quiz> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).update(patch as any).eq("id", id).select("*").single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "update", entity: "quiz", entityId: id });
    return data as Quiz;
  },

  async remove(id: string, adminEmail: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "delete", entity: "quiz", entityId: id });
  },
};
