import React from "react";
import { View, Text } from "react-native";
import { LEVEL_TITLES, getLevelInfo } from "../../constants/xp";
import { Colors } from "../../constants/colors";

interface LevelBadgeProps {
  level: number;
  xp?: number;
  showTitle?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { text: "text-xs", badge: "w-7 h-7" },
  md: { text: "text-sm", badge: "w-9 h-9" },
  lg: { text: "text-base", badge: "w-12 h-12" },
};

export function LevelBadge({ level, xp, showTitle = false, size = "md", className = "" }: LevelBadgeProps) {
  const { text, badge } = sizeMap[size];
  const colorIndex = Math.min(level - 1, Colors.levelColors.length - 1);
  const color = Colors.levelColors[colorIndex];
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      <View
        className={`${badge} rounded-full items-center justify-center`}
        style={{ backgroundColor: color + "20", borderWidth: 2, borderColor: color }}
      >
        <Text className={`font-bold ${text}`} style={{ color }}>
          {level}
        </Text>
      </View>
      {showTitle && (
        <Text className={`font-semibold text-gray-700 dark:text-gray-300 ${text}`}>
          {title}
        </Text>
      )}
    </View>
  );
}
