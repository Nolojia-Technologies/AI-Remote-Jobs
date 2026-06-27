import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Runtime AI provider settings (provider, API keys, models) stored in the
 * service-role-only `ai_settings` table. Keys never leave the server — the UI
 * only ever receives masked status (see getStatus).
 */
export interface AiSettingsRow {
  provider: "openai" | "anthropic";
  openai_api_key: string | null;
  openai_model: string | null;
  openai_image_model: string | null;
  anthropic_api_key: string | null;
  anthropic_model: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

export interface AiSettingsPatch {
  provider?: "openai" | "anthropic";
  openai_api_key?: string | null; // omit/undefined = leave unchanged
  openai_model?: string | null;
  openai_image_model?: string | null;
  anthropic_api_key?: string | null; // omit/undefined = leave unchanged
  anthropic_model?: string | null;
}

const ROW_ID = "default";

export const aiSettingsService = {
  async get(): Promise<AiSettingsRow | null> {
    try {
      const admin = createAdminClient();
      const { data } = await admin.from("ai_settings").select("*").eq("id", ROW_ID).maybeSingle();
      return (data as AiSettingsRow) ?? null;
    } catch {
      return null; // table may not exist yet (migration not run) → fall back to env
    }
  },

  async save(patch: AiSettingsPatch, updatedBy: string): Promise<void> {
    const admin = createAdminClient();
    // Drop undefined keys so we never blank a stored secret the user left untouched.
    const clean: Record<string, unknown> = { id: ROW_ID, updated_by: updatedBy, updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) clean[k] = v;
    const { error } = await admin.from("ai_settings").upsert(clean as any, { onConflict: "id" });
    if (error) throw error;
  },
};
