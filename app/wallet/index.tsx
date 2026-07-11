import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ArrowUpRight, Lock, Banknote } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useEarnStore } from "../../src/stores/earnStore";
import { formatCents, taskLevelProgress, TASK_ECONOMY } from "../../src/constants/taskEconomy";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { WalletTransaction } from "../../src/types/tasks.types";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { EmptyState } from "../../src/components/ui/EmptyState";

const TX_META: Record<string, { emoji: string; label: string }> = {
  task: { emoji: "🤖", label: "AI Task" },
  captcha: { emoji: "🧩", label: "Captcha" },
  annotation: { emoji: "🏷️", label: "Annotation" },
  survey: { emoji: "📋", label: "Survey" },
  referral: { emoji: "🎁", label: "Referral" },
  bonus: { emoji: "⭐", label: "Bonus" },
  withdrawal: { emoji: "🏦", label: "Withdrawal" },
  adjustment: { emoji: "⚙️", label: "Adjustment" },
};

const STATUS_COLOR: Record<string, string> = {
  completed: "text-emerald-500",
  pending: "text-amber-500",
  rejected: "text-red-500",
};

function TxRow({ tx }: { tx: WalletTransaction }) {
  const meta = TX_META[tx.type] ?? TX_META.task;
  const date = new Date(tx.createdAt);
  return (
    <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 mb-2">
      <Text className="text-2xl">{meta.emoji}</Text>
      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
          {tx.description || meta.label}
        </Text>
        <Text className="text-[11px] text-gray-400">
          {meta.label} · {date.toLocaleDateString()}{" "}
          {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
      <View className="items-end">
        <Text
          className={`text-sm font-bold ${
            tx.amountCents >= 0 ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {tx.amountCents >= 0 ? "+" : ""}
          {formatCents(tx.amountCents)}
        </Text>
        <Text className={`text-[10px] font-semibold capitalize ${STATUS_COLOR[tx.status]}`}>
          {tx.status}
        </Text>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const earn = useEarnStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (user) await earn.loadHub(user.id);
    await earn.loadTransactions();
  };

  useEffect(() => {
    load();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const { summary, transactions } = earn;
  const w = summary.wallet;
  const levelProg = taskLevelProgress(summary.tasksCompletedTotal);

  const breakdown = [
    { label: "Task earnings", value: w.taskCents, emoji: "🤖" },
    { label: "Survey earnings", value: w.surveyCents, emoji: "📋" },
    { label: "Referral earnings", value: w.referralCents, emoji: "🎁" },
    { label: "Bonus earnings", value: w.bonusCents, emoji: "⭐" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <ChevronLeft size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">💼 Wallet</Text>
        </View>

        {/* Balance card */}
        <View className="mx-5 mt-3 bg-gray-900 dark:bg-gray-800 rounded-3xl p-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
            Current Balance
          </Text>
          <Text className="text-white text-5xl font-bold mt-1">
            {formatCents(w.balanceCents)}
          </Text>
          <View className="flex-row mt-4 gap-3">
            <View className="flex-1">
              <Text className="text-gray-400 text-[11px]">Withdrawable</Text>
              <Text className="text-white font-bold">{formatCents(w.balanceCents)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-[11px]">Pending</Text>
              <Text className="text-white font-bold">{formatCents(w.pendingCents)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-[11px]">Lifetime</Text>
              <Text className="text-white font-bold">{formatCents(w.lifetimeCents)}</Text>
            </View>
          </View>
        </View>

        {/* Withdrawal threshold — unlocks at $100 */}
        {(() => {
          const threshold = TASK_ECONOMY.WITHDRAWAL_THRESHOLD_CENTS;
          const pct = Math.min(100, Math.round((w.balanceCents / threshold) * 100));
          const eligible = w.balanceCents >= threshold;
          return (
            <View className="mx-5 mt-3 bg-white dark:bg-gray-800 rounded-3xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  {eligible ? (
                    <Banknote size={18} color="#10B981" />
                  ) : (
                    <Lock size={16} color="#9CA3AF" />
                  )}
                  <Text className="text-base font-bold text-gray-900 dark:text-white">
                    Withdrawals unlock at {formatCents(threshold)}
                  </Text>
                </View>
                <Text
                  className={`text-sm font-bold ${
                    eligible ? "text-emerald-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {pct}%
                </Text>
              </View>
              <ProgressBar progress={pct} height={10} color={eligible ? "#10B981" : "#2563EB"} />
              <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                {eligible
                  ? "🎉 You've reached the withdrawal threshold! Payout methods (M-Pesa & more) are being finalized — you'll be notified the moment withdrawals open."
                  : `Earn ${formatCents(threshold - w.balanceCents)} more to unlock withdrawals. Your balance is safe and every cent is tracked.`}
              </Text>
            </View>
          );
        })()}

        {/* Period stats */}
        <View className="mx-5 mt-3 flex-row gap-3">
          {[
            { label: "Today", value: summary.today.earnedCents },
            { label: "This week", value: summary.weekCents },
            { label: "This month", value: summary.monthCents },
          ].map((s) => (
            <View key={s.label} className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3.5">
              <Text className="text-base font-bold text-gray-900 dark:text-white">
                {formatCents(s.value)}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Earnings breakdown */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white px-5 mt-6 mb-3">
          Earnings Breakdown
        </Text>
        <View className="mx-5 bg-white dark:bg-gray-800 rounded-3xl p-2">
          {breakdown.map((b, i) => (
            <View
              key={b.label}
              className={`flex-row items-center px-3 py-3 ${
                i < breakdown.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""
              }`}
            >
              <Text className="text-xl">{b.emoji}</Text>
              <Text className="flex-1 ml-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {b.label}
              </Text>
              <Text className="text-sm font-bold text-gray-900 dark:text-white">
                {formatCents(b.value)}
              </Text>
            </View>
          ))}
        </View>

        {/* Level */}
        <View className="mx-5 mt-4 bg-white dark:bg-gray-800 rounded-3xl p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{levelProg.current.emoji}</Text>
              <View>
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  {levelProg.current.name}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Task Level {levelProg.current.level} of 7
                </Text>
              </View>
            </View>
            {levelProg.next && (
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {Math.max(0, levelProg.next.minTasks - summary.tasksCompletedTotal)} tasks to{" "}
                {levelProg.next.name}
              </Text>
            )}
          </View>
          <ProgressBar progress={levelProg.pct} height={8} color={levelProg.current.color} />
        </View>

        {/* History */}
        <View className="flex-row items-center justify-between px-5 mt-6 mb-3">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            Earnings History
          </Text>
          <View className="flex-row items-center gap-1">
            <ArrowUpRight size={14} color="#10B981" />
            <Text className="text-xs font-semibold text-emerald-500">
              {transactions.length} transactions
            </Text>
          </View>
        </View>
        <View className="px-5">
          {transactions.length === 0 ? (
            <EmptyState
              emoji="🪙"
              title="No earnings yet"
              description="Complete your first AI task and your earnings will appear here."
            />
          ) : (
            <>
              {transactions.slice(0, 6).map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
              {transactions.length > 3 && (
                <View className="my-2">
                  <NativeAdCard />
                </View>
              )}
              {transactions.slice(6).map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
