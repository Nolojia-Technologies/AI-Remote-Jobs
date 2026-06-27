import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";

interface ProgressBarProps {
  progress: number; // 0–100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  color = "#2563EB",
  backgroundColor = "#E2E8F0",
  showLabel = false,
  label,
  animated = true,
  className = "",
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: clampedProgress,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // width/layout props cannot use native driver
      }).start();
    } else {
      widthAnim.setValue(clampedProgress);
    }
  }, [clampedProgress]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View className={className}>
      {(showLabel || label) && (
        <View className="flex-row justify-between items-center mb-1">
          {label && (
            <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
          )}
          {showLabel && (
            <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {clampedProgress}%
            </Text>
          )}
        </View>
      )}
      <View
        className="rounded-full overflow-hidden"
        style={{ height, backgroundColor }}
      >
        <Animated.View
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: animatedWidth }}
        />
      </View>
    </View>
  );
}
