"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RichTextEditor, type EditorChange } from "@/components/editor/RichTextEditor";
import { LESSON_TYPE_LABELS } from "@/types/db";
import type { Lesson, LessonType, CourseStatus } from "@/types/db";
import { cn } from "@/lib/utils";
import { saveLessonContent } from "./actions";

const LESSON_TYPES: LessonType[] = ["text", "exercise", "checklist", "resources", "code", "video", "image", "pdf"];

export function LessonEditor({ courseId, lesson, initialHtml }: { courseId: string; lesson: Lesson; initialHtml: string }) {
  const [title, setTitle] = useState(lesson.title);
  const [type, setType] = useState<LessonType>(lesson.type);
  const [status, setStatus] = useState<CourseStatus>(lesson.status);
  const [fullscreen, setFullscreen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const contentRef = useRef<EditorChange>({ html: initialHtml, json: lesson.content ?? null, text: "" });
  const metaRef = useRef({ title: lesson.title, type: lesson.type as LessonType, status: lesson.status as CourseStatus });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(() => {
    setSaveState("saving");
    const { html, json, text } = contentRef.current;
    saveLessonContent(courseId, lesson.id, {
      title: metaRef.current.title,
      type: metaRef.current.type,
      status: metaRef.current.status,
      content_html: html,
      content: json,
      body: text,
      character_count: text.length,
      estimated_reading_minutes: Math.max(1, Math.ceil(text.length / 1000)),
    })
      .then(() => setSaveState("saved"))
      .catch(() => setSaveState("idle"));
  }, [courseId, lesson.id]);

  const scheduleSave = useCallback(() => {
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(doSave, 1200);
  }, [doSave]);

  const onContent = useCallback((c: EditorChange) => {
    contentRef.current = c;
    scheduleSave();
  }, [scheduleSave]);

  function setMeta(patch: Partial<typeof metaRef.current>) {
    metaRef.current = { ...metaRef.current, ...patch };
    scheduleSave();
  }

  return (
    <div className={cn(fullscreen && "fixed inset-0 z-50 bg-background p-4")}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setMeta({ title: e.target.value }); }}
          className="max-w-sm text-base font-semibold"
          placeholder="Lesson title"
        />
        <Select
          value={type}
          onChange={(e) => { setType(e.target.value as LessonType); setMeta({ type: e.target.value as LessonType }); }}
          className="w-40"
        >
          {LESSON_TYPES.map((t) => <option key={t} value={t}>{LESSON_TYPE_LABELS[t]}</option>)}
        </Select>
        {status === "published" ? (
          <Button variant="outline" size="sm" onClick={() => { setStatus("draft"); setMeta({ status: "draft" }); }}>
            <EyeOff className="h-4 w-4" /> Unpublish
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => { setStatus("published"); setMeta({ status: "published" }); }}>
            <Eye className="h-4 w-4" /> Publish
          </Button>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          {saveState === "saving" ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
          ) : saveState === "saved" ? (
            <><Check className="h-3.5 w-3.5 text-green-600" /> Saved</>
          ) : (
            <span className="capitalize">{status}</span>
          )}
        </span>
      </div>

      <div style={{ height: fullscreen ? "calc(100vh - 110px)" : "72vh" }}>
        <RichTextEditor
          initialHtml={initialHtml}
          onChange={onContent}
          fullscreen={fullscreen}
          onToggleFullscreen={() => setFullscreen((f) => !f)}
        />
      </div>
    </div>
  );
}
