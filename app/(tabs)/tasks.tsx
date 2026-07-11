import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Wallet,
  Flame,
  Users,
  ChevronRight,
  Zap,
  Trophy,
  Gift,
} from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useEarnStore } from "../../src/stores/earnStore";
import {
  EARN_CATEGORIES,
  TASK_ECONOMY,
  formatCents,
  taskLevelProgress,
} from "../../src/constants/taskEconomy";
import { TaskKind } from "../../src/types/tasks.types";
import { JobInterstitialManager } from "../../src/ads/JobInterstitialManager";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function AiTasksScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const earn = useEarnStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) earn.loadHub(user.id);
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await earn.loadHub(user.id);
      await earn.loadTopEarners("week");
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (earn.backendAvailable) earn.loadTopEarners("week");
  }, [earn.backendAvailable]);

  const { summary } = earn;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const remaining = earn.tasksRemainingToday();
  const goalPct = Math.min(
    100,
    Math.round((summary.today.tasksCompleted / TASK_ECONOMY.DAILY_GOAL_TASKS) * 100)
  );
  const levelProg = taskLevelProgress(summary.tasksCompletedTotal);

  const openCategory = (kind: TaskKind) => {
    // Interstitial only at this natural transition — never mid-task.
    JobInterstitialManager.openJob(() => router.push(`/tasks/run?kind=${kind}` as any));
  };

  if (earn.isLoading && earn.catalog.length === 0) {
    return <LoadingSpinner fullScreen message="Loading AI Tasks..." />;
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
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {getGreeting()} 👋
              </Text>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                {firstName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/wallet" as any)}
              className="flex-row items-center gap-2 bg-primary-600 px-4 py-2.5 rounded-2xl"
              activeOpacity={0.85}
            >
              <Wallet size={16} color="#fff" />
              <Text className="text-white font-bold">
                {formatCents(summary.wallet.balanceCents)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings dashboard card */}
        <View className="mx-5 mt-4 bg-primary-600 rounded-3xl p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-primary-100 text-xs font-semibold uppercase tracking-wide">
              Today's Earnings
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/wallet" as any)}
              className="flex-row items-center"
            >
              <Text className="text-primary-100 text-xs font-semibold">Wallet</Text>
              <ChevronRight size={14} color="#DBEAFE" />
            </TouchableOpacity>
          </View>
          <Text className="text-white text-4xl font-bold mt-1">
            {formatCents(summary.today.earnedCents)}
          </Text>
          <View className="flex-row mt-4 gap-3">
            <View className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5">
              <View className="flex-row items-center gap-1.5">
                <Zap size={13} color="#FDE68A" />
                <Text className="text-white font-bold">
                  {summary.today.tasksCompleted}
                  <Text className="text-primary-200 font-medium">
                    /{summary.today.allowedToday}
                  </Text>
                </Text>
              </View>
              <Text className="text-primary-200 text-[10px] mt-0.5">Tasks today</Text>
            </View>
            <View className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5">
              <View className="flex-row items-center gap-1.5">
                <Flame size={13} color="#FDBA74" />
                <Text className="text-white font-bold">{summary.streak.current} days</Text>
              </View>
              <Text className="text-primary-200 text-[10px] mt-0.5">Task streak</Text>
            </View>
            <View className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5">
              <View className="flex-row items-center gap-1.5">
                <Users size={13} color="#A7F3D0" />
                <Text className="text-white font-bold">
                  {formatCents(summary.wallet.referralCents)}
                </Text>
              </View>
              <Text className="text-primary-200 text-[10px] mt-0.5">Referrals</Text>
            </View>
          </View>

          {/* Daily goal */}
          <View className="mt-4">
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-primary-100 text-xs font-semibold">
                Daily goal · {TASK_ECONOMY.DAILY_GOAL_TASKS} tasks
              </Text>
              <Text className="text-white text-xs font-bold">{goalPct}%</Text>
            </View>
            <ProgressBar
              progress={goalPct}
              height={6}
              color="#FDE68A"
              backgroundColor="rgba(255,255,255,0.2)"
            />
          </View>
        </View>

        {/* This week */}
        <View className="mx-5 mt-3 flex-row gap-3">
          <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3.5">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCents(summary.weekCents)}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">This week</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3.5">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCents(summary.wallet.lifetimeCents)}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Lifetime</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3.5">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {remaining}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Tasks left</Text>
          </View>
        </View>

        {/* Earning categories */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white px-5 mt-6 mb-3">
          💰 Start Earning
        </Text>
        <View className="px-5 gap-3">
          {EARN_CATEGORIES.map((cat) => {
            const feed = earn.getFeed(cat.id as TaskKind);
            const maxReward = feed.reduce((m, t) => Math.max(m, t.rewardCents), 0);
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => openCategory(cat.id as TaskKind)}
                activeOpacity={0.85}
                className={`${cat.bg} rounded-3xl p-4 flex-row items-center`}
              >
                <View className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 items-center justify-center">
                  <Text className="text-3xl">{cat.emoji}</Text>
                </View>
                <View className="flex-1 ml-3.5">
                  <Text className="text-base font-bold text-gray-900 dark:text-white">
                    {cat.title}
                  </Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                    {cat.description}
                  </Text>
                  <Text className="text-xs font-bold mt-1.5" style={{ color: cat.color }}>
                    {cat.id === "captcha"
                      ? `Unlimited · up to ${formatCents(Math.max(maxReward, 1))} each`
                      : feed.length > 0
                        ? `${feed.length} available · up to ${formatCents(maxReward)} each`
                        : "New tasks coming soon"}
                  </Text>
                </View>
                <ChevronRight size={20} color={cat.color} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Native ad — between categories and progression */}
        <View className="px-5 mt-4">
          <NativeAdCard />
        </View>

        {/* AI Task level */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/wallet" as any)}
          className="mx-5 mt-4 bg-white dark:bg-gray-800 rounded-3xl p-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{levelProg.current.emoji}</Text>
              <View>
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  {levelProg.current.name} Level
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {summary.tasksCompletedTotal.toLocaleString()} tasks completed
                </Text>
              </View>
            </View>
            {levelProg.next && (
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {levelProg.next.emoji} {levelProg.next.name} at{" "}
                {levelProg.next.minTasks.toLocaleString()}
              </Text>
            )}
          </View>
          <ProgressBar progress={levelProg.pct} height={8} color={levelProg.current.color} />
          <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
            Higher levels unlock better-paying tasks, premium annotation projects and
            exclusive surveys.
          </Text>
        </TouchableOpacity>

        {/* Referral banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/referrals" as any)}
          className="mx-5 mt-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-4 flex-row items-center"
        >
          <View className="w-12 h-12 rounded-2xl bg-emerald-500 items-center justify-center">
            <Gift size={22} color="#fff" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              Invite friends, earn more
            </Text>
            <Text className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Earn {formatCents(50)} for every friend who joins and stays active.
            </Text>
          </View>
          <ChevronRight size={20} color="#10B981" />
        </TouchableOpacity>

        {/* Learning integration */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/learn" as any)}
          className="mx-5 mt-3 bg-white dark:bg-gray-800 rounded-3xl p-4 flex-row items-center"
        >
          <Text className="text-3xl">🎓</Text>
          <View className="flex-1 ml-3">
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              Learn more, earn more
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Completing courses unlocks higher-paying task categories.
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Top earners */}
        {earn.topEarners.length > 0 && (
          <View className="px-5 mt-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Trophy size={18} color="#F59E0B" />
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Top Earners This Week
              </Text>
            </View>
            {earn.topEarners.slice(0, 5).map((e, i) => (
              <View
                key={e.userId}
                className="flex-row items-center px-4 py-3 mb-2 rounded-2xl bg-white dark:bg-gray-800"
              >
                <Text className="w-7 text-lg">
                  {["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`}
                </Text>
                <Text
                  className="flex-1 ml-2 font-semibold text-gray-900 dark:text-white text-sm"
                  numberOfLines={1}
                >
                  {e.fullName}
                </Text>
                <Text className="text-xs font-bold text-emerald-500">
                  {formatCents(e.cents)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
