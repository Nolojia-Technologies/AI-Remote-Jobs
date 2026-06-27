import React from "react";
import { View, Text } from "react-native";
import { Target } from "lucide-react-native";

interface MatchScoreBadgeProps {
  score: number;
  reasons?: string[];
  size?: "sm" | "lg";
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export function MatchScoreBadge({ score, reasons, size = "lg" }: MatchScoreBadgeProps) {
  const color = scoreColor(score);

  if (size === "sm") {
    return (
      <View
        className="flex-row items-center gap-1 rounded-lg px-2 py-1"
        style={{ backgroundColor: color + "20" }}
      >
        <Target size={12} color={color} />
        <Text className="text-xs font-bold" style={{ color }}>
          {score}% Match
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center gap-3 mb-2">
        <View
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Text className="text-lg font-bold" style={{ color }}>
            {score}%
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 dark:text-white">Job Match</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            How well you fit this role
          </Text>
        </View>
      </View>

      {reasons && reasons.length > 0 && (
        <View className="gap-1 mt-1">
          {reasons.map((r) => (
            <View key={r} className="flex-row items-center gap-1.5">
              <Text className="text-green-500 text-xs">✓</Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400">{r}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
