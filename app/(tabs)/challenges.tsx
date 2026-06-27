import React, { useEffect } from "react";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Zap } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useChallengeStore } from "../../src/stores/challengeStore";
import { ChallengeCard } from "../../src/components/challenges/ChallengeCard";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { withNativeAds, isNativeAdSlot } from "../../src/ads/nativeAdSlots";

export default function ChallengesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { challenges, fetchChallenges, isLoading, getCompletedChallengeIds } =
    useChallengeStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user) fetchChallenges(user.id);
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) await fetchChallenges(user.id);
    setRefreshing(false);
  };

  if (isLoading && challenges.length === 0) {
    return <LoadingSpinner fullScreen message="Loading challenges..." />;
  }

  const completedIds = getCompletedChallengeIds();
  const pending = challenges.filter((c) => !c.isCompleted);
  const completed = challenges.filter((c) => c.isCompleted);
  const todayXP = completed.reduce((sum, c) => sum + c.xp_reward, 0);

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
        <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-5">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Daily Challenges ⚡
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mb-4">
            Complete challenges to earn XP and climb the leaderboard.
          </Text>

          {/* Stats row */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-3 items-center">
              <Text className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {pending.length}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Available
              </Text>
            </View>
            <View className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-2xl p-3 items-center">
              <Text className="text-xl font-bold text-green-600 dark:text-green-400">
                {completed.length}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Completed
              </Text>
            </View>
            <View className="flex-1 bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-3 items-center">
              <View className="flex-row items-center gap-1">
                <Zap size={14} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-xl font-bold text-primary">
                  {todayXP}
                </Text>
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                XP Earned
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5 mt-4">
          {challenges.length === 0 ? (
            <EmptyState
              emoji="⚡"
              title="No Challenges Today"
              description="New challenges drop every day. Check back tomorrow!"
            />
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
                    Available Today ({pending.length})
                  </Text>
                  {withNativeAds(pending, 5).map((entry) =>
                    isNativeAdSlot(entry) ? (
                      <NativeAdCard key={entry.key} />
                    ) : (
                      <ChallengeCard
                        key={entry.id}
                        challenge={entry}
                        onPress={() => router.push(`/challenge/${entry.id}` as any)}
                      />
                    )
                  )}
                </>
              )}

              {completed.length > 0 && (
                <>
                  <Text className="text-base font-bold text-gray-900 dark:text-white mb-3 mt-2">
                    Completed ({completed.length}) ✓
                  </Text>
                  {completed.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onPress={() =>
                        router.push(`/challenge/${challenge.id}` as any)
                      }
                    />
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
