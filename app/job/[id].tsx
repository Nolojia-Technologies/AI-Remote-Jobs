import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, Share, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Bookmark,
  Share2,
  MapPin,
  Briefcase,
  Calendar,
  Lock,
  Building2,
  Gift,
} from "lucide-react-native";
import { format } from "date-fns";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useJobStore } from "../../src/stores/jobStore";
import { Badge } from "../../src/components/ui/Badge";
import { Button } from "../../src/components/ui/Button";
import { RequirementChecklist } from "../../src/components/jobs/RequirementChecklist";
import { MatchScoreBadge } from "../../src/components/jobs/MatchScoreBadge";
import { UnlockCelebration } from "../../src/components/jobs/UnlockCelebration";
import { MilestoneToast } from "../../src/components/jobs/MilestoneToast";
import { ApplicantsBadge, ViewersNow, PopularityBadge, TrendingBadge } from "../../src/components/jobs/SocialBadges";
import { AnimatedCounter } from "../../src/components/jobs/AnimatedCounter";
import { SocialStatNotes, CompetitionBanner } from "../../src/components/jobs/JobSocialProof";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { JOB_XP } from "../../src/stores/jobStore";
import { JOB_AD_XP_FRACTION } from "../../src/constants/xp";
import { useRewardedAd, reportAdAction, useRewardedBonusXp } from "../../src/hooks/useAds";
import {
  getApplicants,
  getPopularity,
  getTrendingBadge,
  getMilestone,
} from "../../src/lib/socialProof";

