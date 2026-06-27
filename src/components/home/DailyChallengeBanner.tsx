import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Zap, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { ChallengeWithStatus } from "../../types/app.types";

interface DailyChallengeBannerProps {
  challenge?: ChallengeWithStatus;
  completedToday?: boolean;
}

export function DailyChallengeBanner({ challenge, completedToday }: DailyChallengeBannerProps) {
  const router = useRouter();

  if (!challenge) return null;

  const hoursLeft = challenge.timeRemaining
    ? Math.floor(challenge.timeRemaining / 3600000)
    : 0;

  return (
    <TouchableOpacity
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/challenge/${challenge.id}` as any);
      }}
      activeOpacity={0.8}
      className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-base">⚡</Text>
            <Text className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Daily Challenge
            </Text>
            {completedToday && (
              <View className="bg-green-100 dark:bg-green-900/30 rounded-full px-2 py-0.5">
                <Text className="text-xs font-bold text-green-600 dark:text-green-400">✓ Done</Text>
              </View>
            )}
          </View>
          <Text
            className="text-base font-bold text-gray-900 dark:text-white"
            numberOfLines={1}
          >
            {challenge.title}
          </Text>
          <View className="flex-row items-center gap-3 mt-1">
            <View className="flex-row items-center gap-1">
              <Zap size={12} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                +{challenge.xp_reward} XP
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#94A3B8" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {hoursLeft}h left
              </Text>
            </View>
          </View>
        </View>
        <View className="bg-amber-500 rounded-xl px-3 py-2 ml-3">
          <Text className="text-white font-bold text-sm">
            {completedToday ? "View" : "Start"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
