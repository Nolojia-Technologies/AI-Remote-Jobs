"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { QUESTION_TYPE_LABELS } from "@/types/db";
import type { Quiz, Question, QuestionType } from "@/types/db";
import { editQuiz, getQuizQuestions, saveQuizQuestions } from "../actions";

type DraftQuestion = {
  type: QuestionType;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];

function blankQuestion(): DraftQuestion {
  return { type: "multiple_choice", prompt: "", options: ["", "", "", ""], answer: "", explanation: "" };
}

export function QuizDialog({
  open,
  onClose,
  courseId,
  quiz,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  quiz: Quiz;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settings, setSettings] = useState({
    title: quiz.title,
    kind: quiz.kind,
    passing_score: quiz.passing_score,
    xp_reward: quiz.xp_reward,
    retry_limit: quiz.retry_limit,
    cooldown_minutes: quiz.cooldown_minutes,
  });
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoadingQ(true);
    getQuizQuestions(quiz.id)
      .then((qs: Question[]) =>
        setQuestions(
          qs.map((q) => ({
            type: q.type,
            prompt: q.prompt,
            options: q.options?.length ? q.options : ["", "", "", ""],
            answer: q.answer,
            explanation: q.explanation ?? "",
          }))
        )
      )
      .finally(() => setLoadingQ(false));
  }, [open, quiz.id]);

  function updateQ(i: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function save() {
    startTransition(async () => {
      await editQuiz(courseId, quiz.id, {
        title: settings.title,
        kind: settings.kind,
        passing_score: Number(settings.passing_score) || 0,
        xp_reward: Number(settings.xp_reward) || 0,
        retry_limit: Number(settings.retry_limit) || 0,
        cooldown_minutes: Number(settings.cooldown_minutes) || 0,
      });
      await saveQuizQuestions(
        quiz.id,
        questions
          .filter((q) => q.prompt.trim())
          .map((q, i) => ({
            type: q.type,
            prompt: q.prompt.trim(),
            options: q.type === "true_false" ? ["True", "False"] : q.options.filter((o) => o.trim()),
            answer: q.answer,
            explanation: q.explanation,
            order_index: i,
          }))
      );
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Edit quiz</DialogTitle>
      </DialogHeader>

      <div className="max-h-[68vh] space-y-5 overflow-y-auto pr-1">
        {/* Settings */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 space-y-1.5 sm:col-span-3">
            <Label>Title</Label>
            <Input value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Kind</Label>
            <Select value={settings.kind} onChange={(e) => setSettings({ ...settings, kind: e.target.value })}>
              <option value="chapter">Chapter quiz</option>
              <option value="mini">Mini challenge</option>
              <option value="milestone">Milestone test</option>
              <option value="final">Final assessment</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Passing %</Label>
            <Input type="number" value={settings.passing_score} onChange={(e) => setSettings({ ...settings, passing_score: e.target.value as any })} />
          </div>
          <div className="space-y-1.5">
            <Label>XP reward</Label>
            <Input type="number" value={settings.xp_reward} onChange={(e) => setSettings({ ...settings, xp_reward: e.target.value as any })} />
          </div>
          <div className="space-y-1.5">
            <Label>Retry limit</Label>
            <Input type="number" value={settings.retry_limit} onChange={(e) => setSettings({ ...settings, retry_limit: e.target.value as any })} />
          </div>
          <div className="space-y-1.5">
            <Label>Cooldown (min)</Label>
            <Input type="number" value={settings.cooldown_minutes} onChange={(e) => setSettings({ ...settings, cooldown_minutes: e.target.value as any })} />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Questions ({questions.length})</h3>
            <Button size="sm" variant="outline" onClick={() => setQuestions((q) => [...q, blankQuestion()])}>
              <Plus className="h-4 w-4" /> Add question
            </Button>
          </div>

          {loadingQ ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
          ) : (
            questions.map((q, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Q{i + 1}</span>
                  <Select value={q.type} onChange={(e) => updateQ(i, { type: e.target.value as QuestionType, answer: "" })} className="h-8 w-44">
                    {QUESTION_TYPES.map((t) => (
                      <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
                    ))}
                  </Select>
                  <Button size="icon" variant="ghost" className="ml-auto text-destructive" onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea value={q.prompt} onChange={(e) => updateQ(i, { prompt: e.target.value })} placeholder="Question prompt" className="min-h-[56px]" />

                {q.type === "multiple_choice" && (
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          title="Mark correct"
                          onClick={() => updateQ(i, { answer: opt })}
                          className={q.answer === opt && opt ? "text-green-600" : "text-muted-foreground"}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const options = [...q.options];
                            const prev = options[oi];
                            options[oi] = e.target.value;
                            updateQ(i, { options, answer: q.answer === prev ? e.target.value : q.answer });
                          }}
                          placeholder={`Option ${oi + 1}`}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">Tap the circle to mark the correct option.</p>
                  </div>
                )}

                {q.type === "true_false" && (
                  <Select value={q.answer} onChange={(e) => updateQ(i, { answer: e.target.value })} className="w-40">
                    <option value="">Select answer</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </Select>
                )}

                {(q.type === "fill_blank" || q.type === "scenario") && (
                  <Input value={q.answer} onChange={(e) => updateQ(i, { answer: e.target.value })} placeholder="Correct answer / key phrase" />
                )}

                <Input value={q.explanation} onChange={(e) => updateQ(i, { explanation: e.target.value })} placeholder="Explanation (shown after answering)" />
              </div>
            ))
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save quiz
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
