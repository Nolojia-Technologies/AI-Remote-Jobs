import "server-only";
import { aiSettingsService } from "../services/aiSettings";

/**
 * The effective AI configuration for a request: DB settings (set on the AI APIs
 * page) take precedence, falling back to env vars, then to sane defaults. This
 * is the single source of truth used by the generation layer.
 */
export interface ResolvedAiConfig {
  provider: "openai" | "anthropic";
  openaiKey?: string;
  openaiModel: string;
  openaiImageModel: string;
  anthropicKey?: string;
  anthropicModel: string;
}

export const AI_DEFAULTS = {
  openaiModel: "gpt-5",
  openaiImageModel: "gpt-image-1",
  anthropicModel: "claude-opus-4-8",
} as const;

function nonEmpty(v: string | null | undefined): string | undefined {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : undefined;
}

export async function resolveAiConfig(): Promise<ResolvedAiConfig> {
  const db = await aiSettingsService.get();

  const openaiKey = nonEmpty(db?.openai_api_key) ?? nonEmpty(process.env.OPENAI_API_KEY);
  const anthropicKey = nonEmpty(db?.anthropic_api_key) ?? nonEmpty(process.env.ANTHROPIC_API_KEY);

  // Provider: explicit DB choice → explicit env → auto-detect from whichever key exists.
  const explicit = nonEmpty(db?.provider) ?? nonEmpty(process.env.AI_PROVIDER);
  const provider: "openai" | "anthropic" =
    explicit === "anthropic" || explicit === "openai"
      ? (explicit as "openai" | "anthropic")
      : anthropicKey && !openaiKey
      ? "anthropic"
      : "openai";

  return {
    provider,
    openaiKey,
    openaiModel: nonEmpty(db?.openai_model) ?? nonEmpty(process.env.OPENAI_MODEL) ?? AI_DEFAULTS.openaiModel,
    openaiImageModel:
      nonEmpty(db?.openai_image_model) ?? nonEmpty(process.env.OPENAI_IMAGE_MODEL) ?? AI_DEFAULTS.openaiImageModel,
    anthropicKey,
    anthropicModel: nonEmpty(db?.anthropic_model) ?? nonEmpty(process.env.ANTHROPIC_MODEL) ?? AI_DEFAULTS.anthropicModel,
  };
}

/** The active provider + model (for status displays / audit logging). */
export async function activeAiModel(cfg?: ResolvedAiConfig): Promise<{ provider: string; model: string }> {
  const c = cfg ?? (await resolveAiConfig());
  return { provider: c.provider, model: c.provider === "anthropic" ? c.anthropicModel : c.openaiModel };
}
