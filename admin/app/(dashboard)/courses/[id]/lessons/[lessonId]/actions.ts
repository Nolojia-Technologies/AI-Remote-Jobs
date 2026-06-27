"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { lessonsService } from "@/lib/services/lessons";
import type { CourseStatus, LessonType } from "@/types/db";

export async function saveLessonContent(
  courseId: string,
  lessonId: string,
  patch: {
    title: string;
    type: LessonType;
    status: CourseStatus;
    content_html: string;
    content: any;
    body: string;
    character_count: number;
    estimated_reading_minutes: number;
  }
) {
  const { email } = await requireAdmin();
  await lessonsService.update(lessonId, patch as any, email);
  revalidatePath(`/courses/${courseId}`);
}

export async function saveLessonMeta(
  courseId: string,
  lessonId: string,
  patch: { title: string; status: CourseStatus }
) {
  const { email } = await requireAdmin();
  await lessonsService.update(lessonId, patch as any, email);
  revalidatePath(`/courses/${courseId}`);
}
