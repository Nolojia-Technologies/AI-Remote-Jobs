import React from "react";
import { View, Text } from "react-native";
import { Zap } from "lucide-react-native";

interface XPIndicatorProps {
  xp: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 12, text: "text-xs", container: "px-2 py-1 gap-1" },
  md: { icon: 14, text: "text-sm", container: "px-2.5 py-1.5 gap-1" },
  lg: { icon: 18, text: "text-base", container: "px-3 py-2 gap-1.5" },
};

export function XPIndicator({ xp, size = "md", showLabel = false, className = "" }: XPIndicatorProps) {
  const { icon, text, container } = sizeMap[size];

  return (
    <View
      className={`flex-row items-center bg-amber-100 dark:bg-amber-900/30 rounded-xl ${container} ${className}`}
    >
      <Zap size={icon} color="#F59E0B" fill="#F59E0B" />
      <Text className={`font-bold text-amber-600 dark:text-amber-400 ${text}`}>
        {xp.toLocaleString()}
        {showLabel ? " XP" : ""}
      </Text>
    </View>
  );
}
