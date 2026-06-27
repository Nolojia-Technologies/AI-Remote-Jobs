"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { stagesService } from "@/lib/services/stages";
import { chaptersService } from "@/lib/services/chapters";
import { lessonsService } from "@/lib/services/lessons";
import { quizzesService } from "@/lib/services/quizzes";
import { questionsService } from "@/lib/services/questions";
import type {
  StageInput,
  ChapterInput,
  LessonInput,
  QuizInput,
  QuestionInput,
} from "@/types/db";

function touch(courseId: string) {
  revalidatePath(`/courses/${courseId}`);
}

// ─── Stages ──────────────────────────────────────────────────────────────────
export async function addStage(courseId: string, input: Omit<StageInput, "course_id">) {
  const { email } = await requireAdmin();
  const s = await stagesService.create({ course_id: courseId, ...input } as StageInput, email);
  touch(courseId);
  return s;
}
export async function editStage(courseId: string, id: string, patch: Partial<StageInput>) {
  const { email } = await requireAdmin();
  await stagesService.update(id, patch, email);
  touch(courseId);
}
export async function removeStage(courseId: string, id: string) {
  const { email } = await requireAdmin();
  await stagesService.remove(id, email);
  touch(courseId);
}

// ─── Chapters ────────────────────────────────────────────────────────────────
export async function addChapter(courseId: string, input: Omit<ChapterInput, "course_id">) {
  const { email } = await requireAdmin();
  const c = await chaptersService.create({ course_id: courseId, ...input } as ChapterInput, email);
  touch(courseId);
  return c;
}
export async function editChapter(courseId: string, id: string, patch: Partial<ChapterInput>) {
  const { email } = await requireAdmin();
  await chaptersService.update(id, patch, email);
  touch(courseId);
}
export async function removeChapter(courseId: string, id: string) {
  const { email } = await requireAdmin();
  await chaptersService.remove(id, email);
  touch(courseId);
}

// ─── Lessons ─────────────────────────────────────────────────────────────────
export async function addLesson(courseId: string, input: Omit<LessonInput, "course_id">) {
  const { email } = await requireAdmin();
  const l = await lessonsService.create({ course_id: courseId, ...input } as LessonInput, email);
  touch(courseId);
  return l;
}
export async function editLesson(courseId: string, id: string, patch: Partial<LessonInput>) {
  const { email } = await requireAdmin();
  await lessonsService.update(id, patch, email);
  touch(courseId);
}
export async function removeLesson(courseId: string, id: string) {
  const { email } = await requireAdmin();
  await lessonsService.remove(id, email);
  touch(courseId);
}

// ─── Quizzes + questions ─────────────────────────────────────────────────────
export async function addQuiz(courseId: string, input: Omit<QuizInput, "course_id">) {
  const { email } = await requireAdmin();
  const q = await quizzesService.create({ course_id: courseId, ...input } as QuizInput, email);
  touch(courseId);
  return q;
}
export async function editQuiz(courseId: string, id: string, patch: Partial<QuizInput>) {
  const { email } = await requireAdmin();
  await quizzesService.update(id, patch, email);
  touch(courseId);
}
export async function removeQuiz(courseId: string, id: string) {
  const { email } = await requireAdmin();
  await quizzesService.remove(id, email);
  touch(courseId);
}

export async function getQuizQuestions(quizId: string) {
  await requireAdmin();
  return questionsService.listByQuiz(quizId);
}
export async function saveQuizQuestions(quizId: string, questions: Omit<QuestionInput, "quiz_id">[]) {
  await requireAdmin();
  await questionsService.replaceForQuiz(quizId, questions);
}
