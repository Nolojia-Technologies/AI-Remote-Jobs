import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { coursesService } from "@/lib/services/courses";
import { chaptersService } from "@/lib/services/chapters";
import { stagesService } from "@/lib/services/stages";
import { pdfsService } from "@/lib/services/pdfs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PdfImport } from "./pdf-import";

export const dynamic = "force-dynamic";

export default async function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await coursesService.get(id);
  if (!course) notFound();

  const [chapters, stages, pdfs] = await Promise.all([
    chaptersService.listByCourse(id),
    stagesService.listByCourse(id),
    pdfsService.list(id),
  ]);

  return (
    <div>
      <Link href={`/courses/${id}`}>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Button>
      </Link>
      <PageHeader title="Import from PDF" description={`Upload a PDF and turn it into lessons for “${course.title}”. Learners never see the PDF.`} />
      <PdfImport
        courseId={id}
        chapters={chapters.map((c) => ({ id: c.id, title: c.title, stage_id: c.stage_id }))}
        stages={stages.map((s) => ({ id: s.id, title: s.title }))}
        pdfs={pdfs.map((p) => ({ id: p.id, file_name: p.file_name, file_path: p.file_path, created_at: p.created_at }))}
      />
    </div>
  );
}
