import { createClient } from "@/lib/supabase/client";

/** Upload an image File to the public `images` bucket and return its URL. */
export async function uploadLessonImage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `lessons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
}
