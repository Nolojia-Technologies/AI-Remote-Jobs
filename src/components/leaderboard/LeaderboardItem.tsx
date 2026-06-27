import React from "react";
import { View, Text } from "react-native";
import { Avatar } from "../ui/Avatar";
import { XPIndicator } from "../ui/XPIndicator";
import { LevelBadge } from "../ui/LevelBadge";
import { LeaderboardEntry } from "../../types/app.types";

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function LeaderboardItem({ entry, isCurrentUser }: LeaderboardItemProps) {
  const medal = RANK_MEDALS[entry.rank];

  return (
    <View
      className={`flex-row items-center px-4 py-3 mb-2 rounded-2xl ${
        isCurrentUser
          ? "bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-700"
          : "bg-white dark:bg-gray-800"
      }`}
    >
      {/* Rank */}
      <View className="w-10 items-center">
        {medal ? (
          <Text className="text-xl">{medal}</Text>
        ) : (
          <Text
            className={`text-sm font-bold ${
              isCurrentUser ? "text-primary" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            #{entry.rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <Avatar
        uri={entry.avatar_url}
        name={entry.full_name}
        size="sm"
        className="mr-3"
      />

      {/* Name & level */}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className={`text-sm font-bold ${
              isCurrentUser
                ? "text-primary dark:text-primary-400"
                : "text-gray-900 dark:text-white"
            }`}
            numberOfLines={1}
          >
            {entry.full_name}
            {isCurrentUser ? " (You)" : ""}
          </Text>
          {entry.country && (
            <Text className="text-xs text-gray-400">{entry.country === "KE" ? "🇰🇪" : entry.country === "QA" ? "🇶🇦" : "🌍"}</Text>
          )}
        </View>
        <LevelBadge level={entry.level} showTitle={false} size="sm" />
      </View>

      {/* XP */}
      <XPIndicator xp={entry.xp} size="sm" />
    </View>
  );
}
