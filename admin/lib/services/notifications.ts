import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";

export type NotificationAudience =
  | { kind: "all" }
  | { kind: "level"; min?: number; max?: number }
  | { kind: "country"; country: string }
  | { kind: "streak"; min: number }
  | { kind: "xp"; min: number };

export interface NotificationInput {
  title: string;
  body: string;
  template?: string;
  audience: NotificationAudience;
  deep_link?: string | null;
}

/**
 * Persists an admin-composed notification to `notifications_cms`. Actual fan-out
 * to devices (Expo push / scheduled job) is a follow-up — this records intent +
 * targeting so the campaign exists and can be dispatched by a worker.
 */
export const notificationsService = {
  async list(limit = 50) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications_cms")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async create(input: NotificationInput, adminEmail: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications_cms")
      .insert({
        title: input.title,
        body: input.body,
        template: input.template ?? null,
        audience: input.audience as any,
        deep_link: input.deep_link ?? null,
        status: "queued",
      } as any)
      .select("*")
      .single();
    if (error) throw error;
    await logActivity({ email: adminEmail, action: "create", entity: "notification", entityId: data.id, detail: input.title });
    return data;
  },
};
