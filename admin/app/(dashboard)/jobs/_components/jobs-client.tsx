"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MoreHorizontal, Eye, EyeOff, Copy, Trash2, Pencil, Loader2, Upload, ClipboardCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES } from "@/lib/constants";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/types/db";
import type { Job, JobInput, JobStatus, JobType } from "@/types/db";
import { createJobAction, updateJobAction, setJobStatusAction, duplicateJobAction, deleteJobAction, bulkImportJobsAction } from "../actions";

const JOB_TYPES = ["remote", "hybrid", "full_time", "part_time", "freelance"] as const;

/** Copyable prompt: paste into Claude, set the count, get JSON back to import. */
const JOB_IMPORT_PROMPT = `You are generating remote job listings for the "AI Remote Jobs" app. Output ONLY a valid JSON array — no markdown, no commentary. Each job must use exactly these fields:

[
  {
    "title": "AI Content Writer",
    "company": "Nova Labs",
    "description": "Write SEO blog posts and product copy using AI tools.",
    "salary_min": 400,
    "salary_max": 900,
    "salary_currency": "USD",
    "country": "Kenya",
    "country_flag": "🇰🇪",
    "category": "ai-content-writing",
    "type": "remote",
    "difficulty": "beginner",
    "application_url": "https://example.com/apply"
  }
]

Field rules:
- salary_min / salary_max: integers, MONTHLY amounts, salary_min < salary_max.
- type: one of remote | hybrid | full_time | part_time | freelance.
- difficulty: one of beginner | intermediate | advanced.
- category (kebab-case): ai-content-writing, virtual-assistant, customer-support, social-media, prompt-engineering, data-entry, research (or a sensible new one).
- country_flag: the emoji flag matching country.
- application_url: a real-looking URL or null.
- Make roles realistic and doable by AI-skilled remote workers in Kenya, Qatar, Africa and the global market.

Generate 20 jobs.`;

const STATUS_BADGE: Record<JobStatus, "success" | "muted" | "warning"> = {
  published: "success",
  draft: "muted",
  closed: "warning",
  archived: "warning",
};

export function JobsClient({
  initialJobs,
  courses,
  query,
  status,
}: {
  initialJobs: Job[];
  courses: { id: string; title: string }[];
  query: string;
  status: JobStatus | "all";
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Job | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(JOB_IMPORT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — surface the text so it can be copied manually
      window.prompt("Copy the job-format prompt:", JOB_IMPORT_PROMPT);
    }
  }

  function applyFilters(next: { q?: string; status?: string }) {
    const params = new URLSearchParams();
    const merged = { q, status, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.status && merged.status !== "all") params.set("status", merged.status);
    router.push(`/jobs?${params.toString()}`);
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form onSubmit={(e) => { e.preventDefault(); applyFilters({ q }); }} className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or company…" className="pl-8" />
        </form>
        <Select value={status} onChange={(e) => applyFilters({ status: e.target.value })} className="sm:w-40">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </Select>
        <Button variant="outline" onClick={copyPrompt}>
          {copied ? <ClipboardCheck className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy AI prompt"}
        </Button>
        <Button variant="outline" onClick={() => setImporting(true)}>
          <Upload className="h-4 w-4" /> Import
        </Button>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New job
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden sm:table-cell">Country</TableHead>
              <TableHead className="hidden lg:table-cell">Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialJobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No jobs found.</TableCell>
              </TableRow>
            )}
            {initialJobs.map((j) => (
              <TableRow key={j.id}>
                <TableCell><button className="font-medium hover:underline" onClick={() => setEditing(j)}>{j.title}</button></TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{j.company}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{j.country_flag} {j.country}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{JOB_TYPE_LABELS[j.type as JobType] ?? j.type}</TableCell>
                <TableCell><Badge variant={STATUS_BADGE[j.status] ?? "muted"}>{JOB_STATUS_LABELS[j.status] ?? j.status}</Badge></TableCell>
                <TableCell className="relative">
                  <Button variant="ghost" size="icon" onClick={() => setMenuFor(menuFor === j.id ? null : j.id)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {menuFor === j.id && (
                    <div className="absolute right-2 top-10 z-20 w-44 rounded-md border bg-card p-1 shadow-md">
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => { setMenuFor(null); setEditing(j); }}>
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      {j.status !== "published" ? (
                        <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => setJobStatusAction(j.id, "published"))}>
                          <Eye className="h-4 w-4" /> Publish
                        </button>
                      ) : (
                        <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => setJobStatusAction(j.id, "draft"))}>
                          <EyeOff className="h-4 w-4" /> Unpublish
                        </button>
                      )}
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => duplicateJobAction(j.id))}>
                        <Copy className="h-4 w-4" /> Duplicate
                      </button>
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-accent" onClick={() => { if (confirm(`Delete "${j.title}"?`)) run(() => deleteJobAction(j.id)); }}>
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
        <JobDialog
          job={editing}
          courses={courses}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
      {importing && <ImportJobsDialog onClose={() => setImporting(false)} />}
    </div>
  );
}

