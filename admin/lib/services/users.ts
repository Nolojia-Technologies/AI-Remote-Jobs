import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/db";

/** A learner enriched with derived activity (from admin_user_overview). */
export interface UserOverview {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  level: number | null;
  xp: number | null;
  is_admin: boolean | null;
  created_at: string;
  last_seen: string | null;
}

export type ActivityFilter = "all" | "live" | "active" | "inactive";

// Windows that define the activity buckets.
export const LIVE_WINDOW_MS = 15 * 60 * 1000; // "live now" = active in last 15 min
export const ACTIVE_WINDOW_DAYS = 7; // "active" = active in last 7 days

export interface ActivityStats {
  total: number;
  live: number;
  active: number;
  new7d: number;
}

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

  /**
   * Learners enriched with last_seen, filtered by activity bucket. Reads the
   * admin_user_overview view (migration 020) via the service role.
   */
  async listOverview(opts: { search?: string; filter?: ActivityFilter; limit?: number } = {}): Promise<UserOverview[]> {
    const admin = createAdminClient();
    const now = Date.now();
    const liveIso = new Date(now - LIVE_WINDOW_MS).toISOString();
    const activeIso = new Date(now - ACTIVE_WINDOW_DAYS * 86400000).toISOString();

    let q = admin.from("admin_user_overview").select("*").limit(opts.limit ?? 200);
    if (opts.filter === "live") q = q.gte("last_seen", liveIso);
    else if (opts.filter === "active") q = q.gte("last_seen", activeIso);
    else if (opts.filter === "inactive") q = q.or(`last_seen.is.null,last_seen.lt.${activeIso}`);
    if (opts.search?.trim()) {
      const s = opts.search.trim();
      q = q.or(`email.ilike.%${s}%,full_name.ilike.%${s}%`);
    }
    q = q.order("last_seen", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as UserOverview[];
  },

  /** Headline activity counts for the stat tiles. */
  async activityStats(): Promise<ActivityStats> {
    const admin = createAdminClient();
    const now = Date.now();
    const liveIso = new Date(now - LIVE_WINDOW_MS).toISOString();
    const activeIso = new Date(now - ACTIVE_WINDOW_DAYS * 86400000).toISOString();

    const [total, live, active, newc] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("admin_user_overview").select("id", { count: "exact", head: true }).gte("last_seen", liveIso),
      admin.from("admin_user_overview").select("id", { count: "exact", head: true }).gte("last_seen", activeIso),
      admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", activeIso),
    ]);
    return {
      total: total.count ?? 0,
      live: live.count ?? 0,
      active: active.count ?? 0,
      new7d: newc.count ?? 0,
    };
  },
};
