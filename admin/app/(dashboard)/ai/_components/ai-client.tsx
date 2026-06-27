"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Wand2, Image as ImageIcon, GraduationCap, Layers, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TARGET_MARKETS } from "@/lib/constants";

type Course = { id: string; title: string; thumbnail_url: string | null } | null;
type Stage = { id: string; title: string };
type Chapter = { id: string; title: string; stage_id: string | null };

async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export function AiClient({ course, stages, chapters }: { course: Course; stages: Stage[]; chapters: Chapter[] }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [market, setMarket] = useState<string>(TARGET_MARKETS[0]);
  const [includeQuizzes, setIncludeQuizzes] = useState(true);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  function add(line: string) {
    setLog((l) => [...l, line]);
  }

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      add(`❌ ${(e as Error).message}`);
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  // ── Layer 1 only ──
  function generateStructure() {
    withBusy(async () => {
      add(`⏳ Generating structure for "${topic}"…`);
      const r = await postJSON("/api/ai/structure", { topic, difficulty, market, courseId: course?.id });
      add(`✅ Structure created (${r.stages.length} stages). Opening course…`);
      router.push(`/courses/${r.courseId}`);
    });
  }

  // ── Full orchestration (layered) ──
  function generateEntireCourse() {
    withBusy(async () => {
      add(`🚀 Generating entire course "${topic || course?.title}" — this can take a few minutes.`);
      let courseId = course?.id;
      let genStages: { id: string; title: string; chapters: { id: string; title: string }[] }[];

      if (!courseId) {
        add("⏳ Layer 1: structure…");
        const r = await postJSON("/api/ai/structure", { topic, difficulty, market });
        courseId = r.courseId as string;
        genStages = r.stages;
        add(`✅ ${r.stages.length} stages created.`);
      } else {
        // Build the working set from the already-loaded structure.
        genStages = stages.map((s) => ({ id: s.id, title: s.title, chapters: chapters.filter((c) => c.stage_id === s.id) }));
        if (genStages.length === 0) {
          add("⏳ Layer 1: structure (course had none)…");
          const r = await postJSON("/api/ai/structure", { topic: course?.title || topic, difficulty, market, courseId });
          genStages = r.stages;
        }
      }

      for (const stage of genStages) {
        add(`⏳ Layer 2: lessons for "${stage.title}"…`);
        const r = await postJSON("/api/ai/stage", { courseId, stageId: stage.id, market });
        add(`   ✅ ${r.lessonCount} lessons, ${r.quizCount} mini-challenges.`);

        if (includeQuizzes) {
          for (const ch of stage.chapters) {
            add(`   ⏳ Quiz: "${ch.title}"…`);
            await postJSON("/api/ai/quiz", { courseId, chapterId: ch.id, market });
          }
        }

        add(`   ⏳ Milestone test: "${stage.title}"…`);
        await postJSON("/api/ai/milestone", { courseId, stageId: stage.id, market });
      }

      add("⏳ Layer 6: final assessment…");
      await postJSON("/api/ai/final", { courseId, market });
      add("🎉 Done. Review and publish from the course editor.");
      if (!course) router.push(`/courses/${courseId}`);
    });
  }

  function genThumbnail() {
    if (!course) return;
    withBusy(async () => {
      add("⏳ Generating thumbnail…");
      await postJSON("/api/ai/thumbnail", { courseId: course.id });
      add("✅ Thumbnail saved to the course.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {!course && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Create a new course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Virtual Assistant, ChatGPT for Work…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    {["beginner", "intermediate", "advanced", "expert", "master"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Target market</Label>
                  <Select value={market} onChange={(e) => setMarket(e.target.value)}>
                    {TARGET_MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={includeQuizzes} onChange={(e) => setIncludeQuizzes(e.target.checked)} />
                Include per-chapter quizzes (10 Q each) in full generation
              </label>
              <div className="flex flex-wrap gap-2">
                <Button onClick={generateStructure} disabled={busy || !topic.trim()} variant="outline">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />} Generate structure only
                </Button>
                <Button onClick={generateEntireCourse} disabled={busy || !topic.trim()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate entire course
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Generation runs in layers (structure → lessons → quizzes → milestone → final) and never one-shots a whole course in a single request.
              </p>
            </CardContent>
          </Card>
        )}

        {course && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4 text-primary" /> {course.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    {["beginner", "intermediate", "advanced", "expert", "master"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Target market</Label>
                  <Select value={market} onChange={(e) => setMarket(e.target.value)}>
                    {TARGET_MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={includeQuizzes} onChange={(e) => setIncludeQuizzes(e.target.checked)} />
                Include per-chapter quizzes in full generation
              </label>
              <div className="flex flex-wrap gap-2">
                <Button onClick={generateEntireCourse} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate full content
                </Button>
                <Button variant="outline" onClick={() => withBusy(async () => { add("⏳ Final assessment…"); await postJSON("/api/ai/final", { courseId: course.id, market }); add("✅ Final assessment created."); })} disabled={busy}>
                  <GraduationCap className="h-4 w-4" /> Final assessment
                </Button>
                <Button variant="outline" onClick={genThumbnail} disabled={busy}>
                  <ImageIcon className="h-4 w-4" /> Thumbnail
                </Button>
              </div>

              {stages.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-medium">Per-stage generation</p>
                  {stages.map((s) => (
                    <div key={s.id} className="rounded-lg border p-2">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{s.title}</span>
                        <div className="ml-auto flex gap-1">
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => withBusy(async () => { add(`⏳ Lessons: ${s.title}…`); const r = await postJSON("/api/ai/stage", { courseId: course.id, stageId: s.id, market }); add(`✅ ${r.lessonCount} lessons.`); })}>
                            Lessons
                          </Button>
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => withBusy(async () => { add(`⏳ Milestone: ${s.title}…`); await postJSON("/api/ai/milestone", { courseId: course.id, stageId: s.id, market }); add("✅ Milestone test created."); })}>
                            Milestone
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 pl-6">
                        {chapters.filter((c) => c.stage_id === s.id).map((c) => (
                          <Button key={c.id} size="sm" variant="outline" className="h-7" disabled={busy} onClick={() => withBusy(async () => { add(`⏳ Quiz: ${c.title}…`); await postJSON("/api/ai/quiz", { courseId: course.id, chapterId: c.id, market }); add("✅ Quiz created."); })}>
                            <HelpCircle className="h-3 w-3" /> {c.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Generation progress appears here.</p>
          ) : (
            <div className="max-h-[60vh] space-y-1 overflow-y-auto font-mono text-xs">
              {log.map((l, i) => <div key={i} className="whitespace-pre-wrap">{l}</div>)}
            </div>
          )}
          {busy && (
            <Badge variant="secondary" className="mt-3 gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Working…</Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
