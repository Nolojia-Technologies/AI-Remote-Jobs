import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Module, Lesson, ModuleWithProgress, LessonWithProgress } from "../types/app.types";
import { useUserStore } from "./userStore";
import { XP_REWARDS } from "../constants/xp";
import { logEvent, AnalyticsEvents } from "../lib/analytics";
import { recordRatingSignal } from "../hooks/useRating";

interface LearnState {
  modules: ModuleWithProgress[];
  currentModule: ModuleWithProgress | null;
  currentLesson: LessonWithProgress | null;
  completedLessonIds: Set<string>;
  isLoading: boolean;

  // Actions
  fetchModules: (userId: string, careerPathId: string) => Promise<void>;
  fetchLessonsForModule: (userId: string, moduleId: string) => Promise<LessonWithProgress[]>;
  completeLesson: (userId: string, lessonId: string) => Promise<void>;
  setCurrentModule: (module: ModuleWithProgress | null) => void;
  setCurrentLesson: (lesson: LessonWithProgress | null) => void;
  isLessonCompleted: (lessonId: string) => boolean;
}

export const useLearnStore = create<LearnState>((set, get) => ({
  modules: [],
  currentModule: null,
  currentLesson: null,
  completedLessonIds: new Set(),
  isLoading: false,

  fetchModules: async (userId, careerPathId) => {
    set({ isLoading: true });

    const [modulesRes, progressRes] = await Promise.all([
      supabase
        .from("modules")
        .select("*, lessons(*)")
        .eq("career_path_id", careerPathId)
        .eq("is_active", true)
        .order("order_index"),
      supabase
        .from("user_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("completed", true),
    ]);

    if (modulesRes.error) {
      set({ isLoading: false });
      return;
    }

    const completedSet = new Set<string>(
      progressRes.data?.map((r: any) => r.lesson_id) ?? []
    );

    const modulesWithProgress: ModuleWithProgress[] = (modulesRes.data ?? []).map((m: any) => {
      const lessons: LessonWithProgress[] = (m.lessons ?? []).map((l: Lesson) => ({
        ...l,
        isCompleted: completedSet.has(l.id),
      }));
      const completedLessons = lessons.filter((l) => l.isCompleted).length;
      return {
        ...m,
        lessons,
        completedLessons,
        totalLessons: lessons.length,
        progressPercent:
          lessons.length > 0
            ? Math.round((completedLessons / lessons.length) * 100)
            : 0,
      };
    });

    set({
      modules: modulesWithProgress,
      completedLessonIds: completedSet,
      isLoading: false,
    });
  },

  fetchLessonsForModule: async (userId, moduleId) => {
    const [lessonsRes, progressRes] = await Promise.all([
      supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .eq("is_active", true)
        .order("order_index"),
      supabase
        .from("user_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("completed", true),
    ]);

    const completedSet = new Set<string>(
      progressRes.data?.map((r: any) => r.lesson_id) ?? []
    );

    return (lessonsRes.data ?? []).map((l: Lesson) => ({
      ...l,
      isCompleted: completedSet.has(l.id),
    }));
  },

  completeLesson: async (userId, lessonId) => {
    const alreadyDone = get().completedLessonIds.has(lessonId);
    if (alreadyDone) return;

    const { error } = await supabase.from("user_lesson_progress").upsert({
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    } as any);

    if (error) return;

    // Update local state
    const newCompleted = new Set(get().completedLessonIds);
    newCompleted.add(lessonId);
    set({ completedLessonIds: newCompleted });

    // Award XP
    await useUserStore
      .getState()
      .awardXP(userId, XP_REWARDS.LESSON_COMPLETE, "lesson_complete", "Lesson completed");

    // Refresh modules
    const profile = useUserStore.getState().profile;
    if (profile?.career_path_id) {
      get().fetchModules(userId, profile.career_path_id);
    }

    logEvent(AnalyticsEvents.LESSON_COMPLETE, { lesson_id: lessonId });
    recordRatingSignal("lesson");
  },

  setCurrentModule: (module) => set({ currentModule: module }),
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
  isLessonCompleted: (lessonId) => get().completedLessonIds.has(lessonId),
}));
