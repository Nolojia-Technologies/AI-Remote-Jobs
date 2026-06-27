import React from "react";
import { View, Text } from "react-native";
import { Zap, Trophy, Flame, Star } from "lucide-react-native";
import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import { getLevelInfo } from "../../constants/xp";

interface DashboardStatsProps {
  xp: number;
  level: number;
  streak: number;
  rank?: number;
}

export function DashboardStats({ xp, level, streak, rank }: DashboardStatsProps) {
  const levelInfo = getLevelInfo(xp);

  return (
    <View className="gap-3">
      {/* XP Progress */}
      <Card className="bg-gradient-to-r from-primary to-secondary" variant="elevated">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-xs font-medium text-primary-200">Level {level}</Text>
            <Text className="text-lg font-bold text-white">{levelInfo.title}</Text>
          </View>
          <View className="bg-white/20 rounded-2xl px-3 py-1.5 flex-row items-center gap-1">
            <Zap size={14} color="#FCD34D" fill="#FCD34D" />
            <Text className="text-white font-bold text-sm">
              {xp.toLocaleString()} XP
            </Text>
          </View>
        </View>
        <ProgressBar
          progress={levelInfo.progressPercent}
          color="#FFFFFF"
          backgroundColor="rgba(255,255,255,0.25)"
          height={8}
          animated
        />
        <Text className="text-xs text-primary-200 mt-2">
          {(levelInfo.xpForNextLevel - xp).toLocaleString()} XP to Level {level + 1}
        </Text>
      </Card>

      {/* Stats Row */}
      <View className="flex-row gap-3">
        <Card className="flex-1 items-center py-4" variant="bordered">
          <View className="bg-red-100 dark:bg-red-900/30 rounded-full p-2 mb-2">
            <Flame size={20} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">{streak}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Day Streak</Text>
        </Card>

        <Card className="flex-1 items-center py-4" variant="bordered">
          <View className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-2 mb-2">
            <Trophy size={20} color="#F59E0B" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {rank ? `#${rank}` : "—"}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Global Rank</Text>
        </Card>

        <Card className="flex-1 items-center py-4" variant="bordered">
          <View className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-2 mb-2">
            <Star size={20} color="#2563EB" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">{level}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Level</Text>
        </Card>
      </View>
    </View>
  );
}
