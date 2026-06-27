import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { BookOpen, Zap, Briefcase, Trophy, Award, Target } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface Action {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  route: string;
}

const ACTIONS: Action[] = [
  { id: "learn", label: "Learn", emoji: "📚", color: "#2563EB", bgColor: "#EFF6FF", route: "/(tabs)/learn" },
  { id: "jobs", label: "Jobs", emoji: "🔥", color: "#EF4444", bgColor: "#FEF2F2", route: "/(tabs)/jobs" },
  { id: "challenge", label: "Challenge", emoji: "⚡", color: "#F59E0B", bgColor: "#FFFBEB", route: "/(tabs)/challenges" },
  { id: "leaderboard", label: "Leaderboard", emoji: "🏆", color: "#F59E0B", bgColor: "#FFFBEB", route: "/leaderboard" },
  { id: "opportunities", label: "Practice", emoji: "💼", color: "#22C55E", bgColor: "#F0FDF4", route: "/opportunities" },
  { id: "certificates", label: "Certificates", emoji: "🎓", color: "#8B5CF6", bgColor: "#F5F3FF", route: "/certificates" },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Quick Actions</Text>
      <View className="flex-row flex-wrap gap-3">
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(action.route as any);
            }}
            className="flex-1 min-w-[28%] items-center py-4 rounded-2xl"
            style={{ backgroundColor: action.bgColor }}
            activeOpacity={0.75}
          >
            <Text className="text-2xl mb-1">{action.emoji}</Text>
            <Text
              className="text-xs font-semibold text-center"
              style={{ color: action.color }}
              numberOfLines={1}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
