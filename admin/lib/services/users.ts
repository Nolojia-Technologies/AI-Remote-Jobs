import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/auth";
import type { Profile } from "@/types/db";

/** A learner enriched with derived activity + earnings (from admin_user_overview). */
export interface UserOverview {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  level: number | null;
  xp: number | null;
  is_admin: boolean | null;
  is_disabled: boolean | null;
  created_at: string;
  balance_cents: number;
  lifetime_cents: number;
  referral_cents: number;
  last_seen: string | null;
}

export type ActivityFilter = "all" | "live" | "active" | "inactive" | "disabled";
export type UserSort = "recent" | "earners";

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
  async listOverview(opts: { search?: string; filter?: ActivityFilter; sort?: UserSort; limit?: number } = {}): Promise<UserOverview[]> {
    const admin = createAdminClient();
    const now = Date.now();
    const liveIso = new Date(now - LIVE_WINDOW_MS).toISOString();
    const activeIso = new Date(now - ACTIVE_WINDOW_DAYS * 86400000).toISOString();

    let q = admin.from("admin_user_overview").select("*").limit(opts.limit ?? 200);
    if (opts.filter === "live") q = q.gte("last_seen", liveIso);
    else if (opts.filter === "active") q = q.gte("last_seen", activeIso);
    else if (opts.filter === "inactive") q = q.or(`last_seen.is.null,last_seen.lt.${activeIso}`);
    else if (opts.filter === "disabled") q = q.eq("is_disabled", true);
    if (opts.search?.trim()) {
      const s = opts.search.trim();
      q = q.or(`email.ilike.%${s}%,full_name.ilike.%${s}%`);
    }
    if (opts.sort === "earners") {
      q = q.order("lifetime_cents", { ascending: false }).order("balance_cents", { ascending: false });
    } else {
      q = q.order("last_seen", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as UserOverview[];
  },

  /**
   * Deactivate / reactivate a user. Sets a Supabase auth ban (blocks sign-in
   * and token refresh — existing sessions die within ~1h) AND flips
   * profiles.is_disabled so the dashboard can see it and the app can sign the
   * user out immediately on next profile fetch.
   */
  async setDisabled(userId: string, disabled: boolean, adminEmail: string): Promise<void> {
    const admin = createAdminClient();
    const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: disabled ? "87600h" : "none", // ~10 years / lift
    } as any);
    if (authErr) throw authErr;
    const { error: profErr } = await admin
      .from("profiles")
      .update({ is_disabled: disabled, updated_at: new Date().toISOString() } as any)
      .eq("id", userId);
    if (profErr) throw profErr;
    await logActivity({
      email: adminEmail,
      action: disabled ? "deactivate" : "reactivate",
      entity: "user",
      entityId: userId,
    });
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
