import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react-native";
import { useAuthStore } from "../../../src/stores/authStore";
import { useUserStore } from "../../../src/stores/userStore";
import { userCourseService } from "../../../src/services/userCourseService";
import { Quiz, Question } from "../../../src/types/content.types";
import { Button } from "../../../src/components/ui/Button";
import { LoadingSpinner } from "../../../src/components/ui/LoadingSpinner";
import { EmptyState } from "../../../src/components/ui/EmptyState";

const norm = (s: string) => (s || "").trim().toLowerCase();

export default function QuizPlayer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { awardXP } = useUserStore();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ score: number; correct: number; passed: boolean } | null>(null);

  useEffect(() => {
    userCourseService
      .getQuiz(id as string)
      .then((r) => {
        if (r) {
          setQuiz(r.quiz);
          setQuestions(r.questions);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isCorrect = (q: Question, a: string) => {
    if (q.type === "fill_blank") return norm(a) === norm(q.answer) || (norm(a).length > 0 && norm(q.answer).includes(norm(a)));
    return a === q.answer;
  };

  const submit = async () => {
    if (!quiz) return;
    const correct = questions.filter((q, i) => isCorrect(q, answers[i] ?? "")).length;
    const score = Math.round((correct / Math.max(1, questions.length)) * 100);
    const passed = score >= quiz.passing_score;
    setResult({ score, correct, passed });
    if (passed && user) {
      await awardXP(user.id, quiz.xp_reward || 50, "quiz_pass", `Quiz: ${quiz.title}`);
      // Persist the pass so the course screen can unlock the next chapter.
      await userCourseService.markQuizPassed(user.id, quiz.course_id, quiz, score).catch(() => {});
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading quiz..." />;
  if (!quiz) return <EmptyState emoji="🚫" title="Quiz not found" description="It may have been removed." />;

  const answeredAll = questions.length > 0 && questions.every((_, i) => (answers[i] ?? "") !== "");

  if (result) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950 items-center justify-center px-8" edges={["top"]}>
        <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${result.passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
          {result.passed ? <CheckCircle2 size={40} color="#22C55E" /> : <XCircle size={40} color="#EF4444" />}
        </View>
        <Text className={`text-2xl font-bold mb-1 ${result.passed ? "text-green-600" : "text-red-500"}`}>{result.passed ? "Passed! 🎉" : "Not quite"}</Text>
        <Text className="text-5xl font-bold text-gray-900 dark:text-white my-2">{result.score}%</Text>
        <Text className="text-sm text-gray-500 mb-1">{result.correct}/{questions.length} correct · need {quiz.passing_score}%</Text>
        {result.passed && <Text className="font-bold text-amber-600 mb-4">+{quiz.xp_reward} XP</Text>}
        <View className="w-full mt-4">
          {result.passed ? (
            <Button label="Done" onPress={() => router.back()} fullWidth size="lg" />
          ) : (
            <Button label="Try Again" onPress={() => { setResult(null); setAnswers({}); }} fullWidth size="lg" />
          )}
          <TouchableOpacity onPress={() => router.back()} className="items-center mt-3"><Text className="text-gray-500">Back to course</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <View className="px-4 py-3 flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>{quiz.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text className="text-xs text-gray-400 mb-3">{questions.length} questions · pass {quiz.passing_score}%</Text>
        {questions.map((q, qi) => (
          <View key={q.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-gray-700">
            <Text className="text-sm font-bold text-gray-900 dark:text-white mb-3">{qi + 1}. {q.prompt}</Text>
            {q.type === "fill_blank" ? (
              <TextInput
                value={answers[qi] ?? ""}
                onChangeText={(v) => setAnswers((a) => ({ ...a, [qi]: v }))}
                placeholder="Type your answer…"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
              />
            ) : (
              q.options.map((opt) => {
                const selected = answers[qi] === opt;
                return (
                  <TouchableOpacity key={opt} onPress={() => setAnswers((a) => ({ ...a, [qi]: opt }))} className={`p-3 rounded-xl border-2 mb-2 ${selected ? "bg-primary-50 dark:bg-primary-900/20 border-primary" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                    <Text className="text-sm text-gray-700 dark:text-gray-300">{opt}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ))}
        <Button label="Submit Quiz" onPress={submit} disabled={!answeredAll} fullWidth size="lg" className="mt-2" />
      </ScrollView>
    </SafeAreaView>
  );
}
