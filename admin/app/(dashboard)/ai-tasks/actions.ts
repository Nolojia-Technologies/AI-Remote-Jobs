"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { aiTasksService, type AiTaskInput, type AiTaskStatus } from "@/lib/services/aiTasks";

export async function createAiTaskAction(input: AiTaskInput) {
  const { email } = await requireAdmin();
  const task = await aiTasksService.create(input, email);
  revalidatePath("/ai-tasks");
  return task;
}

export async function updateAiTaskAction(id: string, patch: Partial<AiTaskInput>) {
  const { email } = await requireAdmin();
  const task = await aiTasksService.update(id, patch, email);
  revalidatePath("/ai-tasks");
  return task;
}

export async function setAiTaskStatusAction(id: string, status: AiTaskStatus) {
  const { email } = await requireAdmin();
  await aiTasksService.setStatus(id, status, email);
  revalidatePath("/ai-tasks");
}

export async function duplicateAiTaskAction(id: string) {
  const { email } = await requireAdmin();
  await aiTasksService.duplicate(id, email);
  revalidatePath("/ai-tasks");
}

export async function deleteAiTaskAction(id: string) {
  const { email } = await requireAdmin();
  await aiTasksService.remove(id, email);
  revalidatePath("/ai-tasks");
}

export async function bulkImportAiTasksAction(rows: AiTaskInput[]) {
  const { email } = await requireAdmin();
  const count = await aiTasksService.bulkInsert(rows, email);
  revalidatePath("/ai-tasks");
  return count;
}

export async function getAiTaskAnswerAction(id: string) {
  await requireAdmin();
  return aiTasksService.getAnswer(id);
}
