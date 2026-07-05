"use client";

import { useEffect } from "react";

/**
 * App-level error boundary. Catches server/client render errors (including the
 * dashboard layout's Supabase calls) and shows an actionable message instead of
 * Next's raw "Application error" screen. In production Next redacts the real
 * message, so we point at the most common cause — missing env vars — and surface
 * the digest to correlate with the Vercel logs.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The admin portal hit a server error. If you just deployed, this is almost always a{" "}
          <strong>missing environment variable</strong> — confirm{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> are set in Vercel (Settings → Environment Variables),
          then redeploy.
        </p>
        {error.digest && <p className="mt-3 text-xs text-muted-foreground">Error ID: {error.digest}</p>}
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
