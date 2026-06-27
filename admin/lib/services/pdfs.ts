import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "course-pdfs";

export interface CoursePdfRow {
  id: string;
  course_id: string;
  file_path: string;
  file_name: string;
  size_bytes: number;
  status: string;
  created_at: string;
}

/**
 * Private-bucket PDF storage + import bookkeeping. All ops use the service-role
 * client (the bucket is admin-only / never public). Routes must requireAdmin first.
 */
export const pdfsService = {
  async upload(
    courseId: string,
    file: { bytes: Buffer | Uint8Array; name: string; size: number },
    userId: string
  ): Promise<{ id: string; path: string }> {
    const admin = createAdminClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${courseId}/${Date.now()}-${safe}`;
    const { error } = await admin.storage.from(BUCKET).upload(path, file.bytes as any, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (error) throw error;

    const { data, error: e2 } = await admin
      .from("course_pdfs")
      .insert({ course_id: courseId, file_path: path, file_name: file.name, size_bytes: file.size, created_by: userId, status: "processed" } as any)
      .select("id")
      .single();
    if (e2) throw e2;
    return { id: data.id as string, path };
  },

  /** Upload a PDF that will be rendered natively (private student-streamable bucket). */
  async uploadLessonPdf(courseId: string, file: { bytes: Buffer | Uint8Array; name: string }): Promise<{ path: string }> {
    const admin = createAdminClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${courseId}/${Date.now()}-${safe}`;
    const { error } = await admin.storage.from("lesson-pdfs").upload(path, file.bytes as any, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (error) throw error;
    return { path };
  },

  async list(courseId: string): Promise<CoursePdfRow[]> {
    const admin = createAdminClient();
    const { data } = await admin.from("course_pdfs").select("*").eq("course_id", courseId).order("created_at", { ascending: false });
    return (data ?? []) as CoursePdfRow[];
  },

  async remove(id: string): Promise<void> {
    const admin = createAdminClient();
    const { data } = await admin.from("course_pdfs").select("file_path").eq("id", id).maybeSingle();
    if (data?.file_path) await admin.storage.from(BUCKET).remove([data.file_path]);
    await admin.from("course_pdfs").delete().eq("id", id);
  },

  async getBytes(path: string): Promise<Uint8Array> {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from(BUCKET).download(path);
    if (error || !data) throw error ?? new Error("PDF not found");
    return new Uint8Array(await data.arrayBuffer());
  },

  /** Bytes of a native lesson PDF (the student-streamable bucket) — for converting to structured lessons. */
  async getLessonPdfBytes(path: string): Promise<Uint8Array> {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from("lesson-pdfs").download(path);
    if (error || !data) throw error ?? new Error("PDF not found");
    return new Uint8Array(await data.arrayBuffer());
  },
};
