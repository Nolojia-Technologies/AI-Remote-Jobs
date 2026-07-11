import React, { useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Settings,
  LogOut,
  ChevronRight,
  Award,
  BookOpen,
  Star,
  Shield,
  Brain,
  CalendarDays,
  Wallet,
  Gift,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useGamificationStore } from "../../src/stores/gamificationStore";
import { Avatar } from "../../src/components/ui/Avatar";
import { StreakBadge } from "../../src/components/ui/StreakBadge";
import { LevelBadge } from "../../src/components/ui/LevelBadge";
import { XPIndicator } from "../../src/components/ui/XPIndicator";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { AchievementCard } from "../../src/components/profile/AchievementCard";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { JobReadinessCard } from "../../src/components/certification/JobReadinessCard";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { getLevelInfo } from "../../src/constants/xp";
import { CAREER_PATHS } from "../../src/constants/careers";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { profile } = useUserStore();
  const { achievements, certificates, fetchAchievements, fetchCertificates } =
    useGamificationStore();

  useEffect(() => {
    if (user) {
      fetchAchievements(user.id);
      fetchCertificates(user.id);
    }
  }, [user]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  if (!profile) return <LoadingSpinner fullScreen />;

  const levelInfo = getLevelInfo(profile.xp);
  const careerPath = CAREER_PATHS.find((p) => p.id === profile.career_path_id);
  const earnedAchievements = achievements.filter((a) => a.isEarned);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={["#2563EB", "#0EA5E9"]}
          className="px-5 pt-4 pb-8 items-center"
        >
          <View className="items-center">
            <Avatar
              uri={profile.avatar_url}
              name={profile.full_name ?? ""}
              size="xl"
              className="border-4 border-white mb-3"
            />
            <Text className="text-2xl font-bold text-white mb-1">
              {profile.full_name ?? "AI Learner"}
            </Text>
            {careerPath && (
              <Text className="text-white/70 text-sm mb-4">
                {careerPath.emoji} {careerPath.title}
              </Text>
            )}
            <View className="flex-row gap-3 items-center">
              <LevelBadge level={profile.level} showTitle size="md" />
              <StreakBadge days={profile.streak_days} size="md" />
            </View>
          </View>
        </LinearGradient>

        {/* XP Progress */}
        <View className="bg-white dark:bg-gray-800 mx-5 -mt-4 rounded-2xl p-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Level {profile.level} Progress
            </Text>
            <XPIndicator xp={profile.xp} size="sm" showLabel />
          </View>
          <ProgressBar
            progress={levelInfo.progressPercent}
            height={8}
            color="#2563EB"
            animated
          />
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {(levelInfo.xpForNextLevel - profile.xp).toLocaleString()} XP to Level {profile.level + 1}
          </Text>
        </View>

        {/* Job Readiness Certification status */}
        <JobReadinessCard />

        {/* Stats Grid */}
        <View className="mx-5 mt-4 flex-row gap-3">
          {[
            { label: "Certificates", value: certificates.length, emoji: "🎓" },
            { label: "Achievements", value: earnedAchievements.length, emoji: "🏅" },
            { label: "Day Streak", value: profile.streak_days, emoji: "🔥" },
          ].map((stat) => (
            <View
              key={stat.label}
              className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 items-center"
            >
              <Text className="text-xl mb-1">{stat.emoji}</Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 text-center">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Achievements Preview */}
        {achievements.length > 0 && (
          <View className="mx-5 mt-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-gray-900 dark:text-white">
                Achievements
              </Text>
              <TouchableOpacity onPress={() => router.push("/achievements")}>
                <Text className="text-sm text-primary font-semibold">See All</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {achievements.slice(0, 6).map((a) => (
                <AchievementCard key={a.id} achievement={a} />
              ))}
            </View>
          </View>
        )}

        {/* One native ad near achievements */}
        <View className="mx-5 mt-5">
          <NativeAdCard />
        </View>

        {/* Menu Items */}
        <View className="mx-5 mt-5 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          {[
            {
              icon: Wallet,
              label: "Wallet & Earnings",
              onPress: () => router.push("/wallet" as any),
              color: "#059669",
            },
            {
              icon: Gift,
              label: "Referral Center",
              onPress: () => router.push("/referrals" as any),
              color: "#10B981",
            },
            {
              icon: Award,
              label: "My Certificates",
              onPress: () => router.push("/certificates"),
              color: "#8B5CF6",
            },
            {
              icon: Star,
              label: "All Achievements",
              onPress: () => router.push("/achievements"),
              color: "#F59E0B",
            },
            {
              icon: BookOpen,
              label: "My Learning",
              onPress: () => router.push("/(tabs)/learn"),
              color: "#2563EB",
            },
            {
              icon: Brain,
              label: "Revision Center",
              onPress: () => router.push("/revision" as any),
              color: "#7C3AED",
            },
            {
              icon: CalendarDays,
              label: "Learning Calendar",
              onPress: () => router.push("/calendar"),
              color: "#0EA5E9",
            },
            {
              icon: Shield,
              label: "Privacy & Security",
              onPress: () => Alert.alert("Coming Soon", "Privacy settings are coming soon."),
              color: "#22C55E",
            },
            {
              icon: Settings,
              label: "Settings",
              onPress: () => router.push("/settings" as any),
              color: "#94A3B8",
            },
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center px-4 py-4 ${
                index < arr.length - 1
                  ? "border-b border-gray-100 dark:border-gray-700"
                  : ""
              }`}
              activeOpacity={0.75}
            >
              <View
                className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: item.color + "20" }}
              >
                <item.icon size={16} color={item.color} />
              </View>
              <Text className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                {item.label}
              </Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <View className="mx-5 mt-4 mb-4">
          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl py-4"
            activeOpacity={0.75}
          >
            <LogOut size={18} color="#EF4444" />
            <Text className="text-red-500 font-bold text-base">Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-xs text-gray-400 dark:text-gray-600 mb-4">
          AI Remote Jobs v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
