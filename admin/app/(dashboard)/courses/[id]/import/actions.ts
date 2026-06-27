"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { lessonsService } from "@/lib/services/lessons";
import { chaptersService } from "@/lib/services/chapters";
import { pdfsService } from "@/lib/services/pdfs";
import { extractLessonsFromPdf, type SplitMode } from "@/lib/pdf/extract";
import { aiStructureLessonsFromPdf } from "@/lib/pdf/restructure";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function readingMeta(text: string) {
  return { character_count: text.length, estimated_reading_minutes: Math.max(1, Math.ceil(text.length / 1000)) };
}

export async function createNewChapter(courseId: string, stageId: string | null, title: string) {
  const { email } = await requireAdmin();
  const ch = await chaptersService.create({ course_id: courseId, title: title || "Imported", stage_id: stageId, order_index: 999 } as any, email);
  revalidatePath(`/courses/${courseId}`);
  return { id: ch.id };
}

export async function createLessonsFromImport(
  courseId: string,
  chapterId: string,
  lessons: { title: string; html: string }[]
) {
  const { email } = await requireAdmin();
  const chapter = (await chaptersService.listByCourse(courseId)).find((c) => c.id === chapterId);
  let order = 0;
  for (const l of lessons) {
    const text = stripHtml(l.html);
    await lessonsService.create(
      {
        course_id: courseId,
        chapter_id: chapterId,
        stage_id: chapter?.stage_id ?? null,
        title: l.title?.trim() || "Untitled lesson",
        type: "text",
        content_html: l.html,
        body: text,
        ...readingMeta(text),
        order_index: 500 + order++,
        status: "draft",
      } as any,
      email
    );
  }
  revalidatePath(`/courses/${courseId}`);
}

/**
 * Create lessons from AI-restructured PDF content. Stores `body` Markdown (and
 * NO content_html) so they render exactly like our hand/AI-authored lessons —
 * gaining the full reading experience + cooldown/quiz gates on the mobile side.
 */
export async function createStructuredLessonsFromImport(
  courseId: string,
  chapterId: string,
  lessons: { title: string; body: string }[]
) {
  const { email } = await requireAdmin();
  const chapter = (await chaptersService.listByCourse(courseId)).find((c) => c.id === chapterId);
  let order = 0;
  for (const l of lessons) {
    const body = (l.body || "").trim();
    await lessonsService.create(
      {
        course_id: courseId,
        chapter_id: chapterId,
        stage_id: chapter?.stage_id ?? null,
        title: l.title?.trim() || "Untitled lesson",
        type: "text",
        lesson_type: "rich_text",
        body,
        content_html: null,
        ...readingMeta(body),
        order_index: 500 + order++,
        status: "draft",
      } as any,
      email
    );
  }
  revalidatePath(`/courses/${courseId}`);
}

/**
 * Upgrade an existing native-PDF lesson into structured rich-text lesson(s):
 * read the source PDF, restructure it, replace this lesson's content in place,
 * and append any additional sections as sibling lessons.
 */
export async function convertNativePdfToStructured(
  courseId: string,
  lessonId: string,
  market = "Kenya, Qatar & global remote workers"
) {
  const { email } = await requireAdmin();
  const lesson = await lessonsService.get(lessonId);
  if (!lesson?.pdf_path) throw new Error("This lesson has no source PDF to convert.");

  const bytes = await pdfsService.getLessonPdfBytes(lesson.pdf_path);
  const structured = await aiStructureLessonsFromPdf(bytes, { splitMode: "headings", fallbackTitle: lesson.title, market });
  if (structured.length === 0) throw new Error("Could not extract readable content from this PDF.");

  const [first, ...rest] = structured;
  await lessonsService.update(
    lessonId,
    {
      type: "text",
      lesson_type: "rich_text",
      title: first.title || lesson.title,
      body: first.body,
      content_html: null,
      pdf_path: null,
      pdf_pages: null,
      ...readingMeta(first.body),
    } as any,
    email
  );

  let order = (lesson.order_index ?? 500) + 1;
  for (const l of rest) {
    await lessonsService.create(
      {
        course_id: courseId,
        chapter_id: lesson.chapter_id,
        stage_id: lesson.stage_id,
        title: l.title,
        type: "text",
        lesson_type: "rich_text",
        body: l.body,
        content_html: null,
        ...readingMeta(l.body),
        order_index: order++,
        status: "draft",
      } as any,
      email
    );
  }
  revalidatePath(`/courses/${courseId}`);
  return { created: rest.length + 1 };
}

export async function createNativePdfLesson(
  courseId: string,
  chapterId: string,
  pdf: { path: string; pages: number; title: string }
) {
  const { email } = await requireAdmin();
  const chapter = (await chaptersService.listByCourse(courseId)).find((c) => c.id === chapterId);
  await lessonsService.create(
    {
      course_id: courseId,
      chapter_id: chapterId,
      stage_id: chapter?.stage_id ?? null,
      title: pdf.title?.trim() || "PDF lesson",
      type: "pdf",
      lesson_type: "pdf",
      pdf_path: pdf.path,
      pdf_pages: pdf.pages,
      estimated_reading_minutes: Math.max(1, pdf.pages),
      order_index: 600,
      status: "draft",
    } as any,
    email
  );
  revalidatePath(`/courses/${courseId}`);
}

export async function reprocessPdf(path: string, splitMode: SplitMode, fallbackTitle: string) {
  await requireAdmin();
  const bytes = await pdfsService.getBytes(path);
  return extractLessonsFromPdf(bytes, { splitMode, fallbackTitle });
}

export async function deletePdf(courseId: string, id: string) {
  await requireAdmin();
  await pdfsService.remove(id);
  revalidatePath(`/courses/${courseId}/import`);
}
