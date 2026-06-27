import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Storage buckets provisioned by the CMS migrations (public read / admin write). */
export const STORAGE_BUCKETS = [
  "course-thumbnails",
  "images",
  "certificates",
  "icons",
  "lesson-resources",
  "videos",
] as const;
export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

export const mediaService = {
  async list(bucket: StorageBucket, prefix = "") {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw error;
    return (data ?? []).map((f) => ({
      name: f.name,
      size: (f as any).metadata?.size ?? null,
      updated_at: (f as any).updated_at ?? null,
      url: admin.storage.from(bucket).getPublicUrl(prefix ? `${prefix}/${f.name}` : f.name).data.publicUrl,
    }));
  },

  /** Server-side upload (e.g. an AI-generated thumbnail). Returns the public URL. */
  async upload(bucket: StorageBucket, path: string, body: Buffer | Uint8Array, contentType: string) {
    const admin = createAdminClient();
    const { error } = await admin.storage.from(bucket).upload(path, body, { contentType, upsert: true });
    if (error) throw error;
    return admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },

  async remove(bucket: StorageBucket, path: string) {
    const admin = createAdminClient();
    const { error } = await admin.storage.from(bucket).remove([path]);
    if (error) throw error;
  },
};
