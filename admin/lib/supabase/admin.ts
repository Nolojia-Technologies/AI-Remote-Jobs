import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

/**
 * SERVER-ONLY service-role client. Bypasses RLS — use ONLY in route handlers /
 * server actions AFTER confirming the caller is an admin (see lib/auth.ts).
 * Never import this into a Client Component.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for privileged admin operations."
    );
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
