"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Eye, EyeOff, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { COURSE_CATEGORIES } from "@/lib/constants";
import { DIFFICULTY_LABELS } from "@/types/db";
import type { Course, Difficulty } from "@/types/db";
import { updateCourseAction, setCourseStatusAction } from "../../actions";

export function DetailsForm({ course }: { course: Course }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    title: course.title,
    slug: course.slug ?? "",
    description: course.description ?? "",
    category: course.category ?? COURSE_CATEGORIES[0],
    difficulty: course.difficulty,
    estimated_hours: course.estimated_hours ?? 0,
    xp_reward: course.xp_reward ?? 0,
    required_level: course.required_level ?? 1,
    thumbnail_url: course.thumbnail_url ?? "",
    tags: (course.tags ?? []).join(", "),
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await updateCourseAction(course.id, {
        title: form.title,
        slug: form.slug || undefined,
        description: form.description,
        category: form.category,
        difficulty: form.difficulty,
        estimated_hours: Number(form.estimated_hours) || 0,
        xp_reward: Number(form.xp_reward) || 0,
        required_level: Number(form.required_level) || 1,
        thumbnail_url: form.thumbnail_url || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setSaved(true);
      router.refresh();
    });
  }

  function status(next: "published" | "draft" | "archived") {
    startTransition(async () => {
      await setCourseStatusAction(course.id, next);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from title" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {COURSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-[90px]" />
          </div>
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <Select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty)}>
              {(["beginner", "intermediate", "advanced", "expert", "master"] as Difficulty[]).map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estimated hours</Label>
            <Input type="number" value={form.estimated_hours} onChange={(e) => set("estimated_hours", e.target.value as any)} />
          </div>
          <div className="space-y-1.5">
            <Label>XP reward</Label>
            <Input type="number" value={form.xp_reward} onChange={(e) => set("xp_reward", e.target.value as any)} />
          </div>
          <div className="space-y-1.5">
            <Label>Required level</Label>
            <Input type="number" value={form.required_level} onChange={(e) => set("required_level", e.target.value as any)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Thumbnail URL</Label>
            <Input value={form.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="https://…supabase.co/storage/v1/object/public/course-thumbnails/…" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="virtual-assistant, admin, remote" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button onClick={save} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save details
          </Button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
          <div className="ml-auto flex gap-2">
            {course.status !== "published" ? (
              <Button variant="outline" onClick={() => status("published")} disabled={pending}>
                <Eye className="h-4 w-4" /> Publish
              </Button>
            ) : (
              <Button variant="outline" onClick={() => status("draft")} disabled={pending}>
                <EyeOff className="h-4 w-4" /> Unpublish
              </Button>
            )}
            <Button variant="outline" onClick={() => status("archived")} disabled={pending}>
              <Archive className="h-4 w-4" /> Archive
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
