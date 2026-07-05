import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react-native";
import { useCertificationStore } from "../../src/stores/certificationStore";
import { useCertTimer, formatClock } from "../../src/certification/useCertTimer";
import { ProgressBar } from "../../src/components/ui/ProgressBar";

export default function CertificationQuiz() {
  const router = useRouter();
  const { activeAttempt, resumeActive, saveAnswer, submit } = useCertificationStore();
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(!activeAttempt);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Ensure there is an attempt to run (resume after app close / deep link).
  useEffect(() => {
    if (activeAttempt) { setLoading(false); return; }
    (async () => {
      const a = await resumeActive();
      setLoading(false);
      if (!a) router.replace("/certification" as any);
    })();
  }, []);

  async function doSubmit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const result = await submit();
    setSubmitting(false);
    if (result) router.replace("/certification/result" as any);
    else {
      submittedRef.current = false;
      Alert.alert("Submit failed", "Check your connection and try again.");
    }
    if (auto) {
      // no-op; result screen explains expiry
    }
  }

  const remaining = useCertTimer(activeAttempt?.expires_at, () => doSubmit(true));

  if (loading || !activeAttempt) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator color="#2563EB" />
      </SafeAreaView>
    );
  }

  const questions = activeAttempt.questions;
  const q = questions[index];
  const answeredCount = questions.filter((x) => x.selected_answer != null).length;
  const lowTime = remaining <= 60;

  function choose(option: string) {
    void saveAnswer(q.id, option);
  }

  function confirmSubmit() {
    const unanswered = questions.length - answeredCount;
    Alert.alert(
      "Submit certification?",
      unanswered > 0
        ? `You have ${unanswered} unanswered question(s). Unanswered questions are marked incorrect.`
        : "Submit your answers for grading?",
      [
        { text: "Keep going", style: "cancel" },
        { text: "Submit", style: "destructive", onPress: () => doSubmit(false) },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      {/* Timer header */}
      <View className="px-5 pt-2 pb-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <View className="flex-row items-center justify-between mb-2">
          <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${lowTime ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-50 dark:bg-blue-900/20"}`}>
            <Clock size={16} color={lowTime ? "#EF4444" : "#2563EB"} />
            <Text className={`font-bold ${lowTime ? "text-red-600" : "text-blue-600 dark:text-blue-300"}`}>{formatClock(remaining)}</Text>
          </View>
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {index + 1} / {questions.length} · {answeredCount} answered
          </Text>
        </View>
        <ProgressBar progress={((index + 1) / questions.length) * 100} height={6} color="#2563EB" backgroundColor="#E5E7EB" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Question {index + 1}</Text>
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-5">{q.prompt}</Text>

        <View className="gap-3">
          {q.options.map((opt) => {
            const selected = q.selected_answer === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => choose(opt)}
                activeOpacity={0.85}
                className={`flex-row items-center gap-3 rounded-2xl border-2 p-4 ${
                  selected ? "border-primary bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                }`}
              >
                {selected ? <CheckCircle2 size={22} color="#2563EB" /> : <Circle size={22} color="#9CA3AF" />}
                <Text className={`flex-1 text-base ${selected ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Nav footer */}
      <View className="flex-row items-center gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <TouchableOpacity
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className={`h-12 w-12 items-center justify-center rounded-2xl ${index === 0 ? "bg-gray-100 dark:bg-gray-800" : "bg-gray-200 dark:bg-gray-700"}`}
        >
          <ChevronLeft size={22} color="#6B7280" />
        </TouchableOpacity>

        {index < questions.length - 1 ? (
          <TouchableOpacity onPress={() => setIndex((i) => Math.min(questions.length - 1, i + 1))} className="flex-1 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary">
            <Text className="text-white font-bold">Next</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={confirmSubmit} disabled={submitting} className="flex-1 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-green-600">
            <Text className="text-white font-bold">{submitting ? "Submitting…" : "Submit certification"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
