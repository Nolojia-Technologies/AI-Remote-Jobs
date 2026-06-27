import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2, Clock, Zap, ChevronRight } from "lucide-react-native";
import { Badge } from "../ui/Badge";
import { ChallengeWithStatus } from "../../types/app.types";
import * as Haptics from "expo-haptics";

interface ChallengeCardProps {
  challenge: ChallengeWithStatus;
  onPress: () => void;
}

const difficultyConfig = {
  easy: { badge: "accent" as const, label: "Easy", color: "#22C55E" },
  medium: { badge: "warning" as const, label: "Medium", color: "#F59E0B" },
  hard: { badge: "error" as const, label: "Hard", color: "#EF4444" },
};

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const diff = difficultyConfig[challenge.difficulty];
  const hoursLeft = challenge.timeRemaining
    ? Math.floor(challenge.timeRemaining / 3600000)
    : 0;
  const minutesLeft = challenge.timeRemaining
    ? Math.floor((challenge.timeRemaining % 3600000) / 60000)
    : 0;

  return (
    <TouchableOpacity
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.75}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 border-2 ${
        challenge.isCompleted
          ? "border-green-200 dark:border-green-800"
          : "border-gray-100 dark:border-gray-700"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center ${
            challenge.isCompleted
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-amber-100 dark:bg-amber-900/20"
          }`}
        >
          {challenge.isCompleted ? (
            <CheckCircle2 size={24} color="#22C55E" />
          ) : (
            <Text className="text-2xl">⚡</Text>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1 flex-wrap">
            <Badge label={diff.label} variant={diff.badge} size="xs" />
            <Badge label={challenge.category} variant="gray" size="xs" />
            {challenge.isCompleted && <Badge label="Submitted" variant="accent" size="xs" />}
          </View>

          <Text
            className="text-base font-bold text-gray-900 dark:text-white mb-1"
            numberOfLines={2}
          >
            {challenge.title}
          </Text>

          <Text
            className="text-sm text-gray-500 dark:text-gray-400 mb-2"
            numberOfLines={2}
          >
            {challenge.description}
          </Text>

          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Zap size={12} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                +{challenge.xp_reward} XP
              </Text>
            </View>
            {!challenge.isCompleted && (
              <View className="flex-row items-center gap-1">
                <Clock size={12} color="#EF4444" />
                <Text className="text-xs text-red-500 font-medium">
                  {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`} left
                </Text>
              </View>
            )}
          </View>
        </View>

        <ChevronRight size={18} color="#9CA3AF" className="mt-1" />
      </View>
    </TouchableOpacity>
  );
}
