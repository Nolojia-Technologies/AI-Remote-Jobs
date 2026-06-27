import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Lock, Unlock, Zap, MapPin, Building2, ChevronLeft } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useGamificationStore } from "../../src/stores/gamificationStore";
import { Badge } from "../../src/components/ui/Badge";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { OpportunityWithStatus } from "../../src/types/app.types";

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; variant: "primary" | "secondary" | "accent" | "warning" | "error" | "gray" }> = {
  practice_project: { label: "Practice Project", emoji: "🔧", variant: "primary" },
  ai_simulation: { label: "AI Simulation", emoji: "🤖", variant: "secondary" },
  skill_challenge: { label: "Skill Challenge", emoji: "⚡", variant: "warning" },
  mock_freelance: { label: "Mock Freelance", emoji: "💼", variant: "accent" },
  remote_job: { label: "Remote Job", emoji: "🌍", variant: "error" },
};

function OpportunityCard({
  opportunity,
  onPress,
}: {
  opportunity: OpportunityWithStatus;
  onPress: () => void;
}) {
  const cat = CATEGORY_LABELS[opportunity.category] ?? CATEGORY_LABELS.practice_project;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 border-2 ${
        opportunity.isUnlocked
          ? "border-gray-100 dark:border-gray-700"
          : "border-gray-100 dark:border-gray-800 opacity-75"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center ${
            opportunity.isUnlocked
              ? "bg-primary-100 dark:bg-primary-900/30"
              : "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          {opportunity.isUnlocked ? (
            <Text className="text-2xl">{cat.emoji}</Text>
          ) : (
            <Lock size={22} color="#9CA3AF" />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Badge label={cat.label} variant={cat.variant} size="xs" />
            {!opportunity.isUnlocked && (
              <Badge label="Locked" variant="gray" size="xs" />
            )}
          </View>

          <Text className="text-base font-bold text-gray-900 dark:text-white mb-1" numberOfLines={2}>
            {opportunity.title}
          </Text>

          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3" numberOfLines={2}>
            {opportunity.description}
          </Text>

          {opportunity.company && (
            <View className="flex-row items-center gap-1 mb-1">
              <Building2 size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {opportunity.company}
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-3">
            {opportunity.location && (
              <View className="flex-row items-center gap-1">
                <MapPin size={12} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {opportunity.location}
                </Text>
              </View>
            )}
            {opportunity.payout && (
              <Text className="text-xs font-bold text-green-600 dark:text-green-400">
                {opportunity.payout}
              </Text>
            )}
          </View>

          {!opportunity.isUnlocked && (
            <View className="mt-3">
              <View className="flex-row items-center gap-1 mb-1">
                <Zap size={12} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  Requires {opportunity.required_xp.toLocaleString()} XP
                </Text>
              </View>
              <ProgressBar
                progress={opportunity.unlockProgress ?? 0}
                height={4}
                color="#F59E0B"
                backgroundColor="#FEF3C7"
              />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function OpportunitiesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const { opportunities, fetchOpportunities, isLoadingOpportunities } = useGamificationStore();
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchOpportunities(user.id);
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) await fetchOpportunities(user.id);
    setRefreshing(false);
  };

  const filtered = filter === "all"
    ? opportunities
    : filter === "unlocked"
    ? opportunities.filter((o) => o.isUnlocked)
    : opportunities.filter((o) => o.category === filter);

  const unlocked = opportunities.filter((o) => o.isUnlocked).length;

  if (isLoadingOpportunities && opportunities.length === 0) {
    return <LoadingSpinner fullScreen message="Loading opportunities..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-4">
        <View className="flex-row items-center gap-3 mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Opportunities 💼
            </Text>
          </View>
        </View>

        <View className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-3 mb-4 flex-row items-center justify-between">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            <Text className="font-bold text-primary">{unlocked}</Text> of {opportunities.length} unlocked
          </Text>
          {profile && (
            <View className="flex-row items-center gap-1">
              <Zap size={12} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-xs font-bold text-amber-600">
                {profile.xp.toLocaleString()} XP
              </Text>
            </View>
          )}
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          {[
            { id: "all", label: "All" },
            { id: "unlocked", label: "🔓 Available" },
            { id: "practice_project", label: "🔧 Practice" },
            { id: "ai_simulation", label: "🤖 Simulation" },
            { id: "mock_freelance", label: "💼 Freelance" },
            { id: "remote_job", label: "🌍 Jobs" },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id)}
              className={`px-3 py-2 rounded-xl mr-2 ${
                filter === f.id
                  ? "bg-primary"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  filter === f.id ? "text-white" : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No Opportunities Found"
            description="Keep learning and earning XP to unlock more opportunities!"
          />
        ) : (
          filtered.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onPress={() => {
                if (!opp.isUnlocked) {
                  Alert.alert(
                    "🔒 Locked",
                    `You need ${opp.required_xp.toLocaleString()} XP to unlock this opportunity. Keep learning!`,
                    [{ text: "Got It" }]
                  );
                }
              }}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

