import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Job } from "../../types/jobs.types";
import { getDailyHighlights } from "../../lib/socialProof";

export function DailyHighlights({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const highlights = getDailyHighlights(jobs);

  if (highlights.length === 0) return null;

  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 dark:text-white px-5 mb-3">
        📊 Daily Highlights
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {highlights.map((h, i) => (
          <TouchableOpacity
            key={`${h.label}-${i}`}
            activeOpacity={0.85}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/job/${h.job.id}` as any);
            }}
            style={{ width: 180, borderTopColor: h.color, borderTopWidth: 3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700"
          >
            <Text className="text-xs font-bold uppercase mb-2" style={{ color: h.color }}>
              {h.emoji} {h.label}
            </Text>
            <Text className="text-sm font-bold text-gray-900 dark:text-white mb-1" numberOfLines={2}>
              {h.job.title}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
              {h.job.company} · {h.job.countryFlag}
            </Text>
            <View className="mt-2 self-start rounded-lg px-2 py-1" style={{ backgroundColor: h.color + "1A" }}>
              <Text className="text-xs font-bold" style={{ color: h.color }}>
                {h.metric}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
