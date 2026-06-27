"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { coursesService } from "@/lib/services/courses";
import type { CourseInput, CourseStatus } from "@/types/db";

export async function createCourseAction(input: CourseInput) {
  const { email } = await requireAdmin();
  const course = await coursesService.create(input, email);
  revalidatePath("/courses");
  return course;
}

export async function updateCourseAction(id: string, patch: Partial<CourseInput>) {
  const { email } = await requireAdmin();
  const course = await coursesService.update(id, patch, email);
  revalidatePath("/courses");
  revalidatePath(`/courses/${id}`);
  return course;
}

export async function setCourseStatusAction(id: string, status: CourseStatus) {
  const { email } = await requireAdmin();
  await coursesService.setStatus(id, status, email);
  revalidatePath("/courses");
  revalidatePath(`/courses/${id}`);
}

export async function duplicateCourseAction(id: string) {
  const { email } = await requireAdmin();
  const copy = await coursesService.duplicate(id, email);
  revalidatePath("/courses");
  return copy;
}

export async function deleteCourseAction(id: string) {
  const { email } = await requireAdmin();
  await coursesService.remove(id, email);
  revalidatePath("/courses");
}
