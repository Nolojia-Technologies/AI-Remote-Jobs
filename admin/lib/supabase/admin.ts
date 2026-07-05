import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { serviceRoleEnv } from "@/lib/env";

/**
 * SERVER-ONLY service-role client. Bypasses RLS — use ONLY in route handlers /
 * server actions AFTER confirming the caller is an admin (see lib/auth.ts).
 * Never import this into a Client Component.
 */
export function createAdminClient() {
  const { url, serviceRoleKey } = serviceRoleEnv();
  return createSupabaseClient<Database>(
    url,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
