// Supabase Edge Function: ai-generate
// Holds the LLM provider key server-side. The app POSTs { provider, system, prompt }
// and gets back { text }. Deploy with:
//   supabase functions deploy ai-generate
//   supabase secrets set OPENAI_API_KEY=... ANTHROPIC_API_KEY=... GEMINI_API_KEY=...
// Then set EXPO_PUBLIC_AI_ENDPOINT to the function URL and EXPO_PUBLIC_AI_PROVIDER.
//
// NOTE: This file runs on Deno (Supabase Edge), NOT in the React Native bundle.

// @ts-nocheck
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

async function openai(system: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function claude(system: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "", "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 4096, system, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function gemini(system: string, prompt: string): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ parts: [{ text: prompt }] }] }),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const { provider = "openai", system = "", prompt = "" } = await req.json();
    let text = "";
    if (provider === "openai") text = await openai(system, prompt);
    else if (provider === "claude") text = await claude(system, prompt);
    else if (provider === "gemini") text = await gemini(system, prompt);
    else return json({ error: `unknown provider: ${provider}` }, 400);
    return json({ text });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
