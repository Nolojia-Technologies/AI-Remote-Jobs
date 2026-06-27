import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";

interface StreakBadgeProps {
  days: number;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { emoji: 14, text: "text-xs", container: "px-2 py-1" },
  md: { emoji: 16, text: "text-sm", container: "px-3 py-1.5" },
  lg: { emoji: 20, text: "text-base", container: "px-4 py-2" },
};

export function StreakBadge({ days, size = "md", animate = false, className = "" }: StreakBadgeProps) {
  const { text, container } = sizeMap[size];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animate && days > 0) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      loopRef.current.start();
    }
    return () => loopRef.current?.stop();
  }, [animate, days]);

  const isHot = days >= 7;
  const bgColor = isHot
    ? "bg-red-100 dark:bg-red-900/30"
    : "bg-orange-100 dark:bg-orange-900/30";
  const textColor = isHot
    ? "text-red-600 dark:text-red-400"
    : "text-orange-600 dark:text-orange-400";

  return (
    <Animated.View
      className={`flex-row items-center rounded-xl gap-1 ${bgColor} ${container} ${className}`}
      style={{ transform: [{ scale: scaleAnim }] }}
    >
      <Text style={{ fontSize: sizeMap[size].emoji }}>🔥</Text>
      <Text className={`font-bold ${textColor} ${text}`}>
        {days} {days === 1 ? "day" : "days"}
      </Text>
    </Animated.View>
  );
}
