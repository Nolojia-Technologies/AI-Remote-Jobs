import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Clock, Zap, CheckCircle2, XCircle } from "lucide-react-native";
import { supabase } from "../../src/lib/supabase";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { QuizQuestion } from "../../src/components/quiz/QuizQuestion";
import { Button } from "../../src/components/ui/Button";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import {
  ParsedQuizQuestion,
  Quiz,
} from "../../src/types/app.types";
import { XP_REWARDS } from "../../src/constants/xp";
import { logEvent, AnalyticsEvents } from "../../src/lib/analytics";

type QuizPhase = "intro" | "question" | "review" | "result";

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { awardXP } = useUserStore();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<ParsedQuizQuestion[]>([]);
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadQuiz();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id]);

  useEffect(() => {
    if (phase === "question" && quiz?.time_limit_seconds) {
      setTimeLeft(quiz.time_limit_seconds);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            submitQuiz();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const loadQuiz = async () => {
    const [quizRes, questionsRes] = await Promise.all([
      (supabase.from("quizzes") as any).select("*").eq("id", id as string).single(),
      (supabase.from("quiz_questions") as any)
        .select("*")
        .eq("quiz_id", id as string)
        .order("order_index"),
    ]);
    if (quizRes.data) {
      setQuiz(quizRes.data as Quiz);
    }
    if (questionsRes.data) {
      setQuestions(
        (questionsRes.data as any[]).map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
        }))
      );
    }
    setIsLoading(false);
  };

  const handleAnswer = (answer: string) => {
    const current = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("result");

    const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length;
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= (quiz?.pass_score ?? 80);

    if (user) {
      await supabase.from("user_quiz_results").insert({
        user_id: user.id,
        quiz_id: id as string,
        score,
        passed,
        answers: JSON.stringify(answers),
      } as any);

      if (passed) {
        await awardXP(user.id, XP_REWARDS.QUIZ_PASS, "quiz_pass", `Quiz: ${quiz?.title}`);
      }

      logEvent(AnalyticsEvents.QUIZ_COMPLETE, {
        quiz_id: id,
        score,
        passed,
      });
    }
  };

  const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length;
  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const passed = score >= (quiz?.pass_score ?? 80);
  const currentQ = questions[currentIndex];

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (isLoading) return <LoadingSpinner fullScreen message="Loading quiz..." />;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => {
            if (phase === "result") { router.back(); return; }
            Alert.alert("Exit Quiz?", "Your progress will be lost.", [
              { text: "Cancel", style: "cancel" },
              { text: "Exit", style: "destructive", onPress: () => router.back() },
            ]);
          }}
          className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mr-3"
        >
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {quiz?.title ?? "Quiz"}
          </Text>
        </View>
        {phase === "question" && quiz?.time_limit_seconds && (
          <View className="flex-row items-center gap-1 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-1.5">
            <Clock size={14} color="#EF4444" />
            <Text className="text-red-500 font-bold text-sm">{formatTime(timeLeft)}</Text>
          </View>
        )}
      </View>

      {phase === "intro" && (
        <View className="flex-1 px-6 justify-center items-center">
          <Text className="text-5xl mb-4">🧠</Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
            {quiz?.title}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-6">
            {quiz?.description}
          </Text>
          <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 w-full mb-8 gap-3">
            {[
              { label: "Questions", value: questions.length },
              { label: "Pass Score", value: `${quiz?.pass_score}%` },
              { label: "Time Limit", value: quiz?.time_limit_seconds ? formatTime(quiz.time_limit_seconds) : "No limit" },
              { label: "XP Reward", value: `+${quiz?.xp_reward} XP` },
            ].map((item) => (
              <View key={item.label} className="flex-row justify-between">
                <Text className="text-gray-500 dark:text-gray-400">{item.label}</Text>
                <Text className="font-bold text-gray-900 dark:text-white">{item.value}</Text>
              </View>
            ))}
          </View>
          <Button label="Start Quiz →" onPress={() => setPhase("question")} fullWidth size="lg" />
        </View>
      )}

      {phase === "question" && currentQ && (
        <View className="flex-1 px-5 pt-5 pb-6">
          <ProgressBar
            progress={((currentIndex + 1) / questions.length) * 100}
            height={6}
            color="#2563EB"
            className="mb-5"
          />
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <QuizQuestion
              question={currentQ}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQ.id]}
              showResult={false}
              onAnswer={handleAnswer}
            />
          </ScrollView>
          <View className="pt-4">
            <Button
              label={currentIndex < questions.length - 1 ? "Next →" : "Finish Quiz"}
              onPress={handleNext}
              disabled={!answers[currentQ.id]}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      )}

      {phase === "result" && (
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className={`w-24 h-24 rounded-full items-center justify-center mb-4 ${
              passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
            }`}
          >
            {passed ? (
              <CheckCircle2 size={48} color="#22C55E" />
            ) : (
              <XCircle size={48} color="#EF4444" />
            )}
          </View>

          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {passed ? "You Passed! 🎉" : "Try Again 💪"}
          </Text>
          <Text className={`text-5xl font-bold mb-1 ${passed ? "text-green-500" : "text-red-500"}`}>
            {score}%
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mb-6">
            {correct}/{questions.length} correct answers
          </Text>

          {passed && (
            <View className="flex-row items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-2xl px-4 py-3 mb-6">
              <Zap size={18} color="#F59E0B" fill="#F59E0B" />
              <Text className="font-bold text-amber-600 dark:text-amber-400">
                +{quiz?.xp_reward} XP Earned!
              </Text>
            </View>
          )}

          {/* Review answers */}
          <Text className="text-base font-bold text-gray-900 dark:text-white mb-3 self-start">
            Review Answers
          </Text>
          {questions.map((q, i) => (
            <View key={q.id} className="w-full mb-4">
              <QuizQuestion
                question={q}
                questionNumber={i + 1}
                totalQuestions={questions.length}
                selectedAnswer={answers[q.id]}
                showResult
                onAnswer={() => {}}
              />
            </View>
          ))}

          <Button
            label={passed ? "Back to Learning" : "Try Again"}
            onPress={() => {
              if (passed) { router.back(); }
              else {
                setAnswers({});
                setCurrentIndex(0);
                setPhase("intro");
              }
            }}
            fullWidth
            size="lg"
            className="mt-4"
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
