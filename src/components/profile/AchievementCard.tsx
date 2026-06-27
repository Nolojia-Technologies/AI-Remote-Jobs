import React from "react";
import { View, Text } from "react-native";
import { AchievementWithStatus } from "../../types/app.types";
import { format } from "date-fns";

interface AchievementCardProps {
  achievement: AchievementWithStatus;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const isEarned = achievement.isEarned;

  return (
    <View
      className={`items-center p-4 rounded-2xl w-[30%] ${
        isEarned
          ? "bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-700"
          : "bg-gray-100 dark:bg-gray-900 opacity-50"
      }`}
    >
      <View
        className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
          isEarned ? "bg-amber-100 dark:bg-amber-900/30" : "bg-gray-200 dark:bg-gray-800"
        }`}
      >
        <Text className="text-2xl">{isEarned ? achievement.icon : "🔒"}</Text>
      </View>
      <Text
        className={`text-xs font-bold text-center mb-1 ${
          isEarned ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"
        }`}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
      {isEarned && achievement.earnedAt && (
        <Text className="text-xs text-gray-400 text-center">
          {format(new Date(achievement.earnedAt), "MMM d")}
        </Text>
      )}
      {!isEarned && (
        <Text className="text-xs text-gray-400 text-center" numberOfLines={1}>
          {achievement.description.substring(0, 20)}...
        </Text>
      )}
    </View>
  );
}
