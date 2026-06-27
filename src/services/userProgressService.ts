import { supabase } from "../lib/supabase";
import { LessonProgress, LessonProgressStatus } from "../types/content.types";

const db = supabase as any;

export interface SaveProgressInput {
  userId: string;
  courseId: string;
  chapterId: string | null;
  lessonId: string;
  timeSpentSeconds: number;
  scrollPercentage: number;
  lastScrollPosition: number;
  currentPage?: number;
  totalPages?: number;
  startedAt: string;
  status: LessonProgressStatus;
}

export const userProgressService = {
  /** Existing reading progress for one lesson (resume point), or null. */
  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
    const { data } = await db
      .from("user_progress")
      .select("lesson_id,time_spent_seconds,scroll_percentage,last_scroll_position,current_page,total_pages,status,started_at,completed_at")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle();
    return (data as LessonProgress) ?? null;
  },

  /** Status by lesson id for a whole course (drives the outline indicators). */
  async getCourseProgress(userId: string, courseId: string): Promise<Map<string, LessonProgressStatus>> {
    const { data } = await db
      .from("user_progress")
      .select("lesson_id,status")
      .eq("user_id", userId)
      .eq("course_id", courseId);
    const map = new Map<string, LessonProgressStatus>();
    (data ?? []).forEach((r: { lesson_id: string; status: LessonProgressStatus }) => {
      if (r.lesson_id) map.set(r.lesson_id, r.status);
    });
    return map;
  },

  /**
   * Upsert in-progress reading state. Omits completed_at so a background/blur
   * autosave can never clobber a lesson that was already completed.
   */
  async saveLessonProgress(p: SaveProgressInput): Promise<void> {
    await db.from("user_progress").upsert(
      {
        user_id: p.userId,
        course_id: p.courseId,
        chapter_id: p.chapterId,
        lesson_id: p.lessonId,
        time_spent_seconds: Math.round(p.timeSpentSeconds),
        scroll_percentage: Math.round(p.scrollPercentage),
        last_scroll_position: Math.round(p.lastScrollPosition),
        current_page: Math.round(p.currentPage ?? 0),
        total_pages: Math.round(p.totalPages ?? 0),
        started_at: p.startedAt,
        status: p.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );
  },

  /** Final write: mark completed with the final time/scroll. */
  async completeLesson(p: Omit<SaveProgressInput, "status">): Promise<void> {
    await db.from("user_progress").upsert(
      {
        user_id: p.userId,
        course_id: p.courseId,
        chapter_id: p.chapterId,
        lesson_id: p.lessonId,
        time_spent_seconds: Math.round(p.timeSpentSeconds),
        scroll_percentage: Math.round(p.scrollPercentage),
        last_scroll_position: Math.round(p.lastScrollPosition),
        current_page: Math.round(p.currentPage ?? 0),
        total_pages: Math.round(p.totalPages ?? 0),
        started_at: p.startedAt,
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );
  },
};
