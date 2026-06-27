import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Brain, ArrowRight, Clock, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface RevisionCenterCardProps {
  dueCount: number;
  weakCount: number;
  xpAvailable: number;
  estMinutes: number;
}

export function RevisionCenterCard({ dueCount, weakCount, xpAvailable, estMinutes }: RevisionCenterCardProps) {
  const router = useRouter();
  const nothingDue = dueCount === 0;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/revision" as any);
      }}
    >
      <LinearGradient
        colors={nothingDue ? ["#0EA5E9", "#22C55E"] : ["#7C3AED", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-5"
      >
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-2">
            <Brain size={20} color="#FFFFFF" />
            <Text className="text-white text-xl font-bold">Today's Revision</Text>
          </View>
          {dueCount > 0 && (
            <View className="bg-white/25 rounded-lg px-2 py-1">
              <Text className="text-white text-xs font-bold">{dueCount} due</Text>
            </View>
          )}
        </View>

        <Text className="text-white/80 text-sm mb-4">
          {nothingDue
            ? "You're all caught up! Come back tomorrow to keep your memory sharp."
            : "Reinforce what you've learned and protect your memory."}
        </Text>

        {!nothingDue && (
          <View className="flex-row gap-2 mb-4">
            <View className="flex-1 bg-white/20 rounded-xl p-2.5">
              <Text className="text-white text-lg font-bold">{dueCount}</Text>
              <Text className="text-white/70 text-xs">to review</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-xl p-2.5">
              <View className="flex-row items-center gap-1">
                <Zap size={12} color="#FCD34D" fill="#FCD34D" />
                <Text className="text-white text-lg font-bold">{xpAvailable}</Text>
              </View>
              <Text className="text-white/70 text-xs">XP available</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-xl p-2.5">
              <View className="flex-row items-center gap-1">
                <Clock size={12} color="#FFFFFF" />
                <Text className="text-white text-lg font-bold">{estMinutes}m</Text>
              </View>
              <Text className="text-white/70 text-xs">est. time</Text>
            </View>
          </View>
        )}

        <View className="bg-white rounded-xl py-3 flex-row items-center justify-center gap-2">
          <Text className="font-bold text-base" style={{ color: nothingDue ? "#0EA5E9" : "#7C3AED" }}>
            {nothingDue ? "View Revision Center" : "Start Revision"}
          </Text>
          <ArrowRight size={18} color={nothingDue ? "#0EA5E9" : "#7C3AED"} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
