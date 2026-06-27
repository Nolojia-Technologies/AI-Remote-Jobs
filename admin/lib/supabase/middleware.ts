import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/db";

/** Public routes that do NOT require an authenticated admin. */
const PUBLIC_PATHS = ["/login", "/auth"];

/**
 * Refreshes the Supabase session cookie AND enforces the admin whitelist on every
 * request. Unauthenticated users are sent to /login; authenticated-but-not-admin
 * users are signed out and redirected with ?denied=1.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If the Supabase env vars are missing (e.g. not configured in the Vercel
  // project), don't crash the Edge middleware with a 500 on every route. Log a
  // clear message and let the request through so the app can render its own UI.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[middleware] Missing Supabase env vars — set " +
        `${!supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL " : ""}` +
        `${!supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""}`.trim() +
        " in your Vercel project settings (Settings → Environment Variables)."
    );
    return response;
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Static assets / Next internals are excluded by the matcher in middleware.ts.
    if (isPublic) return response;

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Authenticated — enforce the admin whitelist via the shared is_admin() function.
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("denied", "1");
      return NextResponse.redirect(url);
    }

    return response;
  } catch (err) {
    // A transient auth/network error should not take the whole site down with a
    // 500 (MIDDLEWARE_INVOCATION_FAILED). Public routes render normally; guarded
    // routes fall back to the login page.
    console.error("[middleware] auth check failed:", err);
    if (isPublic) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}
