import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminActivity } from "@/types/db";

export const activityService = {
  async recent(limit = 20): Promise<AdminActivity[]> {
    const admin = createAdminClient();
    try {
      const { data, error } = await admin
        .from("admin_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AdminActivity[];
    } catch {
      return [];
    }
  },
};
