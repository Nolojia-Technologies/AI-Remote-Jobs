import { z } from "zod";
import { adminRoute } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";

export const maxDuration = 120;

const schema = z.object({ html: z.string() });

/** Optional AI polish of imported lesson HTML (reuses the configured provider). */
export const POST = adminRoute<{ html: string }>(async (body) => {
  const html = (body.html || "").slice(0, 60000);
  if (!html.trim()) return { html: "" };

  const out = await generateJSON({
    system:
      "You are a meticulous course editor. Clean up lesson HTML that was extracted from a PDF: fix broken headings, merge paragraphs that were split across lines, and use semantic tags (h1–h4, p, ul/ol/li, strong, em, blockquote, table). Preserve ALL wording — do not summarise, add, or remove content. Respond ONLY with JSON.",
    user: `Return improved HTML for this lesson as JSON of the form {"html": "..."}. Source HTML:\n\n${html}`,
    schema,
  });

  return { html: out.html };
});
