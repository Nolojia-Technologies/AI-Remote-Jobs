import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, CheckCircle2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { JobWithStatus, FeaturedTag } from "../../types/jobs.types";

interface FeaturedJobCardProps {
  job: JobWithStatus;
  onPress: () => void;
}

const tagConfig: Record<FeaturedTag, { label: string; gradient: [string, string] }> = {
  high_paying: { label: "💰 High Paying", gradient: ["#16A34A", "#22C55E"] },
  beginner_friendly: { label: "🌱 Beginner Friendly", gradient: ["#0EA5E9", "#2563EB"] },
  trending: { label: "🔥 Trending", gradient: ["#EC4899", "#8B5CF6"] },
  urgent: { label: "⚡ Urgent", gradient: ["#EF4444", "#F97316"] },
};

export function FeaturedJobCard({ job, onPress }: FeaturedJobCardProps) {
  const cfg = tagConfig[job.featuredTag ?? "trending"];
  const unlocked = job.eligibility.isUnlocked;

  return (
    <TouchableOpacity
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.85}
      style={{ width: 260 }}
      className="mr-3"
    >
      <LinearGradient
        colors={cfg.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-4"
        style={{ minHeight: 160 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="bg-white/25 rounded-lg px-2 py-1">
            <Text className="text-white text-xs font-bold">{cfg.label}</Text>
          </View>
          <Text className="text-3xl">{job.companyLogo}</Text>
        </View>

        <Text className="text-white text-lg font-bold mb-0.5" numberOfLines={2}>
          {job.title}
        </Text>
        <Text className="text-white/80 text-sm mb-3" numberOfLines={1}>
          {job.company} · {job.countryFlag} {job.country}
        </Text>

        <View className="flex-row items-center justify-between mt-auto">
          <Text className="text-white font-bold text-base">
            ${job.salaryMin.toLocaleString()}–${job.salaryMax.toLocaleString()}
          </Text>
          <View className="flex-row items-center gap-1 bg-white/25 rounded-lg px-2 py-1">
            {unlocked ? (
              <CheckCircle2 size={12} color="white" />
            ) : (
              <Lock size={12} color="white" />
            )}
            <Text className="text-white text-xs font-bold">
              {unlocked ? "Unlocked" : `${job.eligibility.completionPercent}%`}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
