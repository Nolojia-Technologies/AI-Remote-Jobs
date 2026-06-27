import React, { useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useAuthStore } from "../src/stores/authStore";
import { useGamificationStore } from "../src/stores/gamificationStore";
import { LeaderboardItem } from "../src/components/leaderboard/LeaderboardItem";
import { LoadingSpinner } from "../src/components/ui/LoadingSpinner";
import { EmptyState } from "../src/components/ui/EmptyState";
import { NativeAdCard } from "../src/components/ads/NativeAdCard";
import { withNativeAdAfter, isNativeAdSlot } from "../src/ads/nativeAdSlots";
import { LeaderboardTab } from "../src/types/app.types";

const TABS: { id: LeaderboardTab; label: string; emoji: string }[] = [
  { id: "global", label: "Global", emoji: "🌍" },
  { id: "kenya", label: "Kenya", emoji: "🇰🇪" },
  { id: "qatar", label: "Qatar", emoji: "🇶🇦" },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    leaderboard,
    leaderboardTab,
    fetchLeaderboard,
    setLeaderboardTab,
    isLoadingLeaderboard,
  } = useGamificationStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const loadLeaderboard = async (tab: LeaderboardTab) => {
    if (!user) return;
    await fetchLeaderboard(tab, user.id);
  };

  useEffect(() => {
    loadLeaderboard(leaderboardTab);
  }, [leaderboardTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard(leaderboardTab);
    setRefreshing(false);
  };

  const currentUser = leaderboard.find((e) => e.isCurrentUser);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-4">
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Leaderboard 🏆
          </Text>
        </View>
        <Text className="text-gray-500 dark:text-gray-400 mb-4">
          Compete with learners worldwide. Weekly reset every Monday.
        </Text>

        {/* My Rank Card */}
        {currentUser && (
          <View className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-2xl p-3 flex-row items-center justify-between mb-4">
            <Text className="text-sm font-semibold text-primary dark:text-primary-400">
              Your Rank: #{currentUser.rank}
            </Text>
            <Text className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {currentUser.xp.toLocaleString()} XP
            </Text>
          </View>
        )}

        {/* Tab Switcher */}
        <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setLeaderboardTab(tab.id)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
                leaderboardTab === tab.id ? "bg-white dark:bg-gray-700 shadow-sm" : ""
              }`}
              activeOpacity={0.75}
            >
              <Text className="text-sm">{tab.emoji}</Text>
              <Text
                className={`text-sm font-semibold ${
                  leaderboardTab === tab.id
                    ? "text-primary"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoadingLeaderboard && leaderboard.length === 0 ? (
        <LoadingSpinner message="Loading leaderboard..." />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
        >
          {leaderboard.length === 0 ? (
            <EmptyState
              emoji="🏆"
              title="No Rankings Yet"
              description="Be the first to earn XP and claim the top spot!"
            />
          ) : (
            withNativeAdAfter(leaderboard, 10).map((entry) =>
              isNativeAdSlot(entry) ? (
                <NativeAdCard key={entry.key} />
              ) : (
                <LeaderboardItem key={entry.user_id} entry={entry} isCurrentUser={entry.isCurrentUser} />
              )
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
