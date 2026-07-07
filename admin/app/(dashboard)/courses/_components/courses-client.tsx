"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  EyeOff,
  Archive,
  Copy,
  Trash2,
  Pencil,
  Loader2,
  Upload,
  Sparkles,
  ClipboardCheck,
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
import { COURSE_CATEGORIES } from "@/lib/constants";
import { COURSE_STATUS_LABELS, DIFFICULTY_LABELS } from "@/types/db";
import type { Course, CourseStatus, Difficulty } from "@/types/db";
import {
  createCourseAction,
  setCourseStatusAction,
  duplicateCourseAction,
  deleteCourseAction,
  bulkImportCoursesAction,
} from "../actions";

/** Copyable prompt: paste into Claude, set the count, paste the JSON back to import. */
const COURSE_IMPORT_PROMPT = `You are creating full courses for the "AI Remote Jobs" learning app. Output ONLY a valid JSON array — no markdown fences, no commentary. Each course object:

[
  {
    "title": "AI Content Writing Fundamentals",
    "description": "1–2 sentence summary of what the learner will achieve.",
    "category": "ai-content-writing",
    "difficulty": "beginner",
    "estimated_hours": 3,
    "xp_reward": 200,
    "tags": ["writing", "ai", "freelancing"],
    "lessons": [
      {
        "title": "Introduction to AI Writing",
        "body": "Rich Markdown lesson. Use sections like ## Key concepts, ## Worked example, ## Case study, ## Exercise, ## Tips, ## Common mistakes, ## Resources.",
        "duration_minutes": 6,
        "xp_reward": 15
      }
    ]
  }
]

Rules:
- 5–8 lessons per course; each lesson body is 300–700 words of practical Markdown.
- difficulty: one of beginner | intermediate | advanced | expert | master.
- category: kebab-case (e.g. ai-content-writing, virtual-assistant, customer-support, social-media, prompt-engineering, data-entry, research).
- Teach employable, real-world remote & freelancing skills for Kenya, Qatar, Africa and the global market. No fluff.
- Output ONLY the JSON array.

Generate 3 courses.`;

const STATUS_BADGE: Record<CourseStatus, "success" | "muted" | "warning"> = {
  published: "success",
  draft: "muted",
  archived: "warning",
};

