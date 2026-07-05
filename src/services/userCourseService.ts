import { supabase } from "../lib/supabase";
import { Course, Lesson, Quiz, Question } from "../types/content.types";

const db = supabase as any;

// Explicit lesson columns — deliberately EXCLUDES pdf_path so the private native
// PDF key never reaches the app (native PDFs stream via the pdf-proxy function).
const LESSON_COLS =
  "id,course_id,stage_id,chapter_id,title,type,lesson_type,pdf_pages,body,content_html,media_url,pdf_url,pdf_name,duration_minutes,xp_reward,order_index,status,character_count,estimated_reading_minutes,created_at,updated_at";

export interface CourseOutline {
  course: Course;
  stages: { id: string; title: string; description: string; order_index: number }[];
  chapters: { id: string; stage_id: string | null; title: string; order_index: number }[];
  lessons: Lesson[];
  quizzes: Quiz[];
}

export const userCourseService = {
  /** All published courses (the learner catalog). */
  async listPublished(search = ""): Promise<Course[]> {
    let q = db.from("courses").select("*").eq("status", "published").order("order_index", { ascending: true }).order("created_at", { ascending: false });
    if (search.trim()) q = q.ilike("title", `%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Course[];
  },

  async getCourse(courseId: string): Promise<Course | null> {
    const { data, error } = await db.from("courses").select("*").eq("id", courseId).single();
    if (error) throw error;
    return (data ?? null) as Course | null;
  },

  /** Full outline for a course (stages/chapters/lessons/quizzes). */
  async getOutline(courseId: string): Promise<CourseOutline> {
    const [course, stages, chapters, lessons, quizzes] = await Promise.all([
      this.getCourse(courseId),
      db.from("cms_stages").select("id,title,description,order_index").eq("course_id", courseId).order("order_index"),
      db.from("cms_chapters").select("id,stage_id,title,order_index").eq("course_id", courseId).order("order_index"),
      db.from("cms_lessons").select(LESSON_COLS).eq("course_id", courseId).order("order_index"),
      db.from("cms_quizzes").select("*").eq("course_id", courseId).order("order_index"),
    ]);
    return {
      course: course as Course,
      stages: stages.data ?? [],
      chapters: chapters.data ?? [],
      lessons: (lessons.data ?? []) as Lesson[],
      quizzes: (quizzes.data ?? []) as Quiz[],
    };
  },

  async getLesson(lessonId: string): Promise<Lesson | null> {
    const { data, error } = await db.from("cms_lessons").select(LESSON_COLS).eq("id", lessonId).single();
    if (error) throw error;
    return (data ?? null) as Lesson | null;
  },

  async getQuiz(quizId: string): Promise<{ quiz: Quiz; questions: Question[] } | null> {
    const { data: quiz } = await db.from("cms_quizzes").select("*").eq("id", quizId).single();
    if (!quiz) return null;
    const { data: questions } = await db.from("cms_questions").select("*").eq("quiz_id", quizId).order("order_index");
    return { quiz: quiz as Quiz, questions: (questions ?? []) as Question[] };
  },

  /**
   * The course to "resume": the most recently touched course that is still
   * published (prefers an in-progress row over a completed one). Returns null
   * when the learner hasn't started anything yet → callers fall back to the
   * course catalog.
   */
  async getResumeCourseId(userId: string): Promise<string | null> {
    const { data } = await db
      .from("user_progress")
      .select("course_id,status,updated_at")
      .eq("user_id", userId)
      .not("course_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(30);
    const rows = (data ?? []) as { course_id: string | null; status: string }[];
    if (!rows.length) return null;
    const candidate = rows.find((r) => r.status === "in_progress") ?? rows[0];
    const cid = candidate.course_id;
    if (!cid) return null;
    // Only resume a course that's still published (skip archived/removed ones).
    const { data: c } = await db.from("courses").select("id").eq("id", cid).eq("status", "published").maybeSingle();
    return c ? cid : null;
  },

  /** Completed lesson ids for a course. */
  async getCompletedLessonIds(userId: string, courseId: string): Promise<Set<string>> {
    const { data } = await db.from("user_progress").select("lesson_id").eq("user_id", userId).eq("course_id", courseId).eq("status", "completed");
    return new Set((data ?? []).map((r: { lesson_id: string }) => r.lesson_id).filter(Boolean));
  },

  async markLessonComplete(userId: string, courseId: string, chapterId: string | null, lessonId: string): Promise<void> {
    await db.from("user_progress").upsert(
      { user_id: userId, course_id: courseId, chapter_id: chapterId, lesson_id: lessonId, status: "completed", updated_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" }
    );
  },

  /**
   * Record a passed quiz. Stored as a user_progress row keyed by the quiz id
   * (lesson_id has no FK since migration 011), so getCourseProgress() reports a
   * passed quiz as "completed" — which the course screen uses to gate the next
   * chapter behind the quiz.
   */
  async markQuizPassed(userId: string, courseId: string, quiz: Quiz, score: number): Promise<void> {
    await db.from("user_progress").upsert(
      {
        user_id: userId,
        course_id: courseId,
        chapter_id: quiz.chapter_id ?? null,
        lesson_id: quiz.id,
        status: "completed",
        quiz_score: Math.round(score),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );
  },
};
