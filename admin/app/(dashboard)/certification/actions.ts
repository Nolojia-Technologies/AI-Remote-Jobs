"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { certificationService } from "@/lib/services/certification";
import type {
  CertificationQuizInput,
  CertificationQuestionInput,
  CertQuizStatus,
  CertQuestionStatus,
} from "@/types/db";

const PATH = "/certification";

// ─── Quiz config ──────────────────────────────────────────────────────────────
export async function createQuizAction(input: CertificationQuizInput) {
  const { email } = await requireAdmin();
  const quiz = await certificationService.createQuiz(input, email);
  revalidatePath(PATH);
  return quiz;
}

export async function updateQuizAction(id: string, patch: CertificationQuizInput) {
  const { email } = await requireAdmin();
  const quiz = await certificationService.updateQuiz(id, patch, email);
  revalidatePath(PATH);
  return quiz;
}

export async function setQuizStatusAction(id: string, status: CertQuizStatus) {
  const { email } = await requireAdmin();
  await certificationService.setQuizStatus(id, status, email);
  revalidatePath(PATH);
}

export async function scheduleQuizAction(id: string, scheduledAt: string) {
  const { email } = await requireAdmin();
  await certificationService.scheduleQuiz(id, scheduledAt, email);
  revalidatePath(PATH);
}

export async function duplicateQuizAction(id: string) {
  const { email } = await requireAdmin();
  await certificationService.duplicateQuiz(id, email);
  revalidatePath(PATH);
}

export async function deleteQuizAction(id: string) {
  const { email } = await requireAdmin();
  await certificationService.removeQuiz(id, email);
  revalidatePath(PATH);
}

// ─── Questions ────────────────────────────────────────────────────────────────
export async function createQuestionAction(input: CertificationQuestionInput) {
  await requireAdmin();
  const q = await certificationService.createQuestion(input);
  revalidatePath(PATH);
  return q;
}

export async function updateQuestionAction(id: string, patch: Partial<CertificationQuestionInput>) {
  await requireAdmin();
  const q = await certificationService.updateQuestion(id, patch);
  revalidatePath(PATH);
  return q;
}

export async function deleteQuestionAction(id: string) {
  await requireAdmin();
  await certificationService.removeQuestion(id);
  revalidatePath(PATH);
}

export async function setQuestionStatusAction(id: string, status: CertQuestionStatus) {
  await requireAdmin();
  await certificationService.setQuestionStatus(id, status);
  revalidatePath(PATH);
}

export async function approveQuestionAction(id: string) {
  await requireAdmin();
  await certificationService.approveQuestion(id);
  revalidatePath(PATH);
}

export async function bulkImportAction(quizId: string, rows: Omit<CertificationQuestionInput, "quiz_id">[]) {
  await requireAdmin();
  const count = await certificationService.bulkInsert(quizId, rows);
  revalidatePath(PATH);
  return count;
}

export async function previewAttemptAction(quizId: string) {
  await requireAdmin();
  return certificationService.previewAttempt(quizId);
}
