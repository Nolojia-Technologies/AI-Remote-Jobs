import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  Lock,
  MapPin,
  Bookmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import * as Haptics from "expo-haptics";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { JobWithStatus } from "../../types/jobs.types";
import { ApplicantsBadge, TrendingBadge } from "./SocialBadges";
import { getApplicants, getTrendingBadge } from "../../lib/socialProof";

interface JobCardProps {
  job: JobWithStatus;
  onPress: () => void;
  onToggleSave: () => void;
}

const difficultyVariant = {
  beginner: "accent" as const,
  intermediate: "warning" as const,
  advanced: "error" as const,
};

const employmentLabel = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
};

export function JobCard({ job, onPress, onToggleSave }: JobCardProps) {
  const router = useRouter();
  const { eligibility } = job;
  const unlocked = eligibility.isUnlocked;
  const applied = !!job.application;
  const applicants = getApplicants(job);
  const trending = getTrendingBadge(job);

  return (
    <TouchableOpacity
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 border-2 ${
        unlocked
          ? "border-gray-100 dark:border-gray-700"
          : "border-gray-100 dark:border-gray-800"
      }`}
    >
      {/* Top row */}
      <View className="flex-row items-start gap-3">
        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center ${
            unlocked ? "bg-primary-50 dark:bg-primary-900/30" : "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          <Text className="text-2xl">{job.companyLogo}</Text>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2 flex-wrap mb-0.5">
            {job.isNew && <Badge label="NEW" variant="error" size="xs" />}
            {trending && <TrendingBadge info={trending} />}
            {applied && <Badge label="Applied" variant="accent" size="xs" />}
          </View>
          <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {job.title}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {job.company}
          </Text>
        </View>

        <TouchableOpacity
          onPress={async (e) => {
            e.stopPropagation?.();
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleSave();
          }}
          hitSlop={10}
          className="p-1"
        >
          <Bookmark
            size={20}
            color={job.isSaved ? "#2563EB" : "#9CA3AF"}
            fill={job.isSaved ? "#2563EB" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      {/* Meta row */}
      <View className="flex-row items-center gap-3 mt-3 flex-wrap">
        <View className="flex-row items-center gap-1">
          <MapPin size={12} color="#9CA3AF" />
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {job.countryFlag} {job.country}
          </Text>
        </View>
        <Badge label="Remote" variant="secondary" size="xs" />
        <Badge label={employmentLabel[job.employmentType]} variant="gray" size="xs" />
        <Badge
          label={job.difficulty.charAt(0).toUpperCase() + job.difficulty.slice(1)}
          variant={difficultyVariant[job.difficulty]}
          size="xs"
        />
      </View>

      {/* Salary + applicants (social proof) */}
      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-base font-bold text-green-600 dark:text-green-400">
          ${job.salaryMin.toLocaleString()}–${job.salaryMax.toLocaleString()}
          <Text className="text-xs font-normal text-gray-400"> /mo</Text>
        </Text>
        <ApplicantsBadge count={applicants} />
      </View>
      <View className="flex-row items-center justify-end mt-1">
        <View className="flex-row items-center gap-1">
          <Clock size={11} color="#9CA3AF" />
          <Text className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      {/* Locked / unlocked footer */}
      <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        {unlocked ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <CheckCircle2 size={16} color="#22C55E" />
              <Text className="text-sm font-bold text-green-600 dark:text-green-400">
                {applied ? "Application sent" : "Unlocked — ready to apply"}
              </Text>
            </View>
            <View className="bg-primary rounded-xl px-3 py-1.5">
              <Text className="text-white text-xs font-bold">
                {applied ? "View" : "Apply"}
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <View className="flex-row items-center gap-1.5 mb-1">
              <Lock size={14} color="#9CA3AF" />
              <Text className="text-sm font-bold text-gray-500 dark:text-gray-400">🔒 Job Locked</Text>
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
              Complete your learning journey and pass the Job Readiness Certification to unlock this application.
            </Text>

            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Course completion</Text>
              <Text className="text-[11px] font-bold text-blue-600 dark:text-blue-300">{eligibility.completionPercent}%</Text>
            </View>
            <ProgressBar
              progress={eligibility.completionPercent}
              height={5}
              color={eligibility.completionPercent >= 80 ? "#22C55E" : "#2563EB"}
              backgroundColor="#E5E7EB"
            />
            <View className="flex-row items-center gap-1.5 mt-2 mb-2.5">
              <ShieldCheck size={13} color="#9CA3AF" />
              <Text className="text-[11px] text-gray-400">
                Certification: {eligibility.completionPercent >= 80 ? "quiz unlocked — not passed yet" : "not passed yet"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={async (e) => {
                e.stopPropagation?.();
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/certification" as any);
              }}
              className="rounded-xl bg-primary py-2.5 items-center"
              activeOpacity={0.85}
            >
              <Text className="text-white text-xs font-bold">Continue Learning</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
