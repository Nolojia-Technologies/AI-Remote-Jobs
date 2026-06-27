// Supabase Edge Function: pdf-proxy
// Streams a native PDF lesson's bytes to an AUTHENTICATED learner without ever
// exposing the storage bucket/path or a public URL. Deploy with:
//   supabase functions deploy pdf-proxy --no-verify-jwt
// (--no-verify-jwt lets the WebView's CORS preflight through; this function does
//  its own auth via auth.getUser below, so access is still gated.)
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected.)
//
// App usage: GET <fn-url>?lessonId=<uuid>  with header  Authorization: Bearer <user access token>
//
// Runs on Deno (Supabase Edge), NOT in the React Native bundle.
// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const lessonId = new URL(req.url).searchParams.get("lessonId");
    if (!lessonId) return new Response("Missing lessonId", { status: 400, headers: cors });

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: cors });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Verify the caller is a real, logged-in user.
    const authClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await authClient.auth.getUser();
    if (!userData?.user) return new Response("Unauthorized", { status: 401, headers: cors });

    // Resolve the private path + gate with the service role (bypasses RLS).
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: lesson } = await admin
      .from("cms_lessons")
      .select("pdf_path,status,lesson_type")
      .eq("id", lessonId)
      .maybeSingle();

    if (!lesson || lesson.lesson_type !== "pdf" || !lesson.pdf_path)
      return new Response("Not found", { status: 404, headers: cors });
    if (lesson.status !== "published")
      return new Response("Lesson not available", { status: 403, headers: cors });

    const { data: file, error } = await admin.storage.from("lesson-pdfs").download(lesson.pdf_path);
    if (error || !file) return new Response("Not found", { status: 404, headers: cors });

    return new Response(await file.arrayBuffer(), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    return new Response("Error: " + (e?.message ?? e), { status: 500, headers: cors });
  }
});
