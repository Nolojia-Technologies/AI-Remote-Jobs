import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { marked } from "marked";
import { lessonsService } from "@/lib/services/lessons";
import { Button } from "@/components/ui/button";
import { LessonEditor } from "./lesson-editor";
import { PdfLessonPanel } from "./pdf-panel";

export const dynamic = "force-dynamic";

export default async function LessonEditorPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params;
  const lesson = await lessonsService.get(lessonId);
  if (!lesson || lesson.course_id !== id) notFound();

  const backLink = (
    <Link href={`/courses/${id}`}>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to course
      </Button>
    </Link>
  );

  if (lesson.lesson_type === "pdf") {
    return <div>{backLink}<PdfLessonPanel courseId={id} lesson={lesson} /></div>;
  }

  // Rich-text: prefer saved HTML; otherwise convert legacy markdown body to HTML
  // so existing AI/seeded lessons open richly in the editor.
  const initialHtml = lesson.content_html?.trim()
    ? lesson.content_html
    : lesson.body
      ? (marked.parse(lesson.body, { async: false }) as string)
      : "";

  return (
    <div>
      {backLink}
      <LessonEditor courseId={id} lesson={lesson} initialHtml={initialHtml} />
    </div>
  );
}
