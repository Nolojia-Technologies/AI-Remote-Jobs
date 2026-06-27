import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = "large",
  color = "#2563EB",
  message,
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  const containerClass = fullScreen
    ? "flex-1 items-center justify-center bg-white dark:bg-gray-950"
    : `items-center justify-center py-8 ${className}`;

  return (
    <View className={containerClass}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
          {message}
        </Text>
      )}
    </View>
  );
}
