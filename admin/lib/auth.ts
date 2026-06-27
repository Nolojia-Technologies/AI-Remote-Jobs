import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

/** The signed-in user, or null. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** True when the signed-in user is on the admin whitelist (admin_emails). */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  return data === true;
}

/**
 * Guard for route handlers / server actions. Throws 401-style errors when the
 * caller is not an authenticated admin. Returns the admin's email for auditing.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const user = await getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const ok = await isAdmin();
  if (!ok) throw new Error("FORBIDDEN");
  return { userId: user.id, email: user.email ?? "" };
}

/**
 * Append an entry to admin_activity. Best-effort — never throws, so it can't
 * break the operation it is auditing. Uses the service-role client so the write
 * always lands regardless of the table's RLS.
 */
export async function logActivity(input: {
  email: string;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("admin_activity").insert({
      admin_email: input.email,
      action: input.action,
      entity: input.entity ?? null,
      entity_id: input.entityId ?? null,
      detail: input.detail ?? null,
    } as any);
  } catch {
    // Auditing must never block the primary action.
  }
}
