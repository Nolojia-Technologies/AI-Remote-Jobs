import "server-only";
import OpenAI from "openai";
import type { ZodSchema } from "zod";

/** Build a client from an explicit key (from DB settings) or the env fallback. */
function client(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("No OpenAI API key configured. Add one on the AI APIs page (or set OPENAI_API_KEY).");
  }
  return new OpenAI({ apiKey: key });
}

export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-5";

/**
 * Calls the model and returns strict, schema-validated JSON. Used by every
 * generation layer so a malformed model response fails loudly instead of
 * persisting garbage. `apiKey`/`model` come from the resolved AI config.
 */
export async function generateJSON<T>(opts: {
  system: string;
  user: string;
  schema: ZodSchema<T>;
  apiKey?: string;
  model?: string;
}): Promise<T> {
  const res = await client(opts.apiKey).chat.completions.create({
    model: opts.model || AI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model did not return valid JSON.");
  }
  const result = opts.schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Model JSON failed validation: ${result.error.message}`);
  }
  return result.data;
}

/** Generates a thumbnail image (PNG bytes) for a course. */
export async function generateThumbnail(prompt: string, opts?: { apiKey?: string; model?: string }): Promise<Buffer> {
  const res = await client(opts?.apiKey).images.generate({
    model: opts?.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    prompt,
    size: "1024x1024",
    n: 1,
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned no data.");
  return Buffer.from(b64, "base64");
}
