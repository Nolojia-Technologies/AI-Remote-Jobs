import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react-native";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/ProgressBar";
import { useProgressionStore } from "../../stores/progressionStore";
import { QuizGateQuestion } from "../../learning/types";
import { PROGRESSION } from "../../learning/config";

interface SubmitResult {
  passed: boolean;
  cooldown: boolean;
  attemptsLeft: number;
}

interface ChapterQuizProps {
  chapterId: string;
  questions: QuizGateQuestion[];
  passMark: number; // 0..1
  isMilestone: boolean;
  xpReward: number;
  lessonTitles: string[]; // for weak-area recommendations
  /** Persist the attempt + award XP; returns the resulting gate status. */
  onSubmit: (passed: boolean) => SubmitResult;
  onPassed: () => void;
  onAdRetry: () => Promise<boolean>; // rewarded ad → clears cooldown
  onExit: () => void;
}

function fmtCountdown(ms: number): string {
  const m = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

export function ChapterQuiz({
  chapterId,
  questions,
  passMark,
  isMilestone,
  xpReward,
  lessonTitles,
  onSubmit,
  onPassed,
  onAdRetry,
  onExit,
}: ChapterQuizProps) {
  const saveQuizProgress = useProgressionStore((s) => s.saveQuizProgress);
  const cp = useProgressionStore((s) => s.chapters[chapterId]);

  const [answers, setAnswers] = useState<Record<number, string>>(cp?.quizAnswers ?? {});
  const [index, setIndex] = useState(Math.min(cp?.quizCurrentIndex ?? 0, questions.length - 1));
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [submitting, setSubmitting] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [result, setResult] = useState<
    (SubmitResult & { correct: number; total: number; score: number }) | null
  >(null);

  const total = questions.length;
  const q = questions[index];
  const isLast = index === total - 1;
  const allAnswered = Object.keys(answers).length >= total;

  const select = (opt: string) => {
    const na = { ...answers, [index]: opt };
    setAnswers(na);
    saveQuizProgress(chapterId, na, index); // partial save
  };

  const go = (to: number) => {
    const clamped = Math.max(0, Math.min(total - 1, to));
    setIndex(clamped);
    saveQuizProgress(chapterId, answers, clamped);
  };

  const submit = () => {
    if (submitting || phase === "result") return; // no duplicate submissions
    setSubmitting(true);
    try {
      const correct = questions.filter((qq, i) => answers[i] === qq.answer).length;
      const score = Math.round((correct / total) * 100);
      const passed = correct / total >= passMark;
      const r = onSubmit(passed); // store write + XP award (guarded in store)
      setResult({ ...r, correct, total, score });
      setPhase("result");
    } finally {
      setSubmitting(false);
    }
  };

  const adRetry = async () => {
    setAdLoading(true);
    const ok = await onAdRetry();
    setAdLoading(false);
    if (ok) {
      setAnswers({});
      setIndex(0);
      setResult(null);
      setPhase("quiz");
    }
  };

  // ─── Quiz phase (one question at a time, partial-saved) ─────
  if (phase === "quiz") {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-bold text-gray-900 dark:text-white">
            {isMilestone ? "👑 Milestone Assessment" : "🧠 Chapter Quiz"}
          </Text>
          <Text className="text-xs text-gray-400">
            {index + 1}/{total}
          </Text>
        </View>
        <ProgressBar progress={((index + 1) / total) * 100} height={6} color="#2563EB" className="mb-4" />

        <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">{q.question}</Text>
        {q.options.map((opt) => {
          const selected = answers[index] === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => select(opt)}
              className={`p-3 rounded-xl border-2 mb-2 ${
                selected
                  ? "bg-primary-50 dark:bg-primary-900/20 border-primary"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              <Text className="text-sm text-gray-700 dark:text-gray-300">{opt}</Text>
            </TouchableOpacity>
          );
        })}

        <View className="flex-row gap-3 mt-3">
          {index > 0 && (
            <Button label="← Back" onPress={() => go(index - 1)} variant="outline" className="flex-1" />
          )}
          {!isLast ? (
            <Button
              label="Next →"
              onPress={() => go(index + 1)}
              disabled={answers[index] === undefined}
              fullWidth={index === 0}
              className="flex-1"
            />
          ) : (
            <Button
              label={submitting ? "Submitting…" : "Submit Quiz"}
              onPress={submit}
              loading={submitting}
              disabled={!allAnswered}
              className="flex-1"
            />
          )}
        </View>

        <TouchableOpacity onPress={onExit} className="items-center mt-3">
          <Text className="text-xs text-gray-400">Exit (progress saved · quiz locks for 2h)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Result phase ──────────────────────────────────────────
  if (!result) return null;
  const { passed, score, correct, cooldown, attemptsLeft } = result;
  const availableInMs = cooldown
    ? PROGRESSION.quiz.cooldownAfterMaxMs
    : PROGRESSION.quiz.failRetryWaitMs;
  const wrong = questions.filter((qq, i) => answers[i] !== qq.answer);

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
      <View className="items-center">
        <View
          className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
            passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
          }`}
        >
          {passed ? <CheckCircle2 size={32} color="#22C55E" /> : <XCircle size={32} color="#EF4444" />}
        </View>
        <Text className={`text-lg font-bold mb-1 ${passed ? "text-green-600" : "text-red-500"}`}>
          {passed ? "Quiz Submitted Successfully 🎉" : "Quiz Failed"}
        </Text>
        <Text className={`text-4xl font-bold ${passed ? "text-green-500" : "text-red-500"}`}>{score}%</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {correct}/{total} correct · need {Math.round(passMark * 100)}%
        </Text>
        {passed && (
          <View className="flex-row items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2 mt-3">
            <Text className="text-base">⚡</Text>
            <Text className="font-bold text-amber-600 dark:text-amber-400">+{xpReward} XP earned</Text>
          </View>
        )}
      </View>

      {passed ? (
        <Button label="Claim Reward 🎉" onPress={onPassed} variant="accent" fullWidth size="lg" className="mt-5" />
      ) : (
        <View className="mt-5">
          {/* Weak areas */}
          {wrong.length > 0 && (
            <View className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <AlertTriangle size={16} color="#F59E0B" />
                <Text className="text-sm font-bold text-amber-700 dark:text-amber-300">Topics to review</Text>
              </View>
              {wrong.slice(0, 3).map((w, i) => (
                <Text key={i} className="text-xs text-amber-700 dark:text-amber-300 mb-1">
                  • {w.question}
                </Text>
              ))}
              {lessonTitles.length > 0 && (
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Recommended: revisit “{lessonTitles[0]}” and run a revision session.
                </Text>
              )}
            </View>
          )}

          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center mb-3">
            Almost there — review the lesson and try again. 💪
          </Text>

          <Button
            label={adLoading ? "Loading ad…" : "Watch Rewarded Ad & Retry Now"}
            onPress={adRetry}
            loading={adLoading}
            variant="accent"
            fullWidth
            size="lg"
          />
          <View className="flex-row items-center justify-center gap-1.5 mt-3">
            <Clock size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-400">
              {cooldown
                ? `3 attempts used — or try again in ${fmtCountdown(availableInMs)}`
                : `Or try again later (${fmtCountdown(availableInMs)}) · ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} before a longer wait`}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity onPress={onExit} className="items-center mt-3">
        <Text className="text-sm text-gray-500">Back to chapter</Text>
      </TouchableOpacity>
    </View>
  );
}
