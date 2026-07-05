import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";
import type {
  CertificationQuiz,
  CertificationQuizInput,
  CertificationQuestion,
  CertificationQuestionInput,
  CertQuizStatus,
  CertQuestionStatus,
} from "@/types/db";

const QUIZZES = "certification_quizzes";
const QUESTIONS = "certification_questions";

export interface QuestionFilters {
  status?: CertQuestionStatus | "all";
  category?: string;
  search?: string;
  source?: string;
}

export interface BankStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  aiPending: number; // AI-generated, not yet reviewed
  byCategory: { category: string; count: number }[];
}

export const certificationService = {
  // ─── Quiz config ──────────────────────────────────────────────────────────
  /** The live certification (published), else the most recently updated one. */
  async getLiveQuiz(): Promise<CertificationQuiz | null> {
    const supabase = await createClient();
    const pub = await supabase.from(QUIZZES).select("*").eq("status", "published").limit(1).maybeSingle();
    if (pub.data) return pub.data as CertificationQuiz;
    const latest = await supabase.from(QUIZZES).select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    return (latest.data as CertificationQuiz) ?? null;
  },

  async getQuiz(id: string): Promise<CertificationQuiz | null> {
    const supabase = await createClient();
    const { data } = await supabase.from(QUIZZES).select("*").eq("id", id).single();
    return (data as CertificationQuiz) ?? null;
  },

  async listQuizzes(): Promise<CertificationQuiz[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(QUIZZES).select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CertificationQuiz[];
  },

  async createQuiz(input: CertificationQuizInput, email: string): Promise<CertificationQuiz> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(QUIZZES).insert({ status: "draft", ...input } as any).select("*").single();
    if (error) throw error;
    await logActivity({ email, action: "create", entity: "certification_quiz", entityId: data.id, detail: input.title });
    return data as CertificationQuiz;
  },

  async updateQuiz(id: string, patch: CertificationQuizInput, email: string): Promise<CertificationQuiz> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(QUIZZES).update(patch as any).eq("id", id).select("*").single();
    if (error) throw error;
    await logActivity({ email, action: "update", entity: "certification_quiz", entityId: id });
    return data as CertificationQuiz;
  },

  /**
   * Set a quiz's lifecycle status. Only one quiz may be 'published' (DB partial
   * unique index), so publishing archives any other published quiz first.
   */
  async setQuizStatus(id: string, status: CertQuizStatus, email: string): Promise<void> {
    const supabase = await createClient();
    if (status === "published") {
      await supabase.from(QUIZZES).update({ status: "archived" } as any).eq("status", "published").neq("id", id);
    }
    const { error } = await supabase.from(QUIZZES).update({ status } as any).eq("id", id);
    if (error) throw error;
    await logActivity({ email, action: `status:${status}`, entity: "certification_quiz", entityId: id });
  },

  async scheduleQuiz(id: string, scheduledAt: string, email: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(QUIZZES).update({ status: "scheduled", scheduled_at: scheduledAt } as any).eq("id", id);
    if (error) throw error;
    await logActivity({ email, action: "schedule", entity: "certification_quiz", entityId: id, detail: scheduledAt });
  },

  /** Duplicate a quiz (as draft) AND its whole question bank. */
  async duplicateQuiz(id: string, email: string): Promise<CertificationQuiz> {
    const supabase = await createClient();
    const src = await this.getQuiz(id);
    if (!src) throw new Error("Quiz not found");
    const { id: _id, created_at, updated_at, ...rest } = src as any;
    const { data, error } = await supabase
      .from(QUIZZES)
      .insert({ ...rest, title: `${src.title} (copy)`, status: "draft" } as any)
      .select("*")
      .single();
    if (error) throw error;

    const questions = await this.listQuestions(id, { status: "all" });
    if (questions.length > 0) {
      const rows = questions.map((q) => {
        const { id: _qid, quiz_id, created_at: _c, updated_at: _u, ...qrest } = q as any;
        return { ...qrest, quiz_id: data.id };
      });
      await supabase.from(QUESTIONS).insert(rows as any);
    }
    await logActivity({ email, action: "duplicate", entity: "certification_quiz", entityId: data.id });
    return data as CertificationQuiz;
  },

  async removeQuiz(id: string, email: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(QUIZZES).delete().eq("id", id);
    if (error) throw error;
    await logActivity({ email, action: "delete", entity: "certification_quiz", entityId: id });
  },

  // ─── Question bank ──────────────────────────────────────────────────────────
  async listQuestions(quizId: string, filters: QuestionFilters = {}): Promise<CertificationQuestion[]> {
    const supabase = await createClient();
    let q = supabase.from(QUESTIONS).select("*").eq("quiz_id", quizId);
    if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
    if (filters.category) q = q.eq("course_category", filters.category);
    if (filters.source) q = q.eq("source", filters.source);
    if (filters.search) q = q.ilike("prompt", `%${filters.search}%`);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(1000);
    if (error) throw error;
    return (data ?? []) as CertificationQuestion[];
  },

  async createQuestion(input: CertificationQuestionInput): Promise<CertificationQuestion> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(QUESTIONS).insert(input as any).select("*").single();
    if (error) throw error;
    return data as CertificationQuestion;
  },

  async updateQuestion(id: string, patch: Partial<CertificationQuestionInput>): Promise<CertificationQuestion> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(QUESTIONS).update(patch as any).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CertificationQuestion;
  },

  async removeQuestion(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(QUESTIONS).delete().eq("id", id);
    if (error) throw error;
  },

  async setQuestionStatus(id: string, status: CertQuestionStatus): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(QUESTIONS).update({ status } as any).eq("id", id);
    if (error) throw error;
  },

  /** Approve an AI/imported question: mark reviewed + publish it into the bank. */
  async approveQuestion(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from(QUESTIONS).update({ ai_reviewed: true, status: "published" } as any).eq("id", id);
    if (error) throw error;
  },

  /** Bulk insert (import / AI). Returns the number of rows inserted. */
  async bulkInsert(quizId: string, rows: Omit<CertificationQuestionInput, "quiz_id">[]): Promise<number> {
    if (rows.length === 0) return 0;
    const supabase = await createClient();
    const payload = rows.map((r) => ({ ...r, quiz_id: quizId }));
    const { data, error } = await supabase.from(QUESTIONS).insert(payload as any).select("id");
    if (error) throw error;
    return (data ?? []).length;
  },

  async stats(quizId: string): Promise<BankStats> {
    const rows = await this.listQuestions(quizId, { status: "all" });
    const byCat = new Map<string, number>();
    let published = 0, draft = 0, archived = 0, aiPending = 0;
    for (const r of rows) {
      byCat.set(r.course_category || "general", (byCat.get(r.course_category || "general") ?? 0) + 1);
      if (r.status === "published") published++;
      else if (r.status === "draft") draft++;
      else if (r.status === "archived") archived++;
      if (!r.ai_reviewed && (r.source === "ai" || r.source === "import")) aiPending++;
    }
    return {
      total: rows.length,
      published,
      draft,
      archived,
      aiPending,
      byCategory: [...byCat.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    };
  },

  async categories(quizId: string): Promise<string[]> {
    const rows = await this.listQuestions(quizId, { status: "all" });
    return [...new Set(rows.map((r) => r.course_category || "general"))].sort();
  },

  /**
   * Dry-run the learner's attempt selection (random published subset, answer
   * order optionally shuffled) so admins can PREVIEW exactly what users see —
   * WITHOUT the correct answer.
   */
  async previewAttempt(quizId: string): Promise<{ prompt: string; type: string; options: string[]; topic: string }[]> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) return [];
    const published = await this.listQuestions(quizId, { status: "published" });
    const shuffled = [...published].sort(() => Math.random() - 0.5).slice(0, quiz.questions_per_attempt);
    return shuffled.map((q) => ({
      prompt: q.prompt,
      type: q.type,
      options: quiz.randomize_answers && q.randomize_answers ? [...q.options].sort(() => Math.random() - 0.5) : q.options,
      topic: q.topic || q.course_category,
    }));
  },
};
