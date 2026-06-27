import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  rightAction,
  className = "",
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`bg-white dark:bg-gray-950 px-4 pb-4 border-b border-gray-100 dark:border-gray-800 ${className}`}
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between">
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}

        <View className="flex-1 items-center px-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View className="w-10 items-end">{rightAction}</View>
      </View>
    </View>
  );
}
