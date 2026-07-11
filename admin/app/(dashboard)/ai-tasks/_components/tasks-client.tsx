"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, MoreHorizontal, Eye, EyeOff, Copy, Trash2, Pencil, Loader2,
  Upload, Wand2, PauseCircle, Sparkles, ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AiTaskInput, AiTaskKind, AiTaskRow, AiTaskStatus } from "@/lib/services/aiTasks";
import {
  createAiTaskAction, updateAiTaskAction, setAiTaskStatusAction, duplicateAiTaskAction,
  deleteAiTaskAction, bulkImportAiTasksAction, getAiTaskAnswerAction,
} from "../actions";

const KINDS: AiTaskKind[] = ["microtask", "captcha", "annotation", "survey"];
const KIND_EMOJI: Record<AiTaskKind, string> = {
  microtask: "🤖", captcha: "🧩", annotation: "🏷️", survey: "📋",
};
const STATUS_BADGE: Record<AiTaskStatus, "success" | "muted" | "warning"> = {
  published: "success", draft: "muted", paused: "warning", archived: "warning",
};

const TASK_IMPORT_PROMPT = `You are generating earning micro-tasks for the "AI Tasks" hub of the AI Remote Jobs app. Output ONLY a valid JSON array — no markdown. Each item:

[
  {
    "kind": "microtask",
    "category": "sentiment_analysis",
    "title": "Rate this review's sentiment",
    "description": "Read the review and pick its sentiment.",
    "difficulty": "easy",
    "reward_cents": 2,
    "xp": 3,
    "est_seconds": 20,
    "question": "\\"Great app but too many ads.\\" — What is the sentiment?",
    "options": ["Positive", "Negative", "Mixed", "Neutral"],
    "correct_option": 2,
    "survey_questions": null,
    "min_task_level": 1
  }
]

Rules:
- kind: microtask | annotation | survey.
- microtask/annotation need question + 2–4 options + correct_option (0-based, objectively correct).
- survey: set correct_option null and provide survey_questions: [{ "q": "...", "options": [...] }] (3–6 questions).
- reward_cents 1–20, xp 2–10, est_seconds realistic.
- Questions must be self-contained and unambiguous.

Generate 20 tasks.`;

