import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { JobWithStatus } from "../../types/jobs.types";

interface HomeJobsCardProps {
  jobs: JobWithStatus[];
}

export function HomeJobsCard({ jobs }: HomeJobsCardProps) {
  const router = useRouter();

  const available = jobs.filter((j) => j.eligibility.isUnlocked).length;
  const locked = jobs.length - available;
  const recent = jobs.filter((j) => j.isNew).length;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/(tabs)/jobs");
      }}
    >
      <LinearGradient
        colors={["#EF4444", "#F97316"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-5"
      >
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white text-xl font-bold">🔥 Remote Jobs</Text>
          {recent > 0 && (
            <View className="bg-white/25 rounded-lg px-2 py-1">
              <Text className="text-white text-xs font-bold">{recent} NEW</Text>
            </View>
          )}
        </View>
        <Text className="text-white/80 text-sm mb-4">
          Unlock AI jobs by completing courses.
        </Text>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <View className="flex-row items-center gap-1.5">
              <CheckCircle2 size={16} color="white" />
              <Text className="text-white text-2xl font-bold">{available}</Text>
            </View>
            <Text className="text-white/80 text-xs mt-0.5">Available</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <View className="flex-row items-center gap-1.5">
              <Lock size={16} color="white" />
              <Text className="text-white text-2xl font-bold">{locked}</Text>
            </View>
            <Text className="text-white/80 text-xs mt-0.5">Locked</Text>
          </View>
        </View>

        <View className="bg-white rounded-xl py-3 flex-row items-center justify-center gap-2">
          <Text className="text-red-500 font-bold text-base">Browse Jobs</Text>
          <ArrowRight size={18} color="#EF4444" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
