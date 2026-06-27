"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { aiSettingsService, type AiSettingsPatch } from "@/lib/services/aiSettings";
import { resolveAiConfig, activeAiModel } from "@/lib/ai/config";
import { generateJSON } from "@/lib/ai/provider";

export interface SaveAiSettingsInput {
  provider: "openai" | "anthropic";
  openaiModel: string;
  openaiImageModel: string;
  anthropicModel: string;
  /** Empty string = leave the stored key unchanged. */
  openaiApiKey: string;
  anthropicApiKey: string;
}

export async function saveAiSettings(input: SaveAiSettingsInput) {
  const { email } = await requireAdmin();

  const patch: AiSettingsPatch = {
    provider: input.provider === "anthropic" ? "anthropic" : "openai",
    openai_model: input.openaiModel.trim() || null,
    openai_image_model: input.openaiImageModel.trim() || null,
    anthropic_model: input.anthropicModel.trim() || null,
  };
  // Only overwrite a key when the admin actually typed a new one.
  if (input.openaiApiKey.trim()) patch.openai_api_key = input.openaiApiKey.trim();
  if (input.anthropicApiKey.trim()) patch.anthropic_api_key = input.anthropicApiKey.trim();

  await aiSettingsService.save(patch, email);
  revalidatePath("/ai-apis");
  return { ok: true };
}

/** Live check that the active provider/key works (a tiny JSON round-trip). */
export async function testAiProvider(): Promise<{ ok: boolean; provider: string; model: string; error?: string }> {
  await requireAdmin();
  const { provider, model } = await activeAiModel();
  try {
    const r = await generateJSON({
      system: "You are a connectivity health check. Respond with ONLY a JSON object.",
      user: 'Return exactly {"ok": true}.',
      schema: z.object({ ok: z.boolean() }),
    });
    return { ok: !!r.ok, provider, model };
  } catch (e) {
    return { ok: false, provider, model, error: (e as Error).message };
  }
}

/** Clear a stored key (revert to env / unset). */
export async function clearAiKey(which: "openai" | "anthropic") {
  const { email } = await requireAdmin();
  await aiSettingsService.save(
    which === "openai" ? { openai_api_key: null } : { anthropic_api_key: null },
    email
  );
  revalidatePath("/ai-apis");
  return { ok: true };
}

/** Masked status for the page (never returns full keys). */
export async function getAiStatus() {
  await requireAdmin();
  const row = await aiSettingsService.get();
  const cfg = await resolveAiConfig();

  const status = (saved: string | null | undefined, envName: string) => {
    const s = (saved ?? "").trim();
    if (s) return { state: "saved" as const, last4: s.slice(-4) };
    if ((process.env[envName] ?? "").trim()) return { state: "env" as const, last4: "" };
    return { state: "none" as const, last4: "" };
  };

  return {
    provider: cfg.provider,
    openai: {
      key: status(row?.openai_api_key, "OPENAI_API_KEY"),
      model: row?.openai_model ?? "",
      imageModel: row?.openai_image_model ?? "",
      effectiveModel: cfg.openaiModel,
      effectiveImageModel: cfg.openaiImageModel,
    },
    anthropic: {
      key: status(row?.anthropic_api_key, "ANTHROPIC_API_KEY"),
      model: row?.anthropic_model ?? "",
      effectiveModel: cfg.anthropicModel,
    },
  };
}

export type AiStatus = Awaited<ReturnType<typeof getAiStatus>>;
