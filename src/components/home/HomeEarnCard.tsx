import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Zap, Flame, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useEarnStore } from "../../stores/earnStore";
import { formatCents } from "../../constants/taskEconomy";

/** Flagship retention card on Home — daily earnings + jump into AI Tasks. */
export function HomeEarnCard() {
  const router = useRouter();
  const { summary } = useEarnStore();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/(tabs)/tasks" as any);
      }}
    >
      <LinearGradient
        colors={["#059669", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-5"
      >
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white text-xl font-bold">💰 AI Tasks</Text>
          <View className="bg-white/25 rounded-lg px-2 py-1">
            <Text className="text-white text-xs font-bold">EARN DAILY</Text>
          </View>
        </View>
        <Text className="text-white/80 text-sm mb-4">
          Complete AI micro tasks, captchas & surveys — get paid while you learn.
        </Text>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white text-2xl font-bold">
              {formatCents(summary.today.earnedCents)}
            </Text>
            <Text className="text-white/80 text-xs mt-0.5">Earned today</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <View className="flex-row items-center gap-1.5">
              <Zap size={16} color="white" />
              <Text className="text-white text-2xl font-bold">
                {summary.today.tasksCompleted}
              </Text>
            </View>
            <Text className="text-white/80 text-xs mt-0.5">Tasks done</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <View className="flex-row items-center gap-1.5">
              <Flame size={16} color="white" />
              <Text className="text-white text-2xl font-bold">{summary.streak.current}</Text>
            </View>
            <Text className="text-white/80 text-xs mt-0.5">Day streak</Text>
          </View>
        </View>

        <View className="bg-white rounded-xl py-3 flex-row items-center justify-center gap-2">
          <Text className="text-emerald-600 font-bold text-base">Start Earning</Text>
          <ArrowRight size={18} color="#059669" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
