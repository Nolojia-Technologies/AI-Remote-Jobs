"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { jobsService } from "@/lib/services/jobs";
import type { JobInput, JobStatus } from "@/types/db";

export async function createJobAction(input: JobInput) {
  const { email } = await requireAdmin();
  const job = await jobsService.create(input, email);
  revalidatePath("/jobs");
  return job;
}

export async function updateJobAction(id: string, patch: Partial<JobInput>) {
  const { email } = await requireAdmin();
  const job = await jobsService.update(id, patch, email);
  revalidatePath("/jobs");
  return job;
}

export async function setJobStatusAction(id: string, status: JobStatus) {
  const { email } = await requireAdmin();
  await jobsService.setStatus(id, status, email);
  revalidatePath("/jobs");
}

export async function duplicateJobAction(id: string) {
  const { email } = await requireAdmin();
  await jobsService.duplicate(id, email);
  revalidatePath("/jobs");
}

export async function deleteJobAction(id: string) {
  const { email } = await requireAdmin();
  await jobsService.remove(id, email);
  revalidatePath("/jobs");
}
