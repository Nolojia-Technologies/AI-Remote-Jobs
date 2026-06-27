"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Eye, EyeOff, FileStack, Sparkles, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Lesson, CourseStatus } from "@/types/db";
import { saveLessonMeta } from "./actions";
import { convertNativePdfToStructured } from "../../import/actions";

/** Editor panel for a native PDF lesson — title + publish state (the PDF renders as-is). */
export function PdfLessonPanel({ courseId, lesson }: { courseId: string; lesson: Lesson }) {
  const router = useRouter();
  const [title, setTitle] = useState(lesson.title);
  const [status, setStatus] = useState<CourseStatus>(lesson.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  async function convertToStructured() {
    setConverting(true);
    setConvertError(null);
    try {
      await convertNativePdfToStructured(courseId, lesson.id);
      router.push(`/courses/${courseId}`);
    } catch (e) {
      setConvertError((e as Error).message || "Conversion failed.");
      setConverting(false);
    }
  }

  function save(next?: { status?: CourseStatus }) {
    const newStatus = next?.status ?? status;
    if (next?.status) setStatus(next.status);
    setSaving(true);
    setSaved(false);
    saveLessonMeta(courseId, lesson.id, { title, status: newStatus })
      .then(() => { setSaved(true); router.refresh(); })
      .finally(() => setSaving(false));
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <FileStack className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold">Native PDF lesson</div>
            <div className="text-sm text-muted-foreground">
              {lesson.pdf_pages ?? "?"} pages · renders exactly as uploaded · learners stream it in a protected viewer (no download).
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Lesson title</Label>
          <Input value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} />
        </div>

        <div className="flex items-center gap-2 border-t pt-4">
          <Button onClick={() => save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
          </Button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
          <div className="ml-auto">
            {status === "published" ? (
              <Button variant="outline" onClick={() => save({ status: "draft" })} disabled={saving}><EyeOff className="h-4 w-4" /> Unpublish</Button>
            ) : (
              <Button variant="outline" onClick={() => save({ status: "published" })} disabled={saving}><Eye className="h-4 w-4" /> Publish</Button>
            )}
          </div>
        </div>

        {/* Upgrade: rebuild the PDF into native, structured lesson(s) */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-2">
              <div>
                <div className="text-sm font-semibold">Convert to a structured lesson</div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Rebuild this PDF&apos;s content into native premium lesson(s) — the same sections, reading experience and
                  cooldown/quiz gating as authored lessons. The content stays the PDF&apos;s (AI restructures, it does not
                  invent). Long PDFs may split into several lessons. This replaces the raw PDF viewer.
                </p>
              </div>
              {convertError && <p className="text-xs text-destructive">{convertError}</p>}
              <Button size="sm" onClick={convertToStructured} disabled={converting || saving}>
                {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {converting ? "Converting…" : "Convert with AI"}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Or, to replace the PDF, delete this lesson and import again.
        </p>
      </CardContent>
    </Card>
  );
}
