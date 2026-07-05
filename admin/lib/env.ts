import "server-only";

/**
 * Read + validate the public Supabase env (URL + anon key). Throws a clear,
 * actionable error naming the exact missing variable(s) — so a misconfigured
 * Vercel deployment surfaces a useful message in the logs instead of a cryptic
 * "supabaseUrl is required".
 */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean) as string[];
  if (missing.length) throw missingEnvError(missing);
  return { url: url!, anonKey: anonKey! };
}

/** Service-role key + URL for the privileged (RLS-bypassing) admin client. */
export function serviceRoleEnv(): { url: string; serviceRoleKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean) as string[];
  if (missing.length) throw missingEnvError(missing);
  return { url: url!, serviceRoleKey: serviceRoleKey! };
}

function missingEnvError(missing: string[]): Error {
  return new Error(
    `Missing environment variable(s): ${missing.join(", ")}. ` +
      "Set them in your Vercel project (Settings → Environment Variables) and redeploy."
  );
}
