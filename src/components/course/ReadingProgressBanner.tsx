import React from "react";
import { View, Text } from "react-native";
import { BookOpen } from "lucide-react-native";
import { ProgressBar } from "../ui/ProgressBar";
import { secondsToMinutes } from "../../lib/readingTime";

/**
 * "Continue reading" banner — encouraging progress readout (time spent, content
 * viewed, est. remaining) shown above the lesson content.
 */
export function ReadingProgressBanner({
  timeSpent,
  requiredMinutes,
  scrollPct,
  remainingSeconds,
}: {
  timeSpent: number;
  requiredMinutes: number;
  scrollPct: number;
  remainingSeconds: number;
}) {
  const spentMin = secondsToMinutes(timeSpent);
  const remainingMin = Math.ceil(remainingSeconds / 60);

  return (
    <View className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 mb-5 border border-primary-100 dark:border-primary-900/40">
      <View className="flex-row items-center gap-2 mb-3">
        <BookOpen size={16} color="#2563EB" />
        <Text className="text-sm font-bold text-primary">Reading Progress</Text>
        <Text className="ml-auto text-xs font-semibold text-gray-500 dark:text-gray-400">
          You've read {scrollPct}%
        </Text>
      </View>

      <ProgressBar progress={scrollPct} height={8} color="#2563EB" animated={false} />

      <View className="flex-row justify-between mt-3">
        <Stat label="Time spent" value={`${spentMin} / ${requiredMinutes} min`} />
        <Stat label="Content viewed" value={`${scrollPct}%`} />
        <Stat label="Time remaining" value={remainingSeconds <= 0 ? "Done" : `${remainingMin} min`} align="right" />
      </View>
    </View>
  );
}

function Stat({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <View className={align === "right" ? "items-end" : "items-start"}>
      <Text className="text-[11px] text-gray-400">{label}</Text>
      <Text className="text-sm font-bold text-gray-800 dark:text-gray-100">{value}</Text>
    </View>
  );
}
