import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle, Lock, ChevronRight, BookOpen } from "lucide-react-native";
import { ProgressBar } from "../ui/ProgressBar";
import { Badge } from "../ui/Badge";
import { ModuleWithProgress } from "../../types/app.types";
import * as Haptics from "expo-haptics";

interface ModuleCardProps {
  module: ModuleWithProgress;
  isLocked?: boolean;
  onPress: () => void;
}

const levelColors = {
  beginner: { badge: "accent" as const, dot: "bg-green-500" },
  intermediate: { badge: "secondary" as const, dot: "bg-blue-500" },
  advanced: { badge: "error" as const, dot: "bg-red-500" },
};

export function ModuleCard({ module, isLocked = false, onPress }: ModuleCardProps) {
  const isCompleted = module.progressPercent === 100;
  const { badge: badgeVariant } = levelColors[module.level];

  return (
    <TouchableOpacity
      onPress={async () => {
        if (isLocked) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={isLocked ? 1 : 0.75}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 border-2 ${
        isCompleted
          ? "border-green-200 dark:border-green-800"
          : "border-gray-100 dark:border-gray-700"
      } ${isLocked ? "opacity-50" : ""}`}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="bg-primary-100 dark:bg-primary-900/30 rounded-xl p-2.5">
          {isCompleted ? (
            <CheckCircle size={22} color="#22C55E" />
          ) : isLocked ? (
            <Lock size={22} color="#9CA3AF" />
          ) : (
            <BookOpen size={22} color="#2563EB" />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1 flex-wrap">
            <Badge
              label={module.level.charAt(0).toUpperCase() + module.level.slice(1)}
              variant={badgeVariant}
              size="xs"
            />
            {isCompleted && <Badge label="Completed" variant="accent" size="xs" />}
          </View>
          <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {module.title}
          </Text>
          <Text
            className="text-sm text-gray-500 dark:text-gray-400 mb-3"
            numberOfLines={2}
          >
            {module.description}
          </Text>

          <ProgressBar
            progress={module.progressPercent}
            height={6}
            color={isCompleted ? "#22C55E" : "#2563EB"}
            className="mb-2"
          />

          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {module.completedLessons}/{module.totalLessons} lessons • +{module.xp_reward} XP
          </Text>
        </View>

        {!isLocked && (
          <View className="mt-1">
            <ChevronRight size={18} color="#9CA3AF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
