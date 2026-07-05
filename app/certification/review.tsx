import React, { useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, XCircle, ChevronLeft, TrendingUp, TrendingDown, BookOpen } from "lucide-react-native";
import { useCertificationStore } from "../../src/stores/certificationStore";

export default function CertificationReview() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { review, loadReview } = useCertificationStore();

  useEffect(() => { if (id) loadReview(String(id)); }, [id]);

  if (!review) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <View className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <TouchableOpacity onPress={() => router.back()} className="p-1"><ChevronLeft size={24} color="#6B7280" /></TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Review</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Topic insights */}
        <View className="flex-row gap-3 mb-5">
          <TopicCard tone="green" icon={TrendingUp} title="Strongest" topics={review.strong_topics} />
          <TopicCard tone="red" icon={TrendingDown} title="Needs work" topics={review.weak_topics} />
        </View>

        {review.weak_topics.length > 0 && (
          <TouchableOpacity onPress={() => router.push("/(tabs)/learn" as any)} className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-4 flex-row items-center gap-3 mb-5">
            <BookOpen size={20} color="#2563EB" />
            <Text className="flex-1 text-sm text-blue-700 dark:text-blue-300">Revisit lessons on your weak topics, then try again.</Text>
          </TouchableOpacity>
        )}

        {review.questions.map((q, i) => (
          <View key={q.question_id} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 mb-3">
            <View className="flex-row items-start gap-2 mb-2">
              {q.is_correct ? <CheckCircle2 size={20} color="#22C55E" /> : <XCircle size={20} color="#EF4444" />}
              <Text className="flex-1 text-base font-semibold text-gray-900 dark:text-white">{i + 1}. {q.prompt}</Text>
            </View>
            <View className="gap-1.5 mt-1">
              {q.options.map((opt) => {
                const isCorrect = opt === q.correct_answer;
                const isChosen = opt === q.selected_answer;
                return (
                  <View
                    key={opt}
                    className={`rounded-xl px-3 py-2 border ${
                      isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : isChosen ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Text className={`text-sm ${isCorrect ? "text-green-700 dark:text-green-300 font-semibold" : isChosen ? "text-red-600 dark:text-red-300" : "text-gray-600 dark:text-gray-400"}`}>
                      {opt}{isCorrect ? "  ✓" : isChosen ? "  ✗" : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
            {q.explanation ? (
              <View className="mt-2 rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <Text className="text-xs text-gray-500 dark:text-gray-400">{q.explanation}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function TopicCard({ tone, icon: Icon, title, topics }: { tone: "green" | "red"; icon: any; title: string; topics: string[] }) {
  const color = tone === "green" ? "#22C55E" : "#EF4444";
  return (
    <View className="flex-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4">
      <View className="flex-row items-center gap-1.5 mb-2">
        <Icon size={16} color={color} />
        <Text className="text-sm font-bold text-gray-900 dark:text-white">{title}</Text>
      </View>
      {topics.length === 0 ? (
        <Text className="text-xs text-gray-400">—</Text>
      ) : (
        topics.slice(0, 3).map((t) => <Text key={t} className="text-xs text-gray-500 dark:text-gray-400">• {t}</Text>)
      )}
    </View>
  );
}
