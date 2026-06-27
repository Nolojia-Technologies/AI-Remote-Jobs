import React, { useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Flame } from "lucide-react-native";
import { useAuthStore } from "../src/stores/authStore";
import { useUserStore } from "../src/stores/userStore";
import { useRevisionStore } from "../src/stores/revisionStore";
import { CalendarGrid } from "../src/components/revision/CalendarGrid";
import { WeeklyReport } from "../src/components/revision/WeeklyReport";

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const revision = useRevisionStore();

  useEffect(() => {
    if (user && !revision.hydrated) revision.hydrate(user.id);
  }, [user]);

  const activeDays = Object.keys(revision.history).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
        >
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Learning Calendar 📅</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Streak summary */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 items-center border border-gray-100 dark:border-gray-700">
            <Flame size={20} color="#EF4444" />
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{profile?.streak_days ?? 0}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Day Streak</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 items-center border border-gray-100 dark:border-gray-700">
            <Text className="text-xl">🔁</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{revision.revisionStreak}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Review Streak</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 items-center border border-gray-100 dark:border-gray-700">
            <Text className="text-xl">📆</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{activeDays}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Active Days</Text>
          </View>
        </View>

        <View className="mb-5">
          <CalendarGrid history={revision.history} />
        </View>

        <WeeklyReport history={revision.history} />
      </ScrollView>
    </SafeAreaView>
  );
}
