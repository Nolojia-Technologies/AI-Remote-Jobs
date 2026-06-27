import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { pdfsService } from "@/lib/services/pdfs";
import { extractLessonsFromPdf, countPdfPages, type SplitMode } from "@/lib/pdf/extract";
import { aiStructureLessonsFromPdf } from "@/lib/pdf/restructure";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BYTES = 50 * 1024 * 1024;

/** Upload a course PDF to the private bucket and return extracted lessons. */
export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch (e) {
    const m = (e as Error).message;
    return NextResponse.json({ error: m }, { status: m === "UNAUTHENTICATED" ? 401 : 403 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const courseId = String(form.get("courseId") || "");
    const splitMode = (String(form.get("splitMode") || "headings")) as SplitMode;

    if (!(file instanceof File)) return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    if (!courseId) return NextResponse.json({ error: "Missing courseId." }, { status: 400 });
    if (file.type && file.type !== "application/pdf") return NextResponse.json({ error: "File must be a PDF." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "PDF exceeds the 50MB limit." }, { status: 400 });

    const mode = String(form.get("mode") || "text");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const fileName = file.name || "course.pdf";

    // Native mode: store in the student-streamable private bucket; render as-is.
    if (mode === "native") {
      const { path } = await pdfsService.uploadLessonPdf(courseId, { bytes, name: fileName });
      const pages = await countPdfPages(bytes);
      return NextResponse.json({ native: { path, pages, fileName } });
    }

    // AI mode: extract the PDF's content → restructure into native premium lessons.
    if (mode === "ai") {
      const market = String(form.get("market") || "Kenya, Qatar & global remote workers");
      const { id, path } = await pdfsService.upload(courseId, { bytes, name: fileName, size: file.size }, ctx.userId);
      const lessons = await aiStructureLessonsFromPdf(bytes, {
        splitMode,
        fallbackTitle: fileName.replace(/\.pdf$/i, ""),
        market,
      });
      return NextResponse.json({ pdfId: id, path, fileName, lessons, structured: true });
    }

    // Text mode: extract → lessons.
    const { id, path } = await pdfsService.upload(courseId, { bytes, name: fileName, size: file.size }, ctx.userId);
    const lessons = await extractLessonsFromPdf(bytes, { splitMode, fallbackTitle: fileName.replace(/\.pdf$/i, "") });

    return NextResponse.json({ pdfId: id, path, fileName, lessons });
  } catch (e) {
    console.error("[pdf/import]", e);
    return NextResponse.json({ error: (e as Error).message || "Import failed." }, { status: 500 });
  }
}