export function AiTasksClient({
  initialTasks, query, status, kind,
}: {
  initialTasks: AiTaskRow[];
  query: string;
  status: AiTaskStatus | "all";
  kind: AiTaskKind | "all";
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<AiTaskRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(TASK_IMPORT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the task-format prompt:", TASK_IMPORT_PROMPT);
    }
  }

  function applyFilters(next: { q?: string; status?: string; kind?: string }) {
    const params = new URLSearchParams();
    const merged = { q, status, kind, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.status && merged.status !== "all") params.set("status", merged.status);
    if (merged.kind && merged.kind !== "all") params.set("kind", merged.kind);
    router.push(`/ai-tasks?${params.toString()}`);
  }

  function run(fn: () => Promise<unknown>) {
    setMenuFor(null);
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <form onSubmit={(e) => { e.preventDefault(); applyFilters({ q }); }} className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or category…" className="pl-8" />
        </form>
        <Select value={kind} onChange={(e) => applyFilters({ kind: e.target.value })} className="lg:w-36">
          <option value="all">All kinds</option>
          {KINDS.map((k) => <option key={k} value={k}>{KIND_EMOJI[k]} {k}</option>)}
        </Select>
        <Select value={status} onChange={(e) => applyFilters({ status: e.target.value })} className="lg:w-36">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </Select>
        <Button variant="outline" onClick={() => setGenerating(true)}>
          <Wand2 className="h-4 w-4" /> Generate with AI
        </Button>
        <Button variant="outline" onClick={copyPrompt}>
          {copied ? <ClipboardCheck className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy AI prompt"}
        </Button>
        <Button variant="outline" onClick={() => setImporting(true)}>
          <Upload className="h-4 w-4" /> Import
        </Button>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Kind</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Reward</TableHead>
              <TableHead className="hidden lg:table-cell">Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No tasks found. Generate some with AI or create one manually.
                </TableCell>
              </TableRow>
            )}
            {initialTasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <button className="font-medium hover:underline" onClick={() => setEditing(t)}>{t.title}</button>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{KIND_EMOJI[t.kind]} {t.kind}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{t.category}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  ${(t.reward_cents / 100).toFixed(2)} · {t.xp} XP
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">L{t.min_task_level}</TableCell>
                <TableCell><Badge variant={STATUS_BADGE[t.status] ?? "muted"}>{t.status}</Badge></TableCell>
                <TableCell className="relative">
                  <Button variant="ghost" size="icon" onClick={() => setMenuFor(menuFor === t.id ? null : t.id)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {menuFor === t.id && (
                    <div className="absolute right-2 top-10 z-20 w-44 rounded-md border bg-card p-1 shadow-md">
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => { setMenuFor(null); setEditing(t); }}>
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      {t.status !== "published" ? (
                        <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => setAiTaskStatusAction(t.id, "published"))}>
                          <Eye className="h-4 w-4" /> Publish
                        </button>
                      ) : (
                        <>
                          <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => setAiTaskStatusAction(t.id, "paused"))}>
                            <PauseCircle className="h-4 w-4" /> Pause
                          </button>
                          <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => setAiTaskStatusAction(t.id, "draft"))}>
                            <EyeOff className="h-4 w-4" /> Unpublish
                          </button>
                        </>
                      )}
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => duplicateAiTaskAction(t.id))}>
                        <Copy className="h-4 w-4" /> Duplicate
                      </button>
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => setAiTaskStatusAction(t.id, "archived"))}>
                        <EyeOff className="h-4 w-4" /> Archive
                      </button>
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-accent" onClick={() => { if (confirm(`Delete "${t.title}"?`)) run(() => deleteAiTaskAction(t.id)); }}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {pending && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Working…</p>}

      {(creating || editing) && (
        <TaskDialog task={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
      {importing && <ImportTasksDialog onClose={() => setImporting(false)} />}
      {generating && <GenerateTasksDialog onClose={() => setGenerating(false)} />}
    </div>
  );
}

function GenerateTasksDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [count, setCount] = useState(15);
  const [kind, setKind] = useState("mixed");
  const [focus, setFocus] = useState("");
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true); setError(null); setMsg(null);
    try {
      const res = await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, kind, focus: focus || undefined, publish }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setMsg(`Generated ${data.count} task(s)${publish ? " (published)" : " (as drafts)"}.`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} className="max-w-lg">
      <DialogHeader><DialogTitle>Generate AI tasks</DialogTitle></DialogHeader>
      <p className="mb-3 text-sm text-muted-foreground">
        Uses your configured AI provider (AI APIs page). Answer keys are stored server-side only.
      </p>
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>How many</Label>
            <Input type="number" value={count} onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))} />
          </div>
          <div className="space-y-1.5">
            <Label>Kind</Label>
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="mixed">Mixed</option>
              <option value="microtask">Micro tasks</option>
              <option value="annotation">Annotation</option>
              <option value="survey">Surveys</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Focus (optional)</Label>
            <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. sentiment" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Publish immediately (uncheck to create as drafts)
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {msg && <p className="mt-2 text-sm text-green-600">{msg}</p>}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{msg ? "Done" : "Cancel"}</Button>
        <Button onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function ImportTasksDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [publish, setPublish] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function doImport() {
    setError(null);
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { setError("Invalid JSON. Paste the array Claude returned."); return; }
    const arr = Array.isArray(parsed) ? parsed : parsed.tasks;
    if (!Array.isArray(arr)) { setError('Expected a JSON array (or { "tasks": [...] }).'); return; }

    const rows: AiTaskInput[] = arr
      .map((r: any) => {
        const isSurvey = r.kind === "survey";
        const options = Array.isArray(r.options) ? r.options.map(String) : [];
        const hasKey = !isSurvey && Number.isInteger(r.correct_option) && options.length >= 2;
        return {
          kind: (KINDS.includes(r.kind) ? r.kind : "microtask") as AiTaskKind,
          category: String(r.category ?? "text_classification"),
          title: String(r.title ?? "").trim(),
          description: String(r.description ?? ""),
          difficulty: (["easy", "medium", "hard"].includes(r.difficulty) ? r.difficulty : "easy") as "easy" | "medium" | "hard",
          reward_cents: Math.max(0, Math.min(500, Number(r.reward_cents) || 2)),
          xp: Math.max(0, Math.min(100, Number(r.xp) || 3)),
          est_seconds: Math.max(5, Number(r.est_seconds) || 20),
          content: isSurvey
            ? { questions: Array.isArray(r.survey_questions) ? r.survey_questions : [] }
            : { question: String(r.question ?? ""), options },
          min_task_level: Math.max(1, Math.min(7, Number(r.min_task_level) || 1)),
          status: (publish ? "published" : "draft") as AiTaskStatus,
          answer: hasKey ? { choice: Number(r.correct_option) } : null,
        };
      })
      .filter((r) => r.title);

    if (rows.length === 0) { setError("No valid tasks found (each needs at least a title)."); return; }
    startTransition(async () => {
      const count = await bulkImportAiTasksAction(rows);
      setResult(count);
      router.refresh();
    });
  }

  return (
    <Dialog open onClose={onClose} className="max-w-2xl">
      <DialogHeader><DialogTitle>Import AI tasks</DialogTitle></DialogHeader>
      <p className="mb-2 text-sm text-muted-foreground">
        Click <strong>Copy AI prompt</strong>, paste it into Claude, then paste the JSON it returns here.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[240px] font-mono text-xs"
        placeholder='[{"kind":"microtask","category":"sentiment_analysis","title":"…","question":"…","options":["A","B"],"correct_option":0}]'
      />
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        Publish immediately (uncheck to import as drafts)
      </label>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {result != null && <p className="mt-2 text-sm text-green-600">Imported {result} task(s).</p>}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{result != null ? "Done" : "Cancel"}</Button>
        <Button onClick={doImport} disabled={pending || !text.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Import
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function TaskDialog({ task, onClose }: { task: AiTaskRow | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isSurveyInit = task?.kind === "survey";
  const [form, setForm] = useState({
    kind: (task?.kind ?? "microtask") as AiTaskKind,
    category: task?.category ?? "text_classification",
    title: task?.title ?? "",
    description: task?.description ?? "",
    difficulty: (task?.difficulty ?? "easy") as "easy" | "medium" | "hard",
    reward_cents: task?.reward_cents ?? 2,
    xp: task?.xp ?? 3,
    est_seconds: task?.est_seconds ?? 20,
    min_task_level: task?.min_task_level ?? 1,
    repeatable: task?.repeatable ?? false,
    question: task?.content?.question ?? "",
    options: ((task?.content?.options ?? []) as string[]).join("\n"),
    correct_option: "" as string,
    survey_json: isSurveyInit ? JSON.stringify(task?.content?.questions ?? [], null, 2) : "",
    generator: task?.content?.generator ?? "text",
  });

  // Load the stored answer key when editing a task with options.
  useEffect(() => {
    if (task && task.kind !== "survey" && task.kind !== "captcha") {
      getAiTaskAnswerAction(task.id).then((a) => {
        if (a && Number.isInteger(a.choice)) {
          setForm((f) => ({ ...f, correct_option: String(a.choice) }));
        }
      });
    }
  }, [task?.id]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const isSurvey = form.kind === "survey";
  const isCaptcha = form.kind === "captcha";

  function save() {
    if (!form.title.trim()) return;
    const options = form.options.split("\n").map((s) => s.trim()).filter(Boolean);
    let content: Record<string, any> = {};
    let answer: Record<string, any> | null | undefined = undefined;
    if (isSurvey) {
      try { content = { questions: JSON.parse(form.survey_json || "[]") }; }
      catch { alert("Survey questions must be valid JSON."); return; }
      answer = null;
    } else if (isCaptcha) {
      content = { generator: form.generator };
      answer = null;
    } else {
      content = { question: form.question, options };
      const idx = Number(form.correct_option);
      answer = form.correct_option !== "" && Number.isInteger(idx) && idx >= 0 && idx < options.length
        ? { choice: idx }
        : null;
    }
    const payload: AiTaskInput = {
      kind: form.kind,
      category: form.category.trim() || "general",
      title: form.title.trim(),
      description: form.description,
      difficulty: form.difficulty,
      reward_cents: Math.max(0, Math.min(500, Number(form.reward_cents) || 0)),
      xp: Math.max(0, Math.min(100, Number(form.xp) || 0)),
      est_seconds: Math.max(5, Number(form.est_seconds) || 20),
      min_task_level: Math.max(1, Math.min(7, Number(form.min_task_level) || 1)),
      repeatable: isCaptcha ? true : form.repeatable,
      content,
      answer,
    };
    startTransition(async () => {
      if (task) await updateAiTaskAction(task.id, payload);
      else await createAiTaskAction(payload);
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onClose={onClose} className="max-w-2xl">
      <DialogHeader><DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Kind</Label>
            <Select value={form.kind} onChange={(e) => set("kind", e.target.value as AiTaskKind)}>
              {KINDS.map((k) => <option key={k} value={k}>{KIND_EMOJI[k]} {k}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. sentiment_analysis" /></div>
        </div>
        <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <Select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as any)}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Reward (¢)</Label><Input type="number" value={form.reward_cents} onChange={(e) => set("reward_cents", Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>XP</Label><Input type="number" value={form.xp} onChange={(e) => set("xp", Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Est. seconds</Label><Input type="number" value={form.est_seconds} onChange={(e) => set("est_seconds", Number(e.target.value))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Min task level (1–7)</Label>
            <Input type="number" min={1} max={7} value={form.min_task_level} onChange={(e) => set("min_task_level", Number(e.target.value))} />
          </div>
          {!isCaptcha && (
            <label className="mt-6 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.repeatable} onChange={(e) => set("repeatable", e.target.checked)} />
              Repeatable (can be completed daily)
            </label>
          )}
        </div>

        {isCaptcha && (
          <div className="space-y-1.5">
            <Label>Captcha generator</Label>
            <Select value={form.generator} onChange={(e) => set("generator", e.target.value)}>
              <option value="text">Text captcha</option>
              <option value="math">Math captcha</option>
              <option value="selection">Selection captcha</option>
              <option value="slider">Slider captcha</option>
            </Select>
            <p className="text-xs text-muted-foreground">Puzzles are generated on-device; the server enforces caps and rate limits.</p>
          </div>
        )}

        {isSurvey && (
          <div className="space-y-1.5">
            <Label>Survey questions (JSON)</Label>
            <Textarea
              value={form.survey_json}
              onChange={(e) => set("survey_json", e.target.value)}
              className="min-h-[160px] font-mono text-xs"
              placeholder='[{"q":"How often do you use AI?","options":["Daily","Weekly","Never"]}]'
            />
          </div>
        )}

        {!isSurvey && !isCaptcha && (
          <>
            <div className="space-y-1.5"><Label>Question</Label><Textarea value={form.question} onChange={(e) => set("question", e.target.value)} className="min-h-[70px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Options (one per line)</Label>
                <Textarea value={form.options} onChange={(e) => set("options", e.target.value)} className="min-h-[100px]" />
              </div>
              <div className="space-y-1.5">
                <Label>Correct option (0-based index)</Label>
                <Input type="number" value={form.correct_option} onChange={(e) => set("correct_option", e.target.value)} placeholder="e.g. 0" />
                <p className="text-xs text-muted-foreground">Stored server-side only. Leave empty for subjective tasks (auto-approved).</p>
              </div>
            </div>
          </>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={pending || !form.title.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {task ? "Save task" : "Create task"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
