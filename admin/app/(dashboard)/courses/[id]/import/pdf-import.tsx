"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, Trash2, ArrowUp, ArrowDown, ArrowUpToLine, Sparkles, Loader2, Plus, RefreshCw, FileStack, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { timeAgo } from "@/lib/utils";
import { createLessonsFromImport, createStructuredLessonsFromImport, createNativePdfLesson, createNewChapter, reprocessPdf, deletePdf } from "./actions";
import type { SplitMode } from "@/lib/pdf/extract";

type LessonDraft = { title: string; html: string; body?: string };
type NativePdf = { path: string; pages: number; fileName: string; title: string };
type Chapter = { id: string; title: string; stage_id: string | null };
type Stage = { id: string; title: string };
type Pdf = { id: string; file_name: string; file_path: string; created_at: string };
type ImportMode = "ai" | "text" | "native";

const NEW_CHAPTER = "__new__";

export function PdfImport({
  courseId,
  chapters,
  stages,
  pdfs,
}: {
  courseId: string;
  chapters: Chapter[];
  stages: Stage[];
  pdfs: Pdf[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  // Default to AI structuring: extract the PDF's content and rebuild it as
  // native premium lessons (our section format) — the content stays the PDF's,
  // but the experience matches hand-authored lessons (and gains the gates).
  const [importMode, setImportMode] = useState<ImportMode>("ai");
  const [splitMode, setSplitMode] = useState<SplitMode>("headings");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [lessons, setLessons] = useState<LessonDraft[] | null>(null);
  const [structured, setStructured] = useState(false);
  const [native, setNative] = useState<NativePdf | null>(null);

  const [dest, setDest] = useState<string>(chapters[0]?.id ?? NEW_CHAPTER);
  const [newChapterTitle, setNewChapterTitle] = useState("Imported");
  const [newChapterStage, setNewChapterStage] = useState<string>(stages[0]?.id ?? "");

  async function resolveChapterId(): Promise<string> {
    if (dest === NEW_CHAPTER) {
      const r = await createNewChapter(courseId, newChapterStage || null, newChapterTitle);
      return r.id;
    }
    return dest;
  }

  async function upload() {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setError("PDF exceeds the 50MB limit."); return; }
    setBusy("upload"); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("courseId", courseId);
      fd.append("mode", importMode);
      fd.append("splitMode", splitMode);
      const res = await fetch("/api/pdf/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import failed");
      if (json.native) {
        setNative({ ...json.native, title: (json.native.fileName || "PDF lesson").replace(/\.pdf$/i, "") });
      } else {
        setStructured(!!json.structured);
        setLessons(json.lessons || []);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function update(i: number, patch: Partial<LessonDraft>) {
    setLessons((ls) => (ls ? ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) : ls));
  }
  function move(i: number, dir: -1 | 1) {
    setLessons((ls) => {
      if (!ls) return ls;
      const j = i + dir;
      if (j < 0 || j >= ls.length) return ls;
      const copy = [...ls];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function mergeUp(i: number) {
    setLessons((ls) => {
      if (!ls || i === 0) return ls;
      const copy = [...ls];
      copy[i - 1] = {
        title: copy[i - 1].title,
        html: copy[i - 1].html + "\n" + copy[i].html,
        body: ((copy[i - 1].body ?? "") + "\n\n" + (copy[i].body ?? "")).trim() || undefined,
      };
      copy.splice(i, 1);
      return copy;
    });
  }
  function removeLesson(i: number) {
    setLessons((ls) => (ls ? ls.filter((_, idx) => idx !== i) : ls));
  }

  async function cleanupAI(i: number) {
    if (!lessons) return;
    setBusy("ai:" + i); setError(null);
    try {
      const res = await fetch("/api/ai/cleanup-html", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ html: lessons[i].html }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI cleanup needs an API key");
      if (json.html) update(i, { html: json.html });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createText() {
    if (!lessons || lessons.length === 0) return;
    setBusy("create"); setError(null);
    try {
      const chapterId = await resolveChapterId();
      if (structured) {
        await createStructuredLessonsFromImport(courseId, chapterId, lessons.map((l) => ({ title: l.title, body: l.body ?? "" })));
      } else {
        await createLessonsFromImport(courseId, chapterId, lessons.map((l) => ({ title: l.title, html: l.html })));
      }
      router.push(`/courses/${courseId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  async function createNative() {
    if (!native) return;
    setBusy("create"); setError(null);
    try {
      const chapterId = await resolveChapterId();
      await createNativePdfLesson(courseId, chapterId, { path: native.path, pages: native.pages, title: native.title });
      router.push(`/courses/${courseId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  const destFields = (
    <>
      <div className="space-y-1.5">
        <Label>Add to</Label>
        <Select value={dest} onChange={(e) => setDest(e.target.value)} className="w-56">
          {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          <option value={NEW_CHAPTER}>+ New chapter…</option>
        </Select>
      </div>
      {dest === NEW_CHAPTER && (
        <>
          <div className="space-y-1.5">
            <Label>New chapter title</Label>
            <Input value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)} className="w-56" />
          </div>
          {stages.length > 0 && (
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={newChapterStage} onChange={(e) => setNewChapterStage(e.target.value)} className="w-48">
                {stages.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </Select>
            </div>
          )}
        </>
      )}
    </>
  );

  // ── Native PDF preview ──────────────────────────────────────────────────────
  if (native) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <FileStack className="h-8 w-8 text-primary" />
              <div>
                <div className="text-sm font-semibold">Native PDF lesson · {native.pages} pages</div>
                <div className="text-xs text-muted-foreground">Renders exactly as the original — layout, images, diagrams preserved.</div>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label>Lesson title</Label>
                <Input value={native.title} onChange={(e) => setNative({ ...native, title: e.target.value })} className="w-72" />
              </div>
              {destFields}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setNative(null)} disabled={!!busy}>Discard</Button>
              <Button onClick={createNative} disabled={!!busy}>
                {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create PDF lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Text lessons preview ────────────────────────────────────────────────────
  if (lessons) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            {destFields}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => setLessons(null)} disabled={!!busy}>Discard</Button>
              <Button onClick={createText} disabled={!!busy || lessons.length === 0}>
                {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create {lessons.length} {structured ? "structured " : ""}{lessons.length === 1 ? "lesson" : "lessons"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {lessons.map((l, i) => (
          <Card key={i}>
            <CardHeader className="flex-row items-center gap-2 space-y-0 py-3">
              <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
              <Input value={l.title} onChange={(e) => update(i, { title: e.target.value })} className="max-w-md font-semibold" />
              <div className="ml-auto flex items-center gap-1">
                {!structured && (
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="AI clean-up" onClick={() => cleanupAI(i)} disabled={!!busy}>
                    {busy === "ai:" + i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-8 w-8" title="Move up" onClick={() => move(i, -1)} disabled={!!busy}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" title="Move down" onClick={() => move(i, 1)} disabled={!!busy}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" title="Merge into previous" onClick={() => mergeUp(i)} disabled={!!busy || i === 0}><ArrowUpToLine className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Delete" onClick={() => removeLesson(i)} disabled={!!busy}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="lesson-editor max-h-72 overflow-y-auto rounded-md border bg-background p-3 text-sm" dangerouslySetInnerHTML={{ __html: l.html }} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Upload ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Upload a course PDF</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>What kind of lesson?</Label>
            <div className="flex gap-2">
              <ModeBtn active={importMode === "ai"} onClick={() => setImportMode("ai")} title="Structure with AI (recommended)" desc="Rebuilds the PDF's content as native premium lessons — same structure & gating as authored lessons. Content stays the PDF's." />
              <ModeBtn active={importMode === "native"} onClick={() => setImportMode("native")} title="Keep as native PDF" desc="Renders the raw PDF page-by-page. Preserves layout, but no native lesson structure or gating." />
              <ModeBtn active={importMode === "text"} onClick={() => setImportMode("text")} title="Plain text extract" desc="Editable rich-text reflow, no AI restructuring. Images & diagrams are dropped." />
            </div>
            {importMode === "ai" && (
              <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  The PDF is used only as a <span className="font-semibold text-foreground">content source</span>. AI restructures its
                  actual content into our lesson format (Key concepts, Worked example, Tips, Key takeaways…) — it does not invent facts.
                  Review the drafts before publishing.
                </p>
              </div>
            )}
            {importMode === "text" && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs leading-relaxed">
                  <span className="font-semibold">Text mode drops images, diagrams and layout.</span>{" "}
                  Only the plain text is kept — learners will see unformatted content. For PDFs with visuals, use{" "}
                  <button type="button" onClick={() => setImportMode("native")} className="font-semibold underline underline-offset-2">
                    Keep as native PDF
                  </button>{" "}
                  instead.
                </p>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Choose PDF</Button>
            <span className="truncate text-sm text-muted-foreground">{file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : "No file selected · max 50MB"}</span>
          </div>

          {importMode !== "native" && (
            <div className="space-y-1.5">
              <Label>How should it split into lessons?</Label>
              <div className="flex gap-2">
                <ModeBtn active={splitMode === "headings"} onClick={() => setSplitMode("headings")} title="Split by headings" desc="Each heading becomes its own lesson" />
                <ModeBtn active={splitMode === "single"} onClick={() => setSplitMode("single")} title="Single lesson" desc="The whole PDF becomes one lesson" />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={upload} disabled={!file || !!busy}>
            {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : importMode === "ai" ? <Sparkles className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            {importMode === "native" ? "Upload PDF" : importMode === "ai" ? "Upload & structure with AI" : "Upload & extract"}
          </Button>
          {importMode === "ai" && <p className="text-xs text-muted-foreground">Structuring runs the AI on each section — large PDFs may take a minute.</p>}
          <p className="text-xs text-muted-foreground">
            The PDF is stored privately — learners never see or download it. Native PDFs stream page-by-page through a protected viewer.
          </p>
        </CardContent>
      </Card>

      {pdfs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Uploaded PDFs (text source)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {pdfs.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="min-w-0 truncate">{p.file_name}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</span>
                  <div className="ml-auto flex gap-1">
                    <Button size="sm" variant="ghost" onClick={async () => {
                      setBusy("reprocess:" + p.file_path); setError(null);
                      try { setLessons(await reprocessPdf(p.file_path, splitMode, p.file_name.replace(/\.pdf$/i, ""))); }
                      catch (e) { setError((e as Error).message); } finally { setBusy(null); }
                    }} disabled={!!busy}>
                      {busy === "reprocess:" + p.file_path ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Reprocess
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePdf(courseId, p.id).then(() => router.refresh())} disabled={!!busy}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ModeBtn({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-primary/10" : "hover:bg-accent"}`}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