// Track milestones already celebrated this session (per job+value).
const seenMilestones = new Set<string>();

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { awardXP } = useUserStore();
  const { getJobWithStatus, recordView, recordUnlock, toggleSave, recordShare } = useJobStore();
  const showRewarded = useRewardedAd();
  const grantBonusXp = useRewardedBonusXp();

  const [showCelebration, setShowCelebration] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);

  const job = getJobWithStatus(id as string);
  const applicants = job ? getApplicants(job) : 0;
  const popularity = job ? getPopularity(job) : null;
  const trending = job ? getTrendingBadge(job) : null;
  const milestone = getMilestone(applicants);

  // Show a milestone toast once per session when a job has crossed one.
  useEffect(() => {
    if (job && milestone) {
      const key = `${job.id}:${milestone.value}`;
      if (!seenMilestones.has(key)) {
        seenMilestones.add(key);
        setShowMilestone(true);
      }
    }
  }, [job?.id, milestone?.value]);

  // Record the view (awards small XP once) on mount + feed the ad engine.
  // Every 5 job views the engine surfaces an interstitial (Jobs monetization).
  useEffect(() => {
    if (user && id) {
      recordView(user.id, id as string);
      reportAdAction("job_viewed");
    }
  }, [id]);

  // If the job is unlocked, record the unlock and celebrate the first time.
  useEffect(() => {
    if (user && job?.eligibility.isUnlocked) {
      recordUnlock(user.id, job).then((firstTime) => {
        if (firstTime) setShowCelebration(true);
      });
    }
  }, [job?.eligibility.isUnlocked]);

  if (!job) return <LoadingSpinner fullScreen message="Loading job..." />;

  const { eligibility } = job;
  const unlocked = eligibility.isUnlocked;
  const applied = !!job.application;

  const handleShare = async () => {
    if (!user) return;
    await Share.share({
      message: `Check out this remote job: ${job.title} at ${job.company} (${job.countryFlag} ${job.country}) — $${job.salaryMin}-${job.salaryMax}/mo. Found on AI Remote Jobs!`,
    });
    recordShare(user.id, job.id);
  };

  const handleRewardedAd = async () => {
    if (!user) return;
    setAdLoading(true);
    // Small, capped bonus XP (5/5/10/10/15, max 45/day) — ads accelerate, never replace learning.
    const granted = await grantBonusXp(user.id);
    setAdLoading(false);
    if (granted > 0) Alert.alert("Bonus XP earned! ⚡", `+${granted} XP added.`);
    else if (granted === 0)
      Alert.alert("Daily bonus limit reached", "You've earned your max bonus XP today. Keep learning to earn more!");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
        >
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => user && toggleSave(user.id, job.id)}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <Bookmark
              size={18}
              color={job.isSaved ? "#2563EB" : "#374151"}
              fill={job.isSaved ? "#2563EB" : "transparent"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <Share2 size={18} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View className="flex-row items-start gap-3 mb-4">
          <View className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 items-center justify-center">
            <Text className="text-3xl">{job.companyLogo}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</Text>
            <Text className="text-base text-gray-600 dark:text-gray-400">{job.company}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <MapPin size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-500">
                {job.countryFlag} {job.country}
              </Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          <Badge label="Remote" variant="secondary" />
          <Badge label={job.employmentType === "full_time" ? "Full-Time" : job.employmentType === "part_time" ? "Part-Time" : "Contract"} variant="gray" />
          <Badge
            label={job.difficulty.charAt(0).toUpperCase() + job.difficulty.slice(1)}
            variant={job.difficulty === "beginner" ? "accent" : job.difficulty === "intermediate" ? "warning" : "error"}
          />
          {job.isNew && <Badge label="NEW" variant="error" />}
        </View>

        {/* Salary + deadline */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-2xl p-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400">Salary / month</Text>
            <Text className="text-lg font-bold text-green-600 dark:text-green-400">
              ${job.salaryMin.toLocaleString()}–${job.salaryMax.toLocaleString()}
            </Text>
          </View>
          <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">Apply before</Text>
            </View>
            <Text className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
              {format(new Date(job.applicationDeadline), "MMM d, yyyy")}
            </Text>
          </View>
        </View>

        {/* Social proof block */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-lg">👥</Text>
              <AnimatedCounter
                value={applicants}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              />
              <Text className="text-sm text-gray-500 dark:text-gray-400">Applicants</Text>
            </View>
            {popularity && <PopularityBadge popularity={popularity} />}
          </View>

          <View className="flex-row items-center justify-between">
            <ViewersNow job={job} size="md" />
            {trending ? (
              <TrendingBadge info={trending} size="md" />
            ) : (
              <Text className="text-xs text-gray-400">⭐ Popular Opportunity</Text>
            )}
          </View>

          {/* Popularity score bar */}
          {popularity && (
            <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-gray-500 dark:text-gray-400">Popularity Score</Text>
                <Text className="text-xs font-bold" style={{ color: popularity.color }}>
                  {popularity.score}/100 · {popularity.label}
                </Text>
              </View>
              <View className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${popularity.score}%`, backgroundColor: popularity.color }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Match score */}
        <View className="mb-5">
          <MatchScoreBadge score={eligibility.matchScore} reasons={eligibility.matchReasons} />
        </View>

        {/* Activity / social notifications */}
        <View className="mb-5">
          <Text className="text-base font-bold text-gray-900 dark:text-white mb-2">
            What's happening
          </Text>
          <SocialStatNotes job={job} />
        </View>

        {/* Requirements */}
        <View className="mb-5">
          <RequirementChecklist eligibility={eligibility} requiredCourses={job.requirements.requiredCourses} />
        </View>

        {/* XP source split — ads can only contribute a capped slice toward unlock */}
        <View className="mb-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
          <Text className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            XP toward this job ({job.requirements.minXP.toLocaleString()} XP needed)
          </Text>
          <View className="flex-row gap-3 mb-2">
            <View className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <Text className="text-xs text-green-700 dark:text-green-400">📚 Learning XP</Text>
              <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                {eligibility.learningXp.toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
              <Text className="text-xs text-amber-700 dark:text-amber-400">📺 Ad XP (counted)</Text>
              <Text className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {eligibility.adXpAllowed.toLocaleString()}
                <Text className="text-xs font-normal text-gray-400"> / {eligibility.adXpCap.toLocaleString()} max</Text>
              </Text>
            </View>
          </View>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Ads can cover at most {Math.round(JOB_AD_XP_FRACTION * 100)}% — the rest must come from lessons, quizzes & challenges.
          </Text>
        </View>

        {/* Competition banner (locked) */}
        {!unlocked && (
          <View className="mb-5">
            <CompetitionBanner
              applicants={applicants}
              eligibility={eligibility}
              minLevel={job.requirements.minLevel}
              levelMet={eligibility.checks.find((c) => c.label === "Level")?.met ?? true}
            />
          </View>
        )}

        {/* Locked guidance */}
        {!unlocked && (
          <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-5">
            <Text className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-2">
              🔒 Complete required courses to unlock
            </Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1 mb-3">
              <Text className="text-xs text-amber-600 dark:text-amber-400">
                Courses remaining: {eligibility.coursesRemaining}
              </Text>
              <Text className="text-xs text-amber-600 dark:text-amber-400">
                Tests remaining: {eligibility.testsRemaining}
              </Text>
              <Text className="text-xs text-amber-600 dark:text-amber-400">
                Completion: {eligibility.completionPercent}%
              </Text>
            </View>
            <Button label="Go to Learning →" onPress={() => router.push("/(tabs)/learn")} variant="accent" fullWidth />
          </View>
        )}

        {/* Description */}
        <Section title="Job Description">
          <Text className="text-sm text-gray-600 dark:text-gray-400 leading-6">{job.description}</Text>
        </Section>

        {/* Responsibilities */}
        <Section title="Responsibilities">
          {job.responsibilities.map((r) => (
            <BulletItem key={r} text={r} />
          ))}
        </Section>

        {/* Skills */}
        <Section title="Skills Needed">
          <View className="flex-row flex-wrap gap-2">
            {job.skills.map((s) => (
              <View key={s} className="bg-primary-50 dark:bg-primary-900/30 rounded-lg px-3 py-1.5">
                <Text className="text-sm text-primary font-medium">{s}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Benefits */}
        <Section title="Benefits">
          {job.benefits.map((b) => (
            <BulletItem key={b} text={b} emoji="✨" />
          ))}
        </Section>

        {/* Company */}
        <Section title="About the Company">
          <View className="flex-row items-center gap-2 mb-2">
            <Building2 size={16} color="#9CA3AF" />
            <Text className="text-sm font-bold text-gray-900 dark:text-white">{job.company}</Text>
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-400 leading-6">
            {job.companyDescription}
          </Text>
        </Section>

        {/* Rewarded ad */}
        <TouchableOpacity
          onPress={handleRewardedAd}
          disabled={adLoading}
          className="flex-row items-center justify-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl py-3 mt-2"
        >
          <Gift size={16} color="#8B5CF6" />
          <Text className="text-sm font-bold text-purple-600 dark:text-purple-400">
            {adLoading ? "Loading ad…" : "Watch a short ad for +25 XP"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky apply bar */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        {applied ? (
          <View className="flex-row items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-2xl py-4">
            <Text className="text-green-600 dark:text-green-400 font-bold">
              ✓ Application submitted ({job.application?.status})
            </Text>
          </View>
        ) : unlocked ? (
          <Button
            label="Apply Now 🚀"
            onPress={() => router.push(`/apply/${job.id}` as any)}
            fullWidth
            size="lg"
          />
        ) : (
          <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl py-4 flex-row items-center justify-center gap-2">
            <Lock size={18} color="#9CA3AF" />
            <Text className="font-bold text-gray-500 dark:text-gray-400">
              COMPLETE REQUIRED COURSES
            </Text>
          </View>
        )}
      </View>

      <UnlockCelebration
        visible={showCelebration}
        jobTitle={job.title}
        xpAwarded={JOB_XP.UNLOCK}
        onClose={() => {
          setShowCelebration(false);
          // Reward cycle: after the unlock celebration closes, a forced
          // high-value interstitial moment (engine still gates it).
          reportAdAction("job_unlocked");
        }}
      />

      {milestone && (
        <MilestoneToast
          visible={showMilestone}
          label={milestone.label}
          emoji={milestone.emoji}
          onHide={() => setShowMilestone(false)}
        />
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</Text>
      {children}
    </View>
  );
}

function BulletItem({ text, emoji = "•" }: { text: string; emoji?: string }) {
  return (
    <View className="flex-row gap-2 mb-1.5">
      <Text className="text-sm text-primary">{emoji}</Text>
      <Text className="flex-1 text-sm text-gray-600 dark:text-gray-400 leading-6">{text}</Text>
    </View>
  );
}
