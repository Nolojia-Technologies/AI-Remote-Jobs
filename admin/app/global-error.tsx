"use client";

/**
 * Root error boundary — catches errors thrown by the ROOT layout itself (which
 * app/error.tsx cannot). It replaces the whole document, so it must render its
 * own <html>/<body> and can't rely on globals.css (inline styles only).
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#f9fafb",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, background: "#fff" }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Admin portal error</h1>
          <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>
            A server error occurred. If you just deployed to Vercel, check that the Supabase
            environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY) are set, then redeploy.
          </p>
          {error.digest && <p style={{ marginTop: 12, color: "#9ca3af", fontSize: 12 }}>Error ID: {error.digest}</p>}
          <button
            onClick={reset}
            style={{ marginTop: 16, background: "#2563eb", color: "#fff", border: 0, borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
