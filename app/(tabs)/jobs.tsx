import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bookmark, FileText, Lock, CheckCircle2, Zap } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useJobStore } from "../../src/stores/jobStore";
import { JobCard } from "../../src/components/jobs/JobCard";
import { FeaturedJobCard } from "../../src/components/jobs/FeaturedJobCard";
import { JobCategoryChips } from "../../src/components/jobs/JobCategoryChips";
import { DailyHighlights } from "../../src/components/jobs/DailyHighlights";
import { LiveActivityFeed } from "../../src/components/jobs/LiveActivityFeed";
import { JobInterstitialManager } from "../../src/ads/JobInterstitialManager";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { withNativeAds, isNativeAdSlot } from "../../src/ads/nativeAdSlots";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { EmptyState } from "../../src/components/ui/EmptyState";

// Maps a learning career path to its closest job category for recommendations.
const PATH_TO_CATEGORY: Record<string, string> = {
  "ai-content-writer": "ai-content-writing",
  "ai-virtual-assistant": "virtual-assistant",
  "ai-customer-support": "customer-support",
  "ai-social-media-manager": "social-media",
  "prompt-engineer": "prompt-engineering",
  "data-entry-specialist": "data-entry",
  "ai-research-assistant": "research",
};

export default function JobsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const { loadUserJobData, getAllWithStatus, toggleSave, claimDailyReward, isLoading } =
    useJobStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const load = async () => {
    if (!user) return;
    await loadUserJobData(user.id);
    const claimed = await claimDailyReward(user.id);
    if (claimed) {
      setRewardClaimed(true);
      setTimeout(() => setRewardClaimed(false), 4000);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) await loadUserJobData(user.id);
    setRefreshing(false);
  };

  const allJobs = getAllWithStatus();
  const available = allJobs.filter((j) => j.eligibility.isUnlocked).length;
  const locked = allJobs.length - available;

  const featured = allJobs.filter((j) => j.featured);
  const recommendedCategory = profile?.career_path_id
    ? PATH_TO_CATEGORY[profile.career_path_id]
    : null;
  const recommended = [...allJobs]
    .filter((j) => (recommendedCategory ? j.categoryId === recommendedCategory : true))
    .sort((a, b) => b.eligibility.matchScore - a.eligibility.matchScore)
    .slice(0, 4);

  const filtered = selectedCategory
    ? allJobs.filter((j) => j.categoryId === selectedCategory)
    : allJobs;

  if (isLoading && allJobs.length === 0) {
    return <LoadingSpinner fullScreen message="Loading jobs..." />;
  }

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
        <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              🔥 Remote Jobs
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => router.push("/applications")}
                className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
              >
                <FileText size={18} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/applications?tab=saved")}
                className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
              >
                <Bookmark size={18} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
          <Text className="text-gray-500 dark:text-gray-400 mb-4">
            Unlock AI jobs by completing courses.
          </Text>

          {/* Counts */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-2xl p-3">
              <View className="flex-row items-center gap-1.5">
                <CheckCircle2 size={16} color="#22C55E" />
                <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {available}
                </Text>
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Available</Text>
            </View>
            <View className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-3">
              <View className="flex-row items-center gap-1.5">
                <Lock size={16} color="#9CA3AF" />
                <Text className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                  {locked}
                </Text>
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Locked</Text>
            </View>
          </View>
        </View>

        {/* Daily check-in reward toast */}
        {rewardClaimed && (
          <View className="mx-5 mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex-row items-center gap-2">
            <Text className="text-xl">🎁</Text>
            <View className="flex-1">
              <Text className="text-sm font-bold text-amber-700 dark:text-amber-300">
                Daily check-in reward!
              </Text>
              <Text className="text-xs text-amber-600 dark:text-amber-400">
                +10 XP for visiting Jobs today. Come back tomorrow!
              </Text>
            </View>
            <Zap size={18} color="#F59E0B" fill="#F59E0B" />
          </View>
        )}

        {/* Daily highlights */}
        <View className="mt-5">
          <DailyHighlights jobs={allJobs} />
        </View>

        {/* Featured */}
        {featured.length > 0 && (
          <View className="mt-5">
            <Text className="text-lg font-bold text-gray-900 dark:text-white px-5 mb-3">
              ⭐ Weekly Featured
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {featured.map((job) => (
                <FeaturedJobCard
                  key={job.id}
                  job={job}
                  onPress={() => JobInterstitialManager.openJob(() => router.push(`/job/${job.id}` as any))}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <View className="mt-5">
            <Text className="text-lg font-bold text-gray-900 dark:text-white px-5 mb-1">
              🎯 Recommended For You
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 px-5 mb-3">
              Based on your career path and progress
            </Text>
            <View className="px-5">
              {recommended.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPress={() => JobInterstitialManager.openJob(() => router.push(`/job/${job.id}` as any))}
                  onToggleSave={() => user && toggleSave(user.id, job.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Live activity */}
        <View className="mt-6">
          <LiveActivityFeed count={5} />
        </View>

        {/* Categories */}
        <View className="mt-6 mb-3">
          <Text className="text-lg font-bold text-gray-900 dark:text-white px-5 mb-3">
            Browse by Category
          </Text>
          <JobCategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />
        </View>

        {/* All / filtered jobs */}
        <View className="px-5 mt-2">
          {filtered.length === 0 ? (
            <EmptyState
              emoji="💼"
              title="No Jobs in This Category"
              description="Try another category or check back soon — new jobs drop daily."
            />
          ) : (
            withNativeAds(filtered, 5).map((entry) =>
              isNativeAdSlot(entry) ? (
                <NativeAdCard key={entry.key} />
              ) : (
                <JobCard
                  key={entry.id}
                  job={entry}
                  onPress={() => JobInterstitialManager.openJob(() => router.push(`/job/${entry.id}` as any))}
                  onToggleSave={() => user && toggleSave(user.id, entry.id)}
                />
              )
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
