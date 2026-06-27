import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ZodSchema } from "zod";

/** Build a client from an explicit key (from DB settings) or the env fallback. */
function client(apiKey?: string): Anthropic {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("No Anthropic API key configured. Add one on the AI APIs page (or set ANTHROPIC_API_KEY).");
  }
  return new Anthropic({ apiKey: key });
}

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/** Pull a JSON object out of a model reply, tolerating code fences / stray prose. */
function extractJson(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) t = t.slice(first, last + 1);
  return t;
}

/**
 * Claude implementation of the layered generators. Streams the response (the
 * Anthropic SDK recommends streaming for long / high-max_tokens requests so they
 * don't hit HTTP timeouts) and validates the JSON against the layer's zod schema.
 */
export async function anthropicGenerateJSON<T>(opts: {
  system: string;
  user: string;
  schema: ZodSchema<T>;
  apiKey?: string;
  model?: string;
}): Promise<T> {
  const stream = client(opts.apiKey).messages.stream({
    model: opts.model || ANTHROPIC_MODEL,
    max_tokens: 32000,
    system:
      opts.system +
      "\n\nRespond with ONLY a single valid JSON object matching the requested shape. No prose, no explanation, no markdown code fences.",
    messages: [{ role: "user", content: opts.user }],
  });

  const message = await stream.finalMessage();
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error("Claude did not return valid JSON.");
  }
  const result = opts.schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Claude JSON failed validation: ${result.error.message}`);
  }
  return result.data;
}
