import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TextInput, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, BookOpen, Clock, Zap, ChevronRight } from "lucide-react-native";
import { userCourseService } from "../../src/services/userCourseService";
import { Course } from "../../src/types/content.types";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { withNativeAds, isNativeAdSlot } from "../../src/ads/nativeAdSlots";

const DIFF_COLOR: Record<string, string> = {
  beginner: "#22C55E",
  intermediate: "#0EA5E9",
  advanced: "#8B5CF6",
  expert: "#F59E0B",
  master: "#EF4444",
};

export default function LearnScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setCourses(await userCourseService.listPublished(search));
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Courses 📚</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">Pick a skill and start learning — unlock remote jobs.</Text>
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3">
          <Search size={18} color="#9CA3AF" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search courses…" placeholderTextColor="#9CA3AF" className="flex-1 py-2.5 px-2 text-gray-900 dark:text-white" />
        </View>
      </View>

      {loading && courses.length === 0 ? (
        <LoadingSpinner fullScreen message="Loading courses..." />
      ) : courses.length === 0 ? (
        <EmptyState emoji="📭" title="No courses yet" description="Published courses will appear here. (Admins: publish a course in the dashboard.)" />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        >
          {withNativeAds(courses, 4).map((entry) =>
            isNativeAdSlot(entry) ? (
              <NativeAdCard key={entry.key} />
            ) : (
            <TouchableOpacity
              key={entry.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/course/${entry.id}` as any)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-gray-700"
            >
              <View className="flex-row items-start">
                <View className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 items-center justify-center mr-3">
                  <BookOpen size={22} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>{entry.title}</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400" numberOfLines={2}>{entry.description}</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </View>
              <View className="flex-row items-center gap-2 mt-3">
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${DIFF_COLOR[entry.difficulty] ?? "#9CA3AF"}1A` }}>
                  <Text className="text-xs font-bold capitalize" style={{ color: DIFF_COLOR[entry.difficulty] ?? "#9CA3AF" }}>{entry.difficulty}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Clock size={13} color="#9CA3AF" />
                  <Text className="text-xs text-gray-400">{entry.estimated_hours}h</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Zap size={13} color="#F59E0B" />
                  <Text className="text-xs text-gray-400">{entry.xp_reward} XP</Text>
                </View>
                {entry.category ? <Text className="text-xs text-gray-400 capitalize">· {entry.category}</Text> : null}
              </View>
            </TouchableOpacity>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
