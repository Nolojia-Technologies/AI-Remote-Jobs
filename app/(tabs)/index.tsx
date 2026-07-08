import React, { useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useGamificationStore } from "../../src/stores/gamificationStore";
import { useJobStore } from "../../src/stores/jobStore";
import { DashboardStats } from "../../src/components/home/DashboardStats";
import { QuickActions } from "../../src/components/home/QuickActions";
import { DailyXpSpin } from "../../src/components/home/DailyXpSpin";
import { MotivationalCard } from "../../src/components/home/MotivationalCard";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { HomeJobsCard } from "../../src/components/home/HomeJobsCard";
import { RevisionCenterCard } from "../../src/components/revision/RevisionCenterCard";
import { useRevisionStore } from "../../src/stores/revisionStore";
import { RevisionEngine } from "../../src/revision/revisionEngine";
import { REVISION_XP, REVISION_SESSION } from "../../src/revision/config";
import { Avatar } from "../../src/components/ui/Avatar";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { profile, fetchProfile, recordDailyLogin } = useUserStore();
  const { fetchLeaderboard, leaderboard } = useGamificationStore();
  const { loadUserJobData, getAllWithStatus } = useJobStore();
  const revision = useRevisionStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = async () => {
    if (!user) return;
    await Promise.all([
      profile ? Promise.resolve() : fetchProfile(user.id),
      fetchLeaderboard("global", user.id),
      loadUserJobData(user.id),
      revision.hydrated ? Promise.resolve() : revision.hydrate(user.id),
      recordDailyLogin(user.id),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!profile) {
    return <LoadingSpinner fullScreen message="Loading your dashboard..." />;
  }

  const currentUserRank = leaderboard.find((e) => e.isCurrentUser)?.rank;

  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between bg-white dark:bg-gray-950">
          <View className="flex-row items-center gap-3">
            <Avatar uri={profile.avatar_url} name={profile.full_name ?? ""} size="md" />
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400">{getGreeting()} 👋</Text>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {firstName}!
              </Text>
            </View>
          </View>
          <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <Bell size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        <View className="px-5 gap-5 mt-3">
          {/* Stats */}
          <DashboardStats
            xp={profile.xp}
            level={profile.level}
            streak={profile.streak_days}
            rank={currentUserRank}
          />

          {/* Daily rewarded XP spin */}
          <DailyXpSpin />

          {/* Today's Revision — spaced repetition retention loop */}
          {(() => {
            const now = Date.now();
            const due = RevisionEngine.getDue(revision.reviews, now);
            const weak = RevisionEngine.weakTopics(revision.reviews, now).filter((t) => t.averageStrength < 70).length;
            const items = Math.min(due.length, REVISION_SESSION.maxItems);
            const xp = Math.min(REVISION_XP.sessionMax, REVISION_XP.sessionBase + items * REVISION_XP.perCorrect);
            const est = Math.max(1, Math.ceil(items * 0.6));
            if (Object.keys(revision.reviews).length === 0) return null;
            return <RevisionCenterCard dueCount={due.length} weakCount={weak} xpAvailable={xp} estMinutes={est} />;
          })()}

          {/* Remote Jobs — flagship retention card */}
          <HomeJobsCard jobs={getAllWithStatus()} />

          {/* Quick Actions */}
          <QuickActions />

          {/* Motivational Card */}
          <MotivationalCard />

          {/* Native ad — single mid-feed slot */}
          <NativeAdCard />

          {/* Recent Leaderboard preview */}
          {leaderboard.length > 0 && (
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                🏆 Top Learners This Week
              </Text>
              {leaderboard.slice(0, 3).map((entry) => (
                <View
                  key={entry.user_id}
                  className={`flex-row items-center px-4 py-3 mb-2 rounded-2xl ${
                    entry.isCurrentUser
                      ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700"
                      : "bg-white dark:bg-gray-800"
                  }`}
                >
                  <Text className="w-6 text-lg">
                    {["🥇", "🥈", "🥉"][entry.rank - 1] ?? `#${entry.rank}`}
                  </Text>
                  <Text
                    className="flex-1 ml-3 font-semibold text-gray-900 dark:text-white text-sm"
                    numberOfLines={1}
                  >
                    {entry.full_name}{entry.isCurrentUser ? " (You)" : ""}
                  </Text>
                  <Text className="text-xs font-bold text-amber-500">
                    {entry.xp.toLocaleString()} XP
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
