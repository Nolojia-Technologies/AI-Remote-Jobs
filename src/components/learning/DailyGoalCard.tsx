import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, Target } from "lucide-react-native";
import { ProgressBar } from "../ui/ProgressBar";

interface DailyGoalCardProps {
  chaptersToday: number;
  dailyLimit: number;
  streakDays: number;
}

export function DailyGoalCard({ chaptersToday, dailyLimit, streakDays }: DailyGoalCardProps) {
  const pct = Math.min(100, Math.round((chaptersToday / dailyLimit) * 100));
  const done = chaptersToday >= dailyLimit;

  return (
    <LinearGradient
      colors={done ? ["#16A34A", "#22C55E"] : ["#2563EB", "#0EA5E9"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-2xl p-4"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Target size={18} color="#FFFFFF" />
          <Text className="text-white font-bold text-base">Today's Goal</Text>
        </View>
        <View className="flex-row items-center gap-1 bg-white/20 rounded-lg px-2 py-1">
          <Flame size={14} color="#FFFFFF" />
          <Text className="text-white font-bold text-sm">{streakDays}-day streak</Text>
        </View>
      </View>

      <Text className="text-white/85 text-sm mb-2">
        {done
          ? "Amazing work! Come back tomorrow for more 🎉"
          : `Complete ${dailyLimit - chaptersToday} more chapter${dailyLimit - chaptersToday > 1 ? "s" : ""} today`}
      </Text>

      <ProgressBar progress={pct} height={8} color="#FFFFFF" backgroundColor="rgba(255,255,255,0.25)" />
      <Text className="text-white/70 text-xs mt-1.5">
        {chaptersToday}/{dailyLimit} chapters today
      </Text>
    </LinearGradient>
  );
}
