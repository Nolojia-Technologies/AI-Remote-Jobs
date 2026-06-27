import React, { useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useGamificationStore } from "../../src/stores/gamificationStore";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { AchievementWithStatus } from "../../src/types/app.types";
import { format } from "date-fns";

function AchievementItem({ achievement }: { achievement: AchievementWithStatus }) {
  return (
    <View
      className={`flex-row items-center p-4 mb-3 rounded-2xl ${
        achievement.isEarned
          ? "bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-700"
          : "bg-gray-100 dark:bg-gray-900 opacity-60"
      }`}
    >
      <View
        className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${
          achievement.isEarned
            ? "bg-amber-100 dark:bg-amber-900/30"
            : "bg-gray-200 dark:bg-gray-800"
        }`}
      >
        <Text className="text-3xl">
          {achievement.isEarned ? achievement.icon : "🔒"}
        </Text>
      </View>

      <View className="flex-1">
        <Text
          className={`text-base font-bold mb-0.5 ${
            achievement.isEarned
              ? "text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-600"
          }`}
        >
          {achievement.title}
        </Text>
        <Text
          className="text-sm text-gray-500 dark:text-gray-400 mb-1"
          numberOfLines={2}
        >
          {achievement.description}
        </Text>
        {achievement.isEarned && achievement.earnedAt ? (
          <Text className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
            ✓ Earned {format(new Date(achievement.earnedAt), "MMM d, yyyy")}
          </Text>
        ) : (
          <Text className="text-xs text-gray-400 dark:text-gray-600">
            +{achievement.xp_reward} XP when unlocked
          </Text>
        )}
      </View>

      {achievement.isEarned && (
        <Text className="text-2xl ml-2">⭐</Text>
      )}
    </View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { achievements, fetchAchievements, isLoadingAchievements } = useGamificationStore();

  useEffect(() => {
    if (user) fetchAchievements(user.id);
  }, [user]);

  if (isLoadingAchievements && achievements.length === 0) {
    return <LoadingSpinner fullScreen message="Loading achievements..." />;
  }

  const earned = achievements.filter((a) => a.isEarned);
  const locked = achievements.filter((a) => !a.isEarned);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-4 flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
        >
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Achievements 🏅
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {earned.length}/{achievements.length} earned
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {achievements.length === 0 ? (
          <EmptyState
            emoji="🏅"
            title="Start Earning Achievements"
            description="Complete lessons, challenges, and reach milestones to unlock achievements."
          />
        ) : (
          <>
            {earned.length > 0 && (
              <>
                <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
                  Earned ({earned.length}) ⭐
                </Text>
                {earned.map((a) => (
                  <AchievementItem key={a.id} achievement={a} />
                ))}
              </>
            )}

            {locked.length > 0 && (
              <>
                <Text className="text-base font-bold text-gray-700 dark:text-gray-400 mb-3 mt-2">
                  Locked ({locked.length}) 🔒
                </Text>
                {locked.map((a) => (
                  <AchievementItem key={a.id} achievement={a} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
