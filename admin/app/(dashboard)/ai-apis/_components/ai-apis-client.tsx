"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Bot, Check, Loader2, KeyRound, CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { saveAiSettings, testAiProvider, clearAiKey, type AiStatus } from "../actions";

type Provider = "openai" | "anthropic";
type TestResult = { ok: boolean; provider: string; model: string; error?: string };

function KeyBadge({ state, last4 }: { state: "saved" | "env" | "none"; last4: string }) {
  if (state === "saved") return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> Key saved ••{last4}</Badge>;
  if (state === "env") return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-amber-600" /> Using env var</Badge>;
  return <Badge variant="outline" className="gap-1 text-muted-foreground"><XCircle className="h-3 w-3" /> No key</Badge>;
}

export function AiApisClient({ status }: { status: AiStatus }) {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>(status.provider);
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState(status.openai.model);
  const [openaiImageModel, setOpenaiImageModel] = useState(status.openai.imageModel);
  const [anthropicModel, setAnthropicModel] = useState(status.anthropic.model);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);

  async function save(thenTest = false) {
    setBusy(thenTest ? "savetest" : "save");
    setError(null);
    setSaved(false);
    setTest(null);
    try {
      await saveAiSettings({ provider, openaiModel, openaiImageModel, anthropicModel, openaiApiKey: openaiKey, anthropicApiKey: anthropicKey });
      setSaved(true);
      setOpenaiKey("");
      setAnthropicKey("");
      router.refresh();
      if (thenTest) setTest(await testAiProvider());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function runTest() {
    setBusy("test");
    setError(null);
    setTest(null);
    try {
      setTest(await testAiProvider());
    } finally {
      setBusy(null);
    }
  }

  async function clearKey(which: Provider) {
    setBusy("clear:" + which);
    try {
      await clearAiKey(which);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const keyPlaceholder = (s: { state: "saved" | "env" | "none"; last4: string }, hint: string) =>
    s.state === "saved" ? `Saved ••${s.last4} — type a new key to replace` : s.state === "env" ? "Set via env — type a key to override" : hint;

  return (
    <div className="space-y-6">
      {/* Provider selector */}
      <Card>
        <CardHeader><CardTitle className="text-base">Active provider</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <ProviderBtn active={provider === "openai"} onClick={() => setProvider("openai")} icon={<Sparkles className="h-4 w-4" />} title="OpenAI (GPT)" desc="Text generation + thumbnails (images)" />
            <ProviderBtn active={provider === "anthropic"} onClick={() => setProvider("anthropic")} icon={<Bot className="h-4 w-4" />} title="Anthropic (Claude)" desc="Text generation (images use OpenAI)" />
          </div>
          {provider === "anthropic" && status.openai.key.state === "none" && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Claude generates lesson/quiz text, but course <span className="font-semibold">thumbnails are image generation (OpenAI only)</span>. Add an OpenAI key too if you want AI thumbnails.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OpenAI */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" /> OpenAI</CardTitle>
          <KeyBadge state={status.openai.key.state} last4={status.openai.key.last4} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> API key</Label>
            <Input type="password" autoComplete="off" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder={keyPlaceholder(status.openai.key, "sk-...")} />
            {status.openai.key.state === "saved" && (
              <button type="button" onClick={() => clearKey("openai")} disabled={!!busy} className="text-xs text-destructive hover:underline">
                {busy === "clear:openai" ? "Clearing…" : "Clear saved key"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label>Text model</Label>
              <Input value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)} placeholder={status.openai.effectiveModel} className="w-52" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Image model (thumbnails)</Label>
              <Input value={openaiImageModel} onChange={(e) => setOpenaiImageModel(e.target.value)} placeholder={status.openai.effectiveImageModel} className="w-52" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anthropic */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4" /> Anthropic (Claude)</CardTitle>
          <KeyBadge state={status.anthropic.key.state} last4={status.anthropic.key.last4} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> API key</Label>
            <Input type="password" autoComplete="off" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} placeholder={keyPlaceholder(status.anthropic.key, "sk-ant-...")} />
            {status.anthropic.key.state === "saved" && (
              <button type="button" onClick={() => clearKey("anthropic")} disabled={!!busy} className="text-xs text-destructive hover:underline">
                {busy === "clear:anthropic" ? "Clearing…" : "Clear saved key"}
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Text model</Label>
            <Input value={anthropicModel} onChange={(e) => setAnthropicModel(e.target.value)} placeholder={status.anthropic.effectiveModel} className="w-52" />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {test && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${test.ok ? "border-green-300 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
          {test.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {test.ok ? `Connected — ${test.provider} · ${test.model} is responding.` : `Test failed (${test.provider} · ${test.model}): ${test.error}`}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={() => save(true)} disabled={!!busy}>
          {busy === "savetest" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save & test
        </Button>
        <Button variant="outline" onClick={() => save(false)} disabled={!!busy}>
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save only
        </Button>
        <Button variant="ghost" onClick={runTest} disabled={!!busy}>
          {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Test connection
        </Button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>

      <p className="text-xs text-muted-foreground">
        Keys are stored server-side only (service-role table) and never sent to the mobile app or the browser. The active provider above is what all AI generation (course structure, lessons, quizzes, PDF restructuring) uses.
      </p>
    </div>
  );
}

function ProviderBtn({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex-1 rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-primary/10" : "hover:bg-accent"}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">{icon} {title}{active && <Check className="ml-auto h-4 w-4 text-primary" />}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
