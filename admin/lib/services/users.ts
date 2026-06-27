import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/db";

/**
 * User reads use the service-role client so the dashboard can aggregate across
 * ALL users regardless of profiles RLS. Read-only — never expose to the client.
 */
export const usersService = {
  async list(opts: { search?: string; limit?: number } = {}): Promise<Profile[]> {
    const admin = createAdminClient();
    let q = admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.search?.trim()) q = q.or(`email.ilike.%${opts.search.trim()}%,full_name.ilike.%${opts.search.trim()}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Profile[];
  },

  async total(): Promise<number> {
    const admin = createAdminClient();
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true });
    return count ?? 0;
  },

  /** Distinct users active since `sinceISO` (from analytics_events). */
  async activeSince(sinceISO: string): Promise<number> {
    const admin = createAdminClient();
    const { data } = await admin.from("analytics_events").select("user_id").gte("created_at", sinceISO);
    const ids = new Set((data ?? []).map((r: any) => r.user_id).filter(Boolean));
    return ids.size;
  },
};
