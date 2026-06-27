import "server-only";
import type { ZodSchema } from "zod";
import { generateJSON as openaiGenerateJSON, generateThumbnail as openaiThumbnail } from "./openai";
import { anthropicGenerateJSON } from "./anthropic";
import { resolveAiConfig, activeAiModel } from "./config";

export type AIProvider = "openai" | "anthropic";

/**
 * Layered JSON generation, dispatched to whichever provider is configured on
 * the AI APIs page (DB settings) — falling back to env. The key + model used
 * are resolved per call, so changing them in the portal takes effect immediately
 * with no redeploy.
 */
export async function generateJSON<T>(opts: {
  system: string;
  user: string;
  schema: ZodSchema<T>;
}): Promise<T> {
  const cfg = await resolveAiConfig();
  return cfg.provider === "anthropic"
    ? anthropicGenerateJSON({ ...opts, apiKey: cfg.anthropicKey, model: cfg.anthropicModel })
    : openaiGenerateJSON({ ...opts, apiKey: cfg.openaiKey, model: cfg.openaiModel });
}

/**
 * Thumbnail (image) generation is OpenAI-only — Claude does not generate images.
 * Uses the OpenAI key from the resolved config regardless of the text provider.
 */
export async function generateThumbnail(prompt: string): Promise<Buffer> {
  const cfg = await resolveAiConfig();
  if (!cfg.openaiKey) {
    throw new Error("Thumbnail generation requires an OpenAI API key (set it on the AI APIs page).");
  }
  return openaiThumbnail(prompt, { apiKey: cfg.openaiKey, model: cfg.openaiImageModel });
}

/** Active provider name (for audit logging / status). */
export async function aiProvider(): Promise<AIProvider> {
  return (await resolveAiConfig()).provider;
}

/** Active model id (for audit logging / status). */
export async function aiModel(): Promise<string> {
  return (await activeAiModel()).model;
}