function ImportJobsDialog({ onClose }: { onClose: () => void }) {
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
    const arr = Array.isArray(parsed) ? parsed : parsed.jobs;
    if (!Array.isArray(arr)) { setError('Expected a JSON array (or { "jobs": [...] }).'); return; }

    const rows: JobInput[] = arr.map((r: any) => ({
      title: String(r.title ?? "").trim(),
      company: String(r.company ?? "").trim(),
      description: String(r.description ?? ""),
      salary_min: Number(r.salary_min) || 0,
      salary_max: Number(r.salary_max) || 0,
      salary_currency: String(r.salary_currency ?? "USD"),
      country: String(r.country ?? "Remote"),
      country_flag: String(r.country_flag ?? "🌍"),
      category: String(r.category ?? "general"),
      type: (JOB_TYPES.includes(r.type) ? r.type : "remote") as JobType,
      required_xp: Number(r.required_xp) || 0,
      required_level: Number(r.required_level) || 1,
      required_course_ids: Array.isArray(r.required_course_ids) ? r.required_course_ids : [],
      difficulty: String(r.difficulty ?? "beginner"),
      application_url: r.application_url ? String(r.application_url) : null,
      status: (publish ? "published" : "draft") as JobStatus,
    })).filter((r) => r.title && r.company);

    if (rows.length === 0) { setError("No valid jobs found (each needs at least a title and company)."); return; }
    startTransition(async () => {
      const count = await bulkImportJobsAction(rows);
      setResult(count);
      router.refresh();
    });
  }

  return (
    <Dialog open onClose={onClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Import jobs</DialogTitle>
      </DialogHeader>
      <p className="mb-2 text-sm text-muted-foreground">
        Click <strong>Copy AI prompt</strong>, paste it into Claude, set how many jobs you want, then paste the JSON it returns here.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[240px] font-mono text-xs"
        placeholder='[{"title":"AI Content Writer","company":"Nova Labs","description":"…","salary_min":400,"salary_max":900,"country":"Kenya","country_flag":"🇰🇪","category":"ai-content-writing","type":"remote","difficulty":"beginner"}]'
      />
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        Publish immediately (uncheck to import as drafts)
      </label>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {result != null && <p className="mt-2 text-sm text-green-600">Imported {result} job(s).</p>}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{result != null ? "Done" : "Cancel"}</Button>
        <Button onClick={doImport} disabled={pending || !text.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Import
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function JobDialog({ job, courses, onClose }: { job: Job | null; courses: { id: string; title: string }[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: job?.title ?? "",
    company: job?.company ?? "",
    description: job?.description ?? "",
    salary_min: job?.salary_min ?? 0,
    salary_max: job?.salary_max ?? 0,
    salary_currency: job?.salary_currency ?? "USD",
    country: job?.country ?? COUNTRIES[0].name,
    type: (job?.type ?? "remote") as JobType,
    category: job?.category ?? "",
    required_xp: job?.required_xp ?? 0,
    required_level: job?.required_level ?? 1,
    required_course_ids: job?.required_course_ids ?? [],
    difficulty: job?.difficulty ?? "beginner",
    application_url: job?.application_url ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function toggleCourse(id: string) {
    set("required_course_ids", form.required_course_ids.includes(id)
      ? form.required_course_ids.filter((c) => c !== id)
      : [...form.required_course_ids, id]);
  }

  function save() {
    if (!form.title.trim() || !form.company.trim()) return;
    const flag = COUNTRIES.find((c) => c.name === form.country)?.flag ?? "🌍";
    const payload: JobInput = {
      title: form.title.trim(),
      company: form.company.trim(),
      description: form.description,
      salary_min: Number(form.salary_min) || 0,
      salary_max: Number(form.salary_max) || 0,
      salary_currency: form.salary_currency,
      country: form.country,
      country_flag: flag,
      type: form.type,
      category: form.category,
      required_xp: Number(form.required_xp) || 0,
      required_level: Number(form.required_level) || 1,
      required_course_ids: form.required_course_ids,
      difficulty: form.difficulty,
      application_url: form.application_url || null,
    };
    startTransition(async () => {
      if (job) await updateJobAction(job.id, payload);
      else await createJobAction(payload);
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onClose={onClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{job ? "Edit job" : "New job"}</DialogTitle>
      </DialogHeader>
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Company</Label><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-[90px]" /></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label>Salary min</Label><Input type="number" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value as any)} /></div>
          <div className="space-y-1.5"><Label>Salary max</Label><Input type="number" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value as any)} /></div>
          <div className="space-y-1.5"><Label>Currency</Label><Input value={form.salary_currency} onChange={(e) => set("salary_currency", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={form.country} onChange={(e) => set("country", e.target.value)}>
              {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onChange={(e) => set("type", e.target.value as JobType)}>
              {(["remote", "hybrid", "full_time", "part_time", "freelance"] as JobType[]).map((t) => <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label>Required XP</Label><Input type="number" value={form.required_xp} onChange={(e) => set("required_xp", e.target.value as any)} /></div>
          <div className="space-y-1.5"><Label>Required level</Label><Input type="number" value={form.required_level} onChange={(e) => set("required_level", e.target.value as any)} /></div>
          <div className="space-y-1.5"><Label>Difficulty</Label><Input value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Application URL</Label><Input value={form.application_url} onChange={(e) => set("application_url", e.target.value)} placeholder="https://…" /></div>
        <div className="space-y-1.5">
          <Label>Required courses (gates this job)</Label>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
            {courses.length === 0 && <p className="text-sm text-muted-foreground">No courses yet.</p>}
            {courses.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted/60">
                <input type="checkbox" checked={form.required_course_ids.includes(c.id)} onChange={() => toggleCourse(c.id)} />
                {c.title}
              </label>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={pending || !form.title.trim() || !form.company.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {job ? "Save job" : "Create job"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
