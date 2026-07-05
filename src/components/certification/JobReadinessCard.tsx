import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck, Lock, ChevronRight, Trophy } from "lucide-react-native";
import { useCertificationStore } from "../../stores/certificationStore";
import { ProgressBar } from "../ui/ProgressBar";

/**
 * Compact Job Readiness status card (used on Profile). Shows certified state or
 * current completion progress, and routes to the full certification hub.
 */
export function JobReadinessCard() {
  const router = useRouter();
  const { status, refreshStatus } = useCertificationStore();

  useEffect(() => { refreshStatus(); }, []);

  const certified = !!status?.is_job_ready;
  const completion = status?.completion_percent ?? 0;

  return (
    <TouchableOpacity
      onPress={() => router.push("/certification" as any)}
      activeOpacity={0.85}
      className="mx-5 mt-4 rounded-2xl bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700"
    >
      <View className="flex-row items-center gap-3">
        <View className={`h-11 w-11 items-center justify-center rounded-2xl ${certified ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-50 dark:bg-blue-900/20"}`}>
          {certified ? <Trophy size={22} color="#22C55E" /> : <ShieldCheck size={22} color="#2563EB" />}
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 dark:text-white">Job Readiness</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {certified ? "Certified — you can apply for jobs" : `${completion}% complete · ${completion >= 80 ? "quiz unlocked" : "keep learning"}`}
          </Text>
        </View>
        {certified ? (
          <View className="rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1">
            <Text className="text-xs font-bold text-green-700 dark:text-green-300">Certified</Text>
          </View>
        ) : completion >= 80 ? (
          <ShieldCheck size={18} color="#2563EB" />
        ) : (
          <Lock size={16} color="#9CA3AF" />
        )}
        <ChevronRight size={16} color="#9CA3AF" />
      </View>
      {!certified && (
        <View className="mt-3">
          <ProgressBar progress={completion} height={6} color={completion >= 80 ? "#22C55E" : "#2563EB"} backgroundColor="#E5E7EB" />
        </View>
      )}
    </TouchableOpacity>
  );
}
