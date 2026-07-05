"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, MoreHorizontal, Eye, EyeOff, Copy, Trash2, Pencil, Loader2,
  Sparkles, Upload, PlayCircle, CheckCircle2, Clock, ShieldCheck, ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CERT_QUESTION_TYPE_LABELS, CERT_QUESTION_STATUS_LABELS, CERT_QUIZ_STATUS_LABELS,
} from "@/types/db";
import type {
  CertificationQuiz, CertificationQuestion, CertificationQuestionInput,
  CertQuestionType, CertQuestionStatus, CertQuizStatus,
} from "@/types/db";
import type { BankStats } from "@/lib/services/certification";
import {
  createQuizAction, updateQuizAction, setQuizStatusAction, duplicateQuizAction, deleteQuizAction,
  createQuestionAction, updateQuestionAction, deleteQuestionAction, approveQuestionAction,
  setQuestionStatusAction, bulkImportAction, previewAttemptAction,
} from "../actions";

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert", "master"] as const;
const STATUS_BADGE: Record<CertQuestionStatus, "success" | "muted" | "warning"> = {
  published: "success", draft: "muted", archived: "warning",
};

export function CertificationClient({
  quiz, questions, stats, categories, query, status, category,
}: {
  quiz: CertificationQuiz | null;
  questions: CertificationQuestion[];
  stats: BankStats | null;
  categories: string[];
  query: string;
  status: CertQuestionStatus | "all";
  category: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!quiz) {
    return (
      <Card className="p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h3 className="text-lg font-semibold">No certification yet</h3>
        <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground">
          Create the Job Readiness Certification, build its question bank, then publish it. Passing it is what unlocks job applications for learners.
        </p>
        <Button
          disabled={pending}
          onClick={() => startTransition(async () => { await createQuizAction({ title: "Job Readiness Certification" }); router.refresh(); })}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create certification
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StatsRow quiz={quiz} stats={stats} />
      <QuizConfigCard quiz={quiz} />
      <AiGeneratePanel quizId={quiz.id} />
      <QuestionBank
        quiz={quiz} questions={questions} categories={categories}
        query={query} status={status} category={category}
      />
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatsRow({ quiz, stats }: { quiz: CertificationQuiz; stats: BankStats | null }) {
  const tiles = [
    { label: "Bank size", value: stats?.total ?? 0, icon: ListChecks },
    { label: "Published (live pool)", value: stats?.published ?? 0, icon: CheckCircle2 },
    { label: "Awaiting review", value: stats?.aiPending ?? 0, icon: Sparkles },
    { label: "Per attempt", value: Math.min(quiz.questions_per_attempt, stats?.published ?? 0), icon: PlayCircle },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <t.icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none">{t.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t.label}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Quiz config + lifecycle ────────────────────────────────────────────────
function QuizConfigCard({ quiz }: { quiz: CertificationQuiz }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{ prompt: string; type: string; options: string[]; topic: string }[] | null>(null);
  const [f, setF] = useState({
    title: quiz.title,
    description: quiz.description ?? "",
    time_limit_minutes: quiz.time_limit_minutes,
    questions_per_attempt: quiz.questions_per_attempt,
    passing_score: quiz.passing_score,
    retake_cooldown_minutes: quiz.retake_cooldown_minutes,
    retake_ads_required: quiz.retake_ads_required,
    unlock_ads_required: quiz.unlock_ads_required,
    randomize_questions: quiz.randomize_questions,
    randomize_answers: quiz.randomize_answers,
    scheduled_at: quiz.scheduled_at ?? "",
  });
  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) { setF((s) => ({ ...s, [k]: v })); }
  function run(fn: () => Promise<unknown>) { startTransition(async () => { await fn(); router.refresh(); }); }

  const statusBadge: Record<CertQuizStatus, "success" | "muted" | "warning"> = {
    published: "success", draft: "muted", scheduled: "warning", archived: "warning",
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Certification config</h3>
          <Badge variant={statusBadge[quiz.status]}>{CERT_QUIZ_STATUS_LABELS[quiz.status]}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={async () => setPreview(await previewAttemptAction(quiz.id))}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          {quiz.status !== "published" ? (
            <Button variant="outline" size="sm" onClick={() => run(() => setQuizStatusAction(quiz.id, "published"))}>
              <Eye className="h-4 w-4" /> Publish
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => run(() => setQuizStatusAction(quiz.id, "archived"))}>
              <EyeOff className="h-4 w-4" /> Archive
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => run(() => duplicateQuizAction(quiz.id))}>
            <Copy className="h-4 w-4" /> Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={() => { if (confirm("Delete this certification and its bank?")) run(() => deleteQuizAction(quiz.id)); }}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2"><Label>Title</Label><Input value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div className="space-y-1.5 md:col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} className="min-h-[60px]" /></div>
        <NumberField label="Time limit (min)" value={f.time_limit_minutes} onChange={(v) => set("time_limit_minutes", v)} />
        <NumberField label="Questions per attempt" value={f.questions_per_attempt} onChange={(v) => set("questions_per_attempt", v)} />
        <NumberField label="Passing score (%)" value={f.passing_score} onChange={(v) => set("passing_score", v)} />
        <NumberField label="Retake cooldown (min)" value={f.retake_cooldown_minutes} onChange={(v) => set("retake_cooldown_minutes", v)} />
        <NumberField label="Retake ads to bypass" value={f.retake_ads_required} onChange={(v) => set("retake_ads_required", v)} />
        <NumberField label="Unlock ads (first attempt)" value={f.unlock_ads_required} onChange={(v) => set("unlock_ads_required", v)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.randomize_questions} onChange={(e) => set("randomize_questions", e.target.checked)} /> Randomize question selection</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.randomize_answers} onChange={(e) => set("randomize_answers", e.target.checked)} /> Randomize answer order</label>
        <div className="space-y-1.5">
          <Label>Schedule publish (optional)</Label>
          <Input type="datetime-local" value={f.scheduled_at ? f.scheduled_at.slice(0, 16) : ""} onChange={(e) => set("scheduled_at", e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          disabled={pending}
          onClick={() => run(() => updateQuizAction(quiz.id, {
            title: f.title, description: f.description,
            time_limit_minutes: Number(f.time_limit_minutes) || 45,
            questions_per_attempt: Number(f.questions_per_attempt) || 40,
            passing_score: Number(f.passing_score) || 80,
            retake_cooldown_minutes: Number(f.retake_cooldown_minutes) || 120,
            retake_ads_required: Number(f.retake_ads_required) || 5,
            unlock_ads_required: Number(f.unlock_ads_required) || 1,
            randomize_questions: f.randomize_questions,
            randomize_answers: f.randomize_answers,
            scheduled_at: f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null,
          }))}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save config
        </Button>
      </div>

      {preview && (
        <Dialog open onClose={() => setPreview(null)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attempt preview</DialogTitle>
            <DialogDescription>A random sample as a learner would see it — no answers shown.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            {preview.length === 0 && <p className="text-sm text-muted-foreground">No published questions yet — publish some to preview.</p>}
            {preview.map((p, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="muted">{i + 1}</Badge>
                  <span className="text-xs text-muted-foreground">{p.topic}</span>
                </div>
                <p className="mb-2 text-sm font-medium">{p.prompt}</p>
                <ul className="space-y-1">
                  {p.options.map((o, j) => <li key={j} className="rounded border px-2 py-1 text-sm">{o}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPreview(null)}>Close</Button></DialogFooter>
        </Dialog>
      )}
    </Card>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

// ─── AI generation ──────────────────────────────────────────────────────────
function AiGeneratePanel({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [count, setCount] = useState(15);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function generate() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/ai/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, count, category: category || "general" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setMsg(`Generated ${data.count} question(s) — review and approve them below.`);
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">Generate questions with AI</h3>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Category / focus</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Prompt Engineering" className="w-56" />
        </div>
        <div className="space-y-1.5">
          <Label>Count</Label>
          <Input type="number" value={count} onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))} className="w-24" />
        </div>
        <Button onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        AI questions land as <strong>draft / awaiting review</strong>. Approve them below to add them to the live pool.
      </p>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}

// ─── Question bank ──────────────────────────────────────────────────────────
function QuestionBank({
  quiz, questions, categories, query, status, category,
}: {
  quiz: CertificationQuiz;
  questions: CertificationQuestion[];
  categories: string[];
  query: string;
  status: CertQuestionStatus | "all";
  category: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CertificationQuestion | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  function applyFilters(next: { q?: string; status?: string; category?: string }) {
    const params = new URLSearchParams();
    const merged = { q, status, category, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.status && merged.status !== "all") params.set("status", merged.status);
    if (merged.category) params.set("category", merged.category);
    router.push(`/certification?${params.toString()}`);
  }
  function run(fn: () => Promise<unknown>) {
    setMenuFor(null);
    startTransition(async () => { await fn(); router.refresh(); });
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <h3 className="mr-auto text-base font-semibold">Question bank</h3>
        <Button variant="outline" size="sm" onClick={() => setImporting(true)}><Upload className="h-4 w-4" /> Import</Button>
        <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New question</Button>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <form onSubmit={(e) => { e.preventDefault(); applyFilters({ q }); }} className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompt…" className="pl-8" />
        </form>
        <Select value={status} onChange={(e) => applyFilters({ status: e.target.value })} className="sm:w-40">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
        <Select value={category} onChange={(e) => applyFilters({ category: e.target.value })} className="sm:w-48">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead className="hidden lg:table-cell">Category / topic</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.length === 0 && (
            <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No questions match.</TableCell></TableRow>
          )}
          {questions.map((qq) => (
            <TableRow key={qq.id}>
              <TableCell className="max-w-md">
                <button className="line-clamp-2 text-left font-medium hover:underline" onClick={() => setEditing(qq)}>{qq.prompt}</button>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">{CERT_QUESTION_TYPE_LABELS[qq.type]}</TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">{qq.course_category}{qq.topic ? ` · ${qq.topic}` : ""}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge variant={STATUS_BADGE[qq.status]}>{CERT_QUESTION_STATUS_LABELS[qq.status]}</Badge>
                  {!qq.ai_reviewed && (qq.source === "ai" || qq.source === "import") && <Badge variant="warning">Review</Badge>}
                </div>
              </TableCell>
              <TableCell className="relative">
                <Button variant="ghost" size="icon" onClick={() => setMenuFor(menuFor === qq.id ? null : qq.id)}><MoreHorizontal className="h-4 w-4" /></Button>
                {menuFor === qq.id && (
                  <div className="absolute right-2 top-10 z-20 w-44 rounded-md border bg-card p-1 shadow-md">
                    <MenuItem icon={Pencil} label="Edit" onClick={() => { setMenuFor(null); setEditing(qq); }} />
                    {!qq.ai_reviewed && <MenuItem icon={CheckCircle2} label="Approve & publish" onClick={() => run(() => approveQuestionAction(qq.id))} />}
                    {qq.status !== "published"
                      ? <MenuItem icon={Eye} label="Publish" onClick={() => run(() => setQuestionStatusAction(qq.id, "published"))} />
                      : <MenuItem icon={EyeOff} label="Unpublish" onClick={() => run(() => setQuestionStatusAction(qq.id, "draft"))} />}
                    <MenuItem icon={Trash2} label="Delete" destructive onClick={() => { if (confirm("Delete this question?")) run(() => deleteQuestionAction(qq.id)); }} />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pending && <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Working…</p>}

      {(creating || editing) && (
        <QuestionDialog quizId={quiz.id} question={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
      {importing && <ImportDialog quizId={quiz.id} onClose={() => setImporting(false)} />}
    </Card>
  );
}

function MenuItem({ icon: Icon, label, onClick, destructive }: { icon: any; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent ${destructive ? "text-destructive" : ""}`} onClick={onClick}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

// ─── Question editor ────────────────────────────────────────────────────────
function QuestionDialog({ quizId, question, onClose }: { quizId: string; question: CertificationQuestion | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    type: (question?.type ?? "multiple_choice") as CertQuestionType,
    prompt: question?.prompt ?? "",
    options: question?.options?.length ? question.options : ["", "", "", ""],
    correct_answer: question?.correct_answer ?? "",
    explanation: question?.explanation ?? "",
    difficulty: question?.difficulty ?? "intermediate",
    course_category: question?.course_category ?? "general",
    topic: question?.topic ?? "",
    tags: (question?.tags ?? []).join(", "),
    estimated_seconds: question?.estimated_seconds ?? 60,
    weight: question?.weight ?? 1,
    status: (question?.status ?? "draft") as CertQuestionStatus,
  });
  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) { setF((s) => ({ ...s, [k]: v })); }

  const options = f.type === "true_false" ? ["True", "False"] : f.options;

  function setType(t: CertQuestionType) {
    if (t === "true_false") setF((s) => ({ ...s, type: t, options: ["True", "False"], correct_answer: "True" }));
    else setF((s) => ({ ...s, type: t, options: s.options.length ? s.options : ["", "", "", ""] }));
  }
  function setOption(i: number, v: string) {
    setF((s) => ({ ...s, options: s.options.map((o, j) => (j === i ? v : o)) }));
  }

  function save() {
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!f.prompt.trim() || opts.length < 2 || !f.correct_answer || !opts.includes(f.correct_answer)) {
      alert("Add a prompt, at least 2 options, and pick a correct answer that matches one option.");
      return;
    }
    const payload: CertificationQuestionInput = {
      quiz_id: quizId,
      type: f.type,
      prompt: f.prompt.trim(),
      options: opts,
      correct_answer: f.correct_answer,
      explanation: f.explanation,
      difficulty: f.difficulty as any,
      course_category: f.course_category || "general",
      topic: f.topic,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      estimated_seconds: Number(f.estimated_seconds) || 60,
      weight: Number(f.weight) || 1,
      status: f.status,
    };
    startTransition(async () => {
      if (question) await updateQuestionAction(question.id, payload);
      else await createQuestionAction(payload);
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onClose={onClose} className="max-w-2xl">
      <DialogHeader><DialogTitle>{question ? "Edit question" : "New question"}</DialogTitle></DialogHeader>
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={f.type} onChange={(e) => setType(e.target.value as CertQuestionType)}>
              {(["multiple_choice", "true_false", "scenario"] as CertQuestionType[]).map((t) => <option key={t} value={t}>{CERT_QUESTION_TYPE_LABELS[t]}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <Select value={f.difficulty} onChange={(e) => set("difficulty", e.target.value as any)}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Prompt</Label><Textarea value={f.prompt} onChange={(e) => set("prompt", e.target.value)} className="min-h-[70px]" /></div>

        <div className="space-y-1.5">
          <Label>Options (select the correct one)</Label>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={f.correct_answer === o && o !== ""} onChange={() => set("correct_answer", o)} />
              {f.type === "true_false"
                ? <Input value={o} disabled />
                : <Input value={o} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />}
            </div>
          ))}
          {f.type !== "true_false" && (
            <Button variant="outline" size="sm" onClick={() => set("options", [...f.options, ""])}><Plus className="h-4 w-4" /> Add option</Button>
          )}
        </div>

        <div className="space-y-1.5"><Label>Explanation</Label><Textarea value={f.explanation} onChange={(e) => set("explanation", e.target.value)} className="min-h-[50px]" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Category</Label><Input value={f.course_category} onChange={(e) => set("course_category", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Topic</Label><Input value={f.topic} onChange={(e) => set("topic", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Est. seconds" value={f.estimated_seconds} onChange={(v) => set("estimated_seconds", v)} />
          <NumberField label="Weight" value={f.weight} onChange={(v) => set("weight", v)} />
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={f.status} onChange={(e) => set("status", e.target.value as CertQuestionStatus)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Tags (comma separated)</Label><Input value={f.tags} onChange={(e) => set("tags", e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}{question ? "Save" : "Create"}</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ─── Bulk import ────────────────────────────────────────────────────────────
function ImportDialog({ quizId, onClose }: { quizId: string; onClose: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function doImport() {
    setError(null);
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { setError("Invalid JSON."); return; }
    const arr = Array.isArray(parsed) ? parsed : parsed.questions;
    if (!Array.isArray(arr)) { setError('Expected a JSON array (or { "questions": [...] }).'); return; }
    const rows = arr.map((r: any) => ({
      type: (["multiple_choice", "true_false", "scenario"].includes(r.type) ? r.type : "multiple_choice") as CertQuestionType,
      prompt: String(r.prompt ?? ""),
      options: Array.isArray(r.options) ? r.options.map(String) : [],
      correct_answer: String(r.correct_answer ?? r.answer ?? ""),
      explanation: String(r.explanation ?? ""),
      difficulty: r.difficulty ?? "intermediate",
      course_category: r.course_category ?? r.category ?? "general",
      topic: r.topic ?? "",
      tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
      estimated_seconds: Number(r.estimated_seconds) || 60,
      weight: Number(r.weight) || 1,
      status: "draft" as CertQuestionStatus,
      source: "import" as const,
      ai_reviewed: false,
    })).filter((r) => r.prompt && r.correct_answer && r.options.length >= 2);
    if (rows.length === 0) { setError("No valid questions found (need prompt, options, correct_answer)."); return; }
    startTransition(async () => { await bulkImportAction(quizId, rows); onClose(); router.refresh(); });
  }

  return (
    <Dialog open onClose={onClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Import questions</DialogTitle>
        <DialogDescription>Paste a JSON array. Each: type, prompt, options[], correct_answer (or answer), explanation, difficulty, category, topic, tags[]. Imported as draft for review.</DialogDescription>
      </DialogHeader>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[240px] font-mono text-xs" placeholder='[{"type":"multiple_choice","prompt":"…","options":["A","B","C","D"],"correct_answer":"A","explanation":"…","category":"AI","topic":"Basics"}]' />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={doImport} disabled={pending || !text.trim()}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Import</Button>
      </DialogFooter>
    </Dialog>
  );
}