export function CoursesClient({
  initialCourses,
  query,
  status,
  sort,
}: {
  initialCourses: Course[];
  query: string;
  status: CourseStatus | "all";
  sort: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [pending, startTransition] = useTransition();
  const [openNew, setOpenNew] = useState(false);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(COURSE_IMPORT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the course-format prompt:", COURSE_IMPORT_PROMPT);
    }
  }

  function applyFilters(next: { q?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams();
    const merged = { q, status, sort, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.status && merged.status !== "all") params.set("status", merged.status);
    if (merged.sort && merged.sort !== "order") params.set("sort", merged.sort);
    router.push(`/courses?${params.toString()}`);
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters({ q });
          }}
          className="relative flex-1"
        >
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" className="pl-8" />
        </form>
        <Select value={status} onChange={(e) => applyFilters({ status: e.target.value })} className="sm:w-40">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
        <Select value={sort} onChange={(e) => applyFilters({ sort: e.target.value })} className="sm:w-40">
          <option value="order">Manual order</option>
          <option value="newest">Newest</option>
          <option value="title">Title A–Z</option>
        </Select>
        <Button variant="outline" onClick={copyPrompt}>
          {copied ? <ClipboardCheck className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy AI prompt"}
        </Button>
        <Button variant="outline" onClick={() => setImporting(true)}>
          <Upload className="h-4 w-4" /> Import
        </Button>
        <Button onClick={() => setOpenNew(true)}>
          <Plus className="h-4 w-4" />
          New course
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden sm:table-cell">Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCourses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No courses found. Create one or generate with AI.
                </TableCell>
              </TableRow>
            )}
            {initialCourses.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/courses/${c.id}`} className="font-medium hover:underline">
                    {c.title}
                  </Link>
                  {c.ai_generated && <Badge variant="secondary" className="ml-2">AI</Badge>}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{c.category || "—"}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {DIFFICULTY_LABELS[c.difficulty as Difficulty] ?? c.difficulty}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[c.status] ?? "muted"}>{COURSE_STATUS_LABELS[c.status] ?? c.status}</Badge>
                </TableCell>
                <TableCell className="relative">
                  <Button variant="ghost" size="icon" onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {menuFor === c.id && (
                    <div className="absolute right-2 top-10 z-20 w-44 rounded-md border bg-card p-1 shadow-md">
                      <Link href={`/courses/${c.id}`} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                        <Pencil className="h-4 w-4" /> Edit
                      </Link>
                      {c.status !== "published" ? (
                        <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => setCourseStatusAction(c.id, "published"))}>
                          <Eye className="h-4 w-4" /> Publish
                        </button>
                      ) : (
                        <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => setCourseStatusAction(c.id, "draft"))}>
                          <EyeOff className="h-4 w-4" /> Unpublish
                        </button>
                      )}
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => setCourseStatusAction(c.id, "archived"))}>
                        <Archive className="h-4 w-4" /> Archive
                      </button>
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => run(() => duplicateCourseAction(c.id))}>
                        <Copy className="h-4 w-4" /> Duplicate
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                        onClick={() => {
                          if (confirm(`Delete "${c.title}"? This removes its content too.`)) run(() => deleteCourseAction(c.id));
                        }}
                      >
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

      {pending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Working…
        </p>
      )}

      <NewCourseDialog open={openNew} onClose={() => setOpenNew(false)} />
      {importing && <ImportCoursesDialog onClose={() => setImporting(false)} />}
    </div>
  );
}

function ImportCoursesDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [publish, setPublish] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ courses: number; lessons: number } | null>(null);
  const [pending, startTransition] = useTransition();

  function doImport() {
    setError(null);
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { setError("Invalid JSON. Paste the array Claude returned."); return; }
    const arr = Array.isArray(parsed) ? parsed : parsed.courses;
    if (!Array.isArray(arr)) { setError('Expected a JSON array (or { "courses": [...] }).'); return; }

    const DIFF = ["beginner", "intermediate", "advanced", "expert", "master"];
    const items = arr.map((c: any) => ({
      title: String(c.title ?? "").trim(),
      description: String(c.description ?? ""),
      category: String(c.category ?? "general"),
      difficulty: (DIFF.includes(c.difficulty) ? c.difficulty : "beginner"),
      estimated_hours: Number(c.estimated_hours) || 1,
      xp_reward: Number(c.xp_reward) || 100,
      tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
      status: publish ? "published" : "draft",
      lessons: (Array.isArray(c.lessons) ? c.lessons : []).map((l: any) => ({
        title: String(l.title ?? "").trim(),
        body: String(l.body ?? ""),
        duration_minutes: Number(l.duration_minutes) || 5,
        xp_reward: Number(l.xp_reward) || 15,
      })).filter((l: any) => l.title),
    })).filter((c: any) => c.title);

    if (items.length === 0) { setError("No valid courses found (each needs a title)."); return; }
    startTransition(async () => {
      const res = await bulkImportCoursesAction(items as any);
      setResult(res);
      router.refresh();
    });
  }

  return (
    <Dialog open onClose={onClose} className="max-w-2xl">
      <DialogHeader><DialogTitle>Import courses</DialogTitle></DialogHeader>
      <p className="mb-2 text-sm text-muted-foreground">
        Click <strong>Copy AI prompt</strong>, paste it into Claude, set how many courses you want, then paste the JSON it returns here. Each course + its lessons are created.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[240px] font-mono text-xs"
        placeholder='[{"title":"AI Content Writing","description":"…","category":"ai-content-writing","difficulty":"beginner","estimated_hours":3,"xp_reward":200,"tags":["ai"],"lessons":[{"title":"Intro","body":"## Key concepts\\n…","duration_minutes":6,"xp_reward":15}]}]'
      />
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        Publish immediately (recommended: leave off, review then publish)
      </label>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {result && <p className="mt-2 text-sm text-green-600">Imported {result.courses} course(s) and {result.lessons} lesson(s).</p>}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{result ? "Done" : "Cancel"}</Button>
        <Button onClick={doImport} disabled={pending || !text.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Import
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function NewCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(COURSE_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [description, setDescription] = useState("");

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      const course = await createCourseAction({ title: title.trim(), category, difficulty, description, status: "draft" });
      onClose();
      setTitle("");
      setDescription("");
      router.push(`/courses/${course.id}`);
    });
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>New course</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Virtual Assistant" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {COURSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              {(["beginner", "intermediate", "advanced", "expert", "master"] as Difficulty[]).map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One or two sentences on what learners will achieve." />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={pending || !title.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
