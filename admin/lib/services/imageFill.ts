import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolves an `IMAGE_NEEDED[keyword]` marker into a REAL, self-hosted photo:
 * searches Wikimedia Commons for the keyword, filters out non-photos (maps,
 * logos, paintings, diagrams), downloads the best match and mirrors it into
 * the public `task-images` bucket (the app can't hotlink Wikimedia — it
 * blocks unknown HTTP clients). Returns the bucket's public URL, or null.
 */

const UA = "AIRemoteJobsAdmin/1.0 (task image fill; nolojiatechnologies@gmail.com)";
const NOT_A_PHOTO =
  /(map|logo|icon|diagram|chart|flag|coat[_ ]of[_ ]arms|locator|banner|montage|collage|scheme|graph|painting|drawing|sketch|engraving|artwork|illustration|museum|gallery|\bart\b)/i;

export const IMAGE_MARKER = /IMAGE_NEEDED\[([^\]]+)\]/i;

export async function resolveCommonsImage(keyword: string): Promise<string | null> {
  try {
    const api =
      "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" +
      encodeURIComponent(`filetype:bitmap ${keyword} photo`) +
      "&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url%7Cmime&iiurlwidth=500&format=json";
    const res = await fetch(api, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const json = await res.json();
    const pages = Object.values((json?.query?.pages ?? {}) as Record<string, any>);
    pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));

    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl || info.mime !== "image/jpeg") continue;
      if (NOT_A_PHOTO.test(page.title ?? "")) continue;

      const img = await fetch(info.thumburl, { headers: { "User-Agent": UA } });
      if (!img.ok) continue;
      const buf = Buffer.from(await img.arrayBuffer());
      if (buf.length < 5000 || buf.subarray(0, 2).toString("hex") !== "ffd8") continue; // real JPEG only

      const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const name = `fill-${slug}-${Date.now().toString(36)}.jpg`;
      const admin = createAdminClient();
      const { error } = await admin.storage
        .from("task-images")
        .upload(name, buf, { contentType: "image/jpeg", upsert: true });
      if (error) continue;
      const { data } = admin.storage.from("task-images").getPublicUrl(name);
      return data.publicUrl;
    }
  } catch {
    // network hiccup — the task simply imports without an image
  }
  return null;
}

/**
 * Fills IMAGE_NEEDED markers on a task input in place: resolves the keyword
 * to a hosted photo, sets content.image_url, and strips the marker from the
 * description/question text. Returns whether a marker was found.
 */
export async function fillTaskImageMarker(input: {
  description?: string;
  content?: Record<string, any>;
}): Promise<boolean> {
  const fields = [input.content?.image_url, input.description, input.content?.question];
  let keyword: string | null = null;
  for (const f of fields) {
    const m = typeof f === "string" ? f.match(IMAGE_MARKER) : null;
    if (m) {
      keyword = m[1].trim();
      break;
    }
  }
  if (!keyword) return false;

  const url = await resolveCommonsImage(keyword);
  input.content = input.content ?? {};
  if (url) input.content.image_url = url;
  else if (typeof input.content.image_url === "string" && IMAGE_MARKER.test(input.content.image_url)) {
    delete input.content.image_url; // never ship a marker as a URL
  }
  if (typeof input.description === "string") {
    input.description = input.description.replace(IMAGE_MARKER, "").trim();
  }
  if (typeof input.content.question === "string") {
    input.content.question = input.content.question.replace(IMAGE_MARKER, "").trim();
  }
  return true;
}
