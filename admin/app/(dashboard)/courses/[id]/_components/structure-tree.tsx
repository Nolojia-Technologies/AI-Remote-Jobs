"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ASSESSMENT_SPEC, LESSON_TYPE_LABELS } from "@/types/db";
import type { Stage, Chapter, Lesson, Quiz } from "@/types/db";
import {
  addStage,
  editStage,
  removeStage,
  addChapter,
  editChapter,
  removeChapter,
  addLesson,
  removeLesson,
  addQuiz,
  removeQuiz,
} from "../actions";
import { QuizDialog } from "./quiz-dialog";

export function StructureTree({
  courseId,
  stages,
  chapters,
  lessons,
  quizzes,
}: {
  courseId: string;
  stages: Stage[];
  chapters: Chapter[];
  lessons: Lesson[];
  quizzes: Quiz[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [quizCtx, setQuizCtx] = useState<Quiz | null>(null);

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  const openLessonEditor = (lessonId: string) => router.push(`/courses/${courseId}/lessons/${lessonId}`);

  function createAndOpenLesson(chapter: Chapter) {
    startTransition(async () => {
      const l = await addLesson(courseId, { title: "Untitled lesson", stage_id: chapter.stage_id, chapter_id: chapter.id });
      router.push(`/courses/${courseId}/lessons/${l.id}`);
    });
  }

  const chaptersInStage = (stageId: string) => chapters.filter((c) => c.stage_id === stageId);
  const orphanChapters = chapters.filter((c) => !c.stage_id || !stages.some((s) => s.id === c.stage_id));
  const lessonsInChapter = (chapterId: string) => lessons.filter((l) => l.chapter_id === chapterId);
  const quizzesInChapter = (chapterId: string) => quizzes.filter((q) => q.chapter_id === chapterId);

  async function onAddQuiz(chapter: Chapter) {
    const spec = ASSESSMENT_SPEC.chapter;
    const quiz = await addQuiz(courseId, {
      title: `${chapter.title} — Quiz`,
      kind: "chapter",
      stage_id: chapter.stage_id,
      chapter_id: chapter.id,
      passing_score: spec.passing_score,
      xp_reward: spec.xp_reward,
      retry_limit: 0,
      cooldown_minutes: 0,
    });
    router.refresh();
    setQuizCtx(quiz);
  }

  function ChapterBlock({ chapter }: { chapter: Chapter }) {
    return (
      <div className="rounded-lg border bg-background p-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{chapter.title}</span>
          {chapter.is_milestone && (
            <Badge variant="warning" className="gap-1"><Flag className="h-3 w-3" /> Milestone</Badge>
          )}
          <div className="ml-auto flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
              const t = prompt("Chapter title", chapter.title);
              if (t && t.trim()) run(() => editChapter(courseId, chapter.id, { title: t.trim() }));
            }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => {
              if (confirm(`Delete chapter "${chapter.title}" and its content?`)) run(() => removeChapter(courseId, chapter.id));
            }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {lessonsInChapter(chapter.id).map((l) => (
            <div key={l.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted/60">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="truncate">{l.title}</span>
              <Badge variant="muted" className="ml-1">{LESSON_TYPE_LABELS[l.type] ?? l.type}</Badge>
              <div className="ml-auto flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openLessonEditor(l.id)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => run(() => removeLesson(courseId, l.id))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {quizzesInChapter(chapter.id).map((q) => (
            <div key={q.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted/60">
              <HelpCircle className="h-4 w-4 text-violet-500" />
              <span className="truncate">{q.title}</span>
              <Badge variant="secondary" className="ml-1">{q.kind}</Badge>
              <div className="ml-auto flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setQuizCtx(q)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => run(() => removeQuiz(courseId, q.id))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => createAndOpenLesson(chapter)} disabled={pending}>
            <Plus className="h-3.5 w-3.5" /> Lesson
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAddQuiz(chapter)}>
            <Plus className="h-3.5 w-3.5" /> Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {stages.length} stages · {chapters.length} chapters · {lessons.length} lessons · {quizzes.length} quizzes
        </p>
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => {
            const t = prompt("Stage title", `Stage ${stages.length + 1}`);
            if (t && t.trim()) run(() => addStage(courseId, { title: t.trim(), order_index: stages.length }));
          }}
        >
          <Plus className="h-4 w-4" /> Add stage
        </Button>
      </div>

      {pending && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Working…</p>}

      {stages.map((stage) => (
        <Card key={stage.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-semibold">{stage.title}</span>
              <div className="ml-auto flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => {
                  const t = prompt("Chapter title", "New chapter");
                  if (t && t.trim()) run(() => addChapter(courseId, { title: t.trim(), stage_id: stage.id, order_index: chaptersInStage(stage.id).length }));
                }}>
                  <Plus className="h-3.5 w-3.5" /> Chapter
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                  const t = prompt("Stage title", stage.title);
                  if (t && t.trim()) run(() => editStage(courseId, stage.id, { title: t.trim() }));
                }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                  if (confirm(`Delete stage "${stage.title}" and everything in it?`)) run(() => removeStage(courseId, stage.id));
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {chaptersInStage(stage.id).length === 0 ? (
              <p className="text-sm text-muted-foreground">No chapters yet.</p>
            ) : (
              <div className="space-y-2">
                {chaptersInStage(stage.id).map((c) => (
                  <ChapterBlock key={c.id} chapter={c} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {orphanChapters.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-muted-foreground">Unassigned chapters</p>
            {orphanChapters.map((c) => (
              <ChapterBlock key={c.id} chapter={c} />
            ))}
          </CardContent>
        </Card>
      )}

      {stages.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No structure yet. Add a stage to begin, or use{" "}
            <span className="font-medium text-foreground">Generate with AI</span> to scaffold the whole course.
          </CardContent>
        </Card>
      )}

      {quizCtx && <QuizDialog open onClose={() => setQuizCtx(null)} courseId={courseId} quiz={quizCtx} />}
    </div>
  );
}
