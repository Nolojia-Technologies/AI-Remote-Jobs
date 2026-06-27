import React, { useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Brain, CalendarDays, Flame } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useRevisionStore } from "../../src/stores/revisionStore";
import { useProgressionStore } from "../../src/stores/progressionStore";
import { useRewardedBonusXp } from "../../src/hooks/useAds";
import { RevisionEngine } from "../../src/revision/revisionEngine";
import { REVISION_XP, REVISION_SESSION, MEMORY_BADGES } from "../../src/revision/config";
import { DailyGoal } from "../../src/revision/types";
import { MemoryBar } from "../../src/components/revision/MemoryBar";
import { WeakTopics } from "../../src/components/revision/WeakTopics";
import { RevisionChestCard } from "../../src/components/revision/RevisionChestCard";
import { DailyGoalsCard } from "../../src/components/revision/DailyGoalsCard";
import { Button } from "../../src/components/ui/Button";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { NotificationService } from "../../src/notifications/NotificationService";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function RevisionHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, awardXP } = useUserStore();
  const revision = useRevisionStore();
  const progression = useProgressionStore();
  const grantBonusXp = useRewardedBonusXp();

  useEffect(() => {
    (async () => {
      if (user && !revision.hydrated) await revision.hydrate(user.id);
      else revision.normalize();
      NotificationService.syncEngagement();
    })();
  }, [user]);

  const now = Date.now();
  const due = RevisionEngine.getDue(revision.reviews, now);
  const weak = RevisionEngine.weakTopics(revision.reviews, now);
  const overall = RevisionEngine.overallMemory(revision.reviews, now);
  const itemCount = Math.min(due.length, REVISION_SESSION.maxItems);
  const xpAvailable = Math.min(REVISION_XP.sessionMax, REVISION_XP.sessionBase + itemCount * REVISION_XP.perCorrect);

  const today = revision.history[todayStr()] ?? { lessons: 0, revisions: 0, challenges: 0, xp: 0, milestone: false };
  const goals: DailyGoal[] = [
    { id: "revision", emoji: "🔁", label: "Complete 1 revision", target: 1, current: today.revisions },
    { id: "lessons", emoji: "📚", label: "Complete 2 lessons", target: 2, current: today.lessons },
    { id: "xp", emoji: "⚡", label: "Earn 50 XP", target: 50, current: today.xp },
    { id: "streak", emoji: "🔥", label: "Maintain your streak", target: 1, current: (profile?.streak_days ?? 0) > 0 ? 1 : 0 },
  ];

  const earnedBadges = MEMORY_BADGES.filter((b) => revision.earnedBadges.includes(b.id));
  const hasReviews = Object.keys(revision.reviews).length > 0;

  const claimChest = async () => {
    if (!user) return false;
    // Rewarded ad → small capped bonus XP + energy (ads accelerate, not replace).
    const granted = await grantBonusXp(user.id);
    if (granted >= 0) {
      revision.claimChest();
      progression.restoreEnergy(2);
      return true;
    }
    return false;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-3 mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center gap-2">
            <Brain size={22} color="#7C3AED" />
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Revision Center</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/calendar")}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <CalendarDays size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        {hasReviews && (
          <View className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Memory</Text>
              <View className="flex-row items-center gap-1">
                <Flame size={14} color="#EF4444" />
                <Text className="text-sm font-bold text-red-500">{revision.revisionStreak}-day review streak</Text>
              </View>
            </View>
            <MemoryBar strength={overall} showValue={false} height={10} />
            <Text className="text-xs font-bold mt-1" style={{ color: RevisionEngine.memoryColor(overall) }}>
              {overall}% · {RevisionEngine.memoryLevel(overall)}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {!hasReviews ? (
          <EmptyState
            emoji="🧠"
            title="No Reviews Yet"
            description="Complete some lessons first. We'll schedule smart reviews to keep your memory sharp."
            actionLabel="Go to Learning"
            onAction={() => router.replace("/(tabs)/learn")}
          />
        ) : (
          <View className="gap-5">
            {/* Start revision */}
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">
                {due.length > 0 ? `${due.length} lesson${due.length === 1 ? "" : "s"} due for review` : "All caught up! 🎉"}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {due.length > 0
                  ? `A quick ${itemCount}-item session · earn up to ${xpAvailable} XP`
                  : "Come back tomorrow to keep your streak and memory strong."}
              </Text>
              {due.length > 0 && (
                <Button label="Start Revision →" onPress={() => router.push("/revision/session")} fullWidth size="lg" />
              )}
            </View>

            {/* Daily goals */}
            <DailyGoalsCard goals={goals} />

            {/* Weak topics */}
            <WeakTopics topics={weak} />

            {/* Chest */}
            <RevisionChestCard onClaim={claimChest} />

            {/* Badges */}
            {earnedBadges.length > 0 && (
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">Memory Badges</Text>
                <View className="flex-row flex-wrap gap-2">
                  {earnedBadges.map((b) => (
                    <View key={b.id} className="flex-row items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                      <Text className="text-base">{b.emoji}</Text>
                      <Text className="text-sm font-bold text-amber-700 dark:text-amber-300">{b.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
