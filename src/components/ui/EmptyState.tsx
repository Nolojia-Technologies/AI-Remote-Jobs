import React from "react";
import { View, Text } from "react-native";
import { Button } from "./Button";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  emoji = "🔍",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-12 px-6 ${className}`}>
      <Text className="text-5xl mb-4">{emoji}</Text>
      <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-6 leading-6">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="primary" />
      )}
    </View>
  );
}
