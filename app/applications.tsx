import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { format } from "date-fns";
import { useAuthStore } from "../src/stores/authStore";
import { useJobStore } from "../src/stores/jobStore";
import { JobCard } from "../src/components/jobs/JobCard";
import { Badge } from "../src/components/ui/Badge";
import { EmptyState } from "../src/components/ui/EmptyState";

type Tab = "applied" | "saved" | "recent";

const statusVariant: Record<string, "primary" | "warning" | "accent" | "error" | "secondary"> = {
  applied: "primary",
  reviewed: "warning",
  shortlisted: "secondary",
  accepted: "accent",
  rejected: "error",
};

export default function ApplicationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user } = useAuthStore();
  const { loadUserJobData, getAllWithStatus, toggleSave, applications, viewedJobIds } = useJobStore();

  const [tab, setTab] = useState<Tab>((params.tab as Tab) || "applied");

  useEffect(() => {
    if (user) loadUserJobData(user.id);
  }, [user]);

  const allJobs = getAllWithStatus();
  const savedJobs = allJobs.filter((j) => j.isSaved);
  const recentJobs = allJobs.filter((j) => viewedJobIds.has(j.id));

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "applied", label: "Applied", count: applications.length },
    { id: "saved", label: "Saved", count: savedJobs.length },
    { id: "recent", label: "Recent", count: recentJobs.length },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</Text>
        </View>

        <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                tab === t.id ? "bg-white dark:bg-gray-700 shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  tab === t.id ? "text-primary" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t.label} ({t.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "applied" &&
          (applications.length === 0 ? (
            <EmptyState
              emoji="📨"
              title="No Applications Yet"
              description="Unlock jobs by completing courses, then apply to start your remote career."
              actionLabel="Browse Jobs"
              onAction={() => router.replace("/(tabs)/jobs")}
            />
          ) : (
            applications.map((app) => {
              const job = allJobs.find((j) => j.id === app.job_id);
              if (!job) return null;
              return (
                <TouchableOpacity
                  key={app.id}
                  onPress={() => router.push(`/job/${job.id}` as any)}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-gray-700"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 items-center justify-center">
                      <Text className="text-2xl">{job.companyLogo}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                        {job.title}
                      </Text>
                      <Text className="text-sm text-gray-500">{job.company}</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">
                        Applied {format(new Date(app.applied_at), "MMM d, yyyy")}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Badge
                        label={app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        variant={statusVariant[app.status] ?? "primary"}
                        size="sm"
                      />
                      <Text className="text-xs font-bold text-green-600">{app.match_score}% match</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ))}

        {tab === "saved" &&
          (savedJobs.length === 0 ? (
            <EmptyState
              emoji="🔖"
              title="No Saved Jobs"
              description="Tap the bookmark icon on any job to save it for later."
              actionLabel="Browse Jobs"
              onAction={() => router.replace("/(tabs)/jobs")}
            />
          ) : (
            savedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push(`/job/${job.id}` as any)}
                onToggleSave={() => user && toggleSave(user.id, job.id)}
              />
            ))
          ))}

        {tab === "recent" &&
          (recentJobs.length === 0 ? (
            <EmptyState
              emoji="👀"
              title="Nothing Viewed Yet"
              description="Jobs you open will appear here for quick access."
            />
          ) : (
            recentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push(`/job/${job.id}` as any)}
                onToggleSave={() => user && toggleSave(user.id, job.id)}
              />
            ))
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
