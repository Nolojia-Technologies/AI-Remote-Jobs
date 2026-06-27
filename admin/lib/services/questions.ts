import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Question, QuestionInput } from "@/types/db";

const TABLE = "cms_questions";

export const questionsService = {
  async listByQuiz(quizId: string): Promise<Question[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("quiz_id", quizId).order("order_index");
    if (error) throw error;
    return (data ?? []) as Question[];
  },

  async create(input: QuestionInput): Promise<Question> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).insert(input as any).select("*").single();
    if (error) throw error;
    return data as Question;
  },

  /** Replace all questions for a quiz in one transaction-like batch (used by AI). */
  async replaceForQuiz(quizId: string, questions: Omit<QuestionInput, "quiz_id">[]): Promise<void> {
    const supabase = await createClient();
    await supabase.from(TABLE).delete().eq("quiz_id", quizId);
    if (questions.length === 0) return;
    const rows = questions.map((q, i) => ({ ...q, quiz_id: quizId, order_index: q.order_index ?? i }));
    const { error } = await supabase.from(TABLE).insert(rows as any);
    if (error) throw error;
  },

  async update(id: string, patch: Partial<QuestionInput>): Promise<Question> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).update(patch as any).eq("id", id).select("*").single();
    if (error) throw error;
    return data as Question;
  },

  async remove(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },
};
