import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ShieldCheck, Lock, PlayCircle, CheckCircle2, Clock, GraduationCap,
  Trophy, Zap, Flame, ChevronRight, BookOpen, Award,
} from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useCertificationStore } from "../../src/stores/certificationStore";
import { useRewardedAd } from "../../src/hooks/useAds";
import { useCertTimer, formatClock } from "../../src/certification/useCertTimer";
import { ProgressBar } from "../../src/components/ui/ProgressBar";

export default function CertificationHub() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const { status, loading, refreshStatus, resumeActive, recordAd, startAttempt } = useCertificationStore();
  const rewarded = useRewardedAd();
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    await refreshStatus();
    await resumeActive();
  };
  useEffect(() => { if (user) load(); }, [user]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Live cooldown countdown → auto-refresh when it elapses.
  const cooldownLeft = useCertTimer(status?.in_cooldown ? status?.cooldown_until ?? null : null, () => refreshStatus());

  async function beginAttempt() {
    setBusy(true);
    const attempt = await startAttempt();
    setBusy(false);
    if (attempt) router.push("/certification/quiz" as any);
    else Alert.alert("Couldn't start", useCertificationStore.getState().error ?? "Please try again.");
  }

  async function watchAd() {
    const first = (status?.attempts_used ?? 0) === 0;
    setBusy(true);
    const watched = await rewarded(first ? "cert_unlock" : "cert_retry");
    if (!watched) { setBusy(false); return; }
    const next = await recordAd();
    setBusy(false);
    // If that ad satisfied the requirement, start immediately.
    if (next?.ready_to_start) beginAttempt();
  }

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-2">
          <ShieldCheck size={24} color="#2563EB" />
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Job Readiness</Text>
        </View>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Prove you're ready — pass the certification to unlock job applications.
        </Text>
      </View>

      {loading && !status ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2563EB" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        >
          {status?.is_job_ready ? (
            <JobReadyDashboard status={status} profile={profile} onViewJobs={() => router.push("/(tabs)/jobs" as any)} />
          ) : (
            <>
              <JourneyTracker status={status} />
              <GateCard
                status={status}
                busy={busy}
                cooldownLeft={cooldownLeft}
                onContinueLearning={() => router.push("/(tabs)/learn" as any)}
                onWatchAd={watchAd}
                onStart={beginAttempt}
                onResume={() => router.push("/certification/quiz" as any)}
              />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Learning-journey tracker ────────────────────────────────────────────────
function JourneyTracker({ status }: { status: any }) {
  const completion = status?.completion_percent ?? 0;
  const meets = completion >= 80;
  const steps = [
    { label: "Complete courses & lessons", done: completion > 0, icon: BookOpen },
    { label: "Reach 80% course completion", done: meets, icon: GraduationCap },
    { label: "Pass the certification quiz", done: !!status?.is_job_ready, icon: Trophy },
    { label: "Become Job Ready", done: !!status?.is_job_ready, icon: ShieldCheck },
  ];
  const nextMilestone = !meets
    ? `You're at ${completion}%. Reach 80% to unlock the Final Certification Quiz.`
    : status?.is_job_ready
    ? "You're certified — you can apply for remote jobs!"
    : "You've unlocked the Final Certification Quiz. Pass it to become Job Ready.";

  return (
    <View className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 mb-4">
      <Text className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Overall learning progress</Text>
      <View className="flex-row items-end gap-2 mb-3">
        <Text className="text-4xl font-extrabold text-gray-900 dark:text-white">{completion}%</Text>
        <Text className="mb-1 text-sm text-gray-400">of curriculum</Text>
      </View>
      <ProgressBar progress={completion} height={10} color={meets ? "#22C55E" : "#2563EB"} backgroundColor="#E5E7EB" />
      <View className="mt-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
        <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">Next milestone</Text>
        <Text className="text-sm text-blue-600 dark:text-blue-200">{nextMilestone}</Text>
      </View>

      <View className="mt-4 gap-3">
        {steps.map((s, i) => (
          <View key={i} className="flex-row items-center gap-3">
            <View className={`h-8 w-8 items-center justify-center rounded-full ${s.done ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
              {s.done ? <CheckCircle2 size={18} color="#22C55E" /> : <s.icon size={16} color="#9CA3AF" />}
            </View>
            <Text className={`flex-1 text-sm ${s.done ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Gate: locked → unlock-with-ad → cooldown → ready → resume ────────────────
function GateCard({
  status, busy, cooldownLeft, onContinueLearning, onWatchAd, onStart, onResume,
}: {
  status: any; busy: boolean; cooldownLeft: number;
  onContinueLearning: () => void; onWatchAd: () => void; onStart: () => void; onResume: () => void;
}) {
  const completion = status?.completion_percent ?? 0;
  const meets = completion >= 80;
  const active = status?.active_attempt;
  const first = (status?.attempts_used ?? 0) === 0;
  const adsWatched = status?.ads_watched ?? 0;
  const adsRequired = status?.ads_required ?? 1;

  // 1) An attempt is already running → resume.
  if (active) {
    return (
      <Panel tone="blue" icon={PlayCircle} title="Certification in progress"
        body={`You have ${formatClock(active.seconds_remaining)} left. Resume to finish before time runs out.`}>
        <PrimaryButton label="Resume quiz" onPress={onResume} disabled={busy} />
      </Panel>
    );
  }

  // 2) Below 80% → keep learning.
  if (!meets) {
    return (
      <Panel tone="amber" icon={Lock} title="Certification locked"
        body="Complete your learning journey and reach 80% course completion to unlock the Job Readiness Certification.">
        <PrimaryButton label="Continue Learning" onPress={onContinueLearning} icon={BookOpen} />
      </Panel>
    );
  }

  // 3) In retake cooldown → wait or watch 5 ads.
  if (status?.in_cooldown && !status?.ready_to_start) {
    return (
      <Panel tone="amber" icon={Clock} title="Retake locked"
        body={`Your next attempt unlocks in ${formatClock(cooldownLeft)} — or watch ${adsRequired} rewarded ads to unlock instantly.`}>
        <View className="mb-3">
          <Text className="text-xs font-semibold text-gray-500 mb-1">{adsWatched} of {adsRequired} ads watched</Text>
          <ProgressBar progress={(adsWatched / Math.max(1, adsRequired)) * 100} height={8} color="#F59E0B" backgroundColor="#FEF3C7" />
        </View>
        <PrimaryButton label={busy ? "Loading ad…" : "Watch Ad"} onPress={onWatchAd} disabled={busy} icon={PlayCircle} />
      </Panel>
    );
  }

  // 4) Ready (cooldown waited out) → start directly.
  if (status?.ready_to_start) {
    return (
      <Panel tone="green" icon={ShieldCheck} title="You're ready" body="Start your Job Readiness Certification quiz now.">
        <PrimaryButton label={busy ? "Starting…" : "Start certification quiz"} onPress={onStart} disabled={busy} />
      </Panel>
    );
  }

  // 5) Needs the unlock ad (first attempt) or partway through retake ads.
  return (
    <Panel tone="blue" icon={PlayCircle}
      title={first ? "Unlock your certification quiz" : "Unlock your next attempt"}
      body={first
        ? "Watch one short ad to begin. This keeps AI Remote Jobs free for everyone."
        : `Watch ${adsRequired} rewarded ads to unlock another attempt now.`}>
      {!first && (
        <View className="mb-3">
          <Text className="text-xs font-semibold text-gray-500 mb-1">{adsWatched} of {adsRequired} ads watched</Text>
          <ProgressBar progress={(adsWatched / Math.max(1, adsRequired)) * 100} height={8} color="#2563EB" backgroundColor="#E5E7EB" />
        </View>
      )}
      <PrimaryButton label={busy ? "Loading ad…" : "Watch Ad & Start Quiz"} onPress={onWatchAd} disabled={busy} icon={PlayCircle} />
    </Panel>
  );
}

// ─── Job Ready dashboard ─────────────────────────────────────────────────────
function JobReadyDashboard({ status, profile, onViewJobs }: { status: any; profile: any; onViewJobs: () => void }) {
  const stats = [
    { label: "Certification score", value: `${status?.certification_percentage ?? 0}%`, icon: Award },
    { label: "Current XP", value: (profile?.xp ?? 0).toLocaleString(), icon: Zap },
    { label: "Learning streak", value: `${profile?.streak_days ?? 0}d`, icon: Flame },
  ];
  return (
    <View>
      <View className="rounded-3xl bg-green-600 p-6 mb-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Trophy size={26} color="#FFFFFF" />
          <Text className="text-white text-xl font-extrabold">You're Job Ready 🎉</Text>
        </View>
        <Text className="text-green-50 text-sm">
          Congratulations! You passed the Job Readiness Certification and can now apply for remote jobs.
        </Text>
        {status?.certified_at && (
          <Text className="text-green-100 text-xs mt-2">Certified on {new Date(status.certified_at).toLocaleDateString()}</Text>
        )}
      </View>

      <View className="flex-row gap-3 mb-4">
        {stats.map((s) => (
          <View key={s.label} className="flex-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 items-center">
            <s.icon size={20} color="#2563EB" />
            <Text className="text-lg font-bold text-gray-900 dark:text-white mt-1">{s.value}</Text>
            <Text className="text-[11px] text-gray-400 text-center">{s.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={onViewJobs} className="rounded-2xl bg-primary p-4 flex-row items-center justify-between">
        <Text className="text-white font-bold">Browse unlocked jobs</Text>
        <ChevronRight size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Small UI helpers ────────────────────────────────────────────────────────
const TONES: Record<string, { bg: string; fg: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-900/20", fg: "#2563EB" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/20", fg: "#F59E0B" },
  green: { bg: "bg-green-50 dark:bg-green-900/20", fg: "#22C55E" },
};

function Panel({ tone, icon: Icon, title, body, children }: { tone: string; icon: any; title: string; body: string; children?: React.ReactNode }) {
  const t = TONES[tone] ?? TONES.blue;
  return (
    <View className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5">
      <View className={`self-start rounded-2xl ${t.bg} p-3 mb-3`}>
        <Icon size={24} color={t.fg} />
      </View>
      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">{body}</Text>
      {children}
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled, icon: Icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      className={`rounded-2xl p-4 flex-row items-center justify-center gap-2 ${disabled ? "bg-gray-300 dark:bg-gray-700" : "bg-primary"}`}
    >
      {Icon && <Icon size={18} color="#FFFFFF" />}
      <Text className="text-white font-bold text-center">{label}</Text>
    </TouchableOpacity>
  );
}
