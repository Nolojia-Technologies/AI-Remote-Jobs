import { create } from "zustand";
import { supabase } from "../lib/supabase";
import {
  AchievementWithStatus,
  LeaderboardEntry,
  LeaderboardTab,
  CertificateWithPath,
  OpportunityWithStatus,
} from "../types/app.types";
import { useUserStore } from "./userStore";
import { XP_REWARDS } from "../constants/xp";
import { logEvent, AnalyticsEvents } from "../lib/analytics";

interface GamificationState {
  achievements: AchievementWithStatus[];
  leaderboard: LeaderboardEntry[];
  leaderboardTab: LeaderboardTab;
  certificates: CertificateWithPath[];
  opportunities: OpportunityWithStatus[];
  isLoadingLeaderboard: boolean;
  isLoadingAchievements: boolean;
  isLoadingOpportunities: boolean;

  // Actions
  fetchAchievements: (userId: string) => Promise<void>;
  checkAndAwardAchievements: (userId: string) => Promise<void>;
  fetchLeaderboard: (tab: LeaderboardTab, userId: string) => Promise<void>;
  setLeaderboardTab: (tab: LeaderboardTab) => void;
  fetchCertificates: (userId: string) => Promise<void>;
  fetchOpportunities: (userId: string) => Promise<void>;
  issueCertificate: (userId: string, careerPathId: string) => Promise<void>;
}

function generateCertificateId(): string {
  return `AHA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  achievements: [],
  leaderboard: [],
  leaderboardTab: "global",
  certificates: [],
  opportunities: [],
  isLoadingLeaderboard: false,
  isLoadingAchievements: false,
  isLoadingOpportunities: false,

  fetchAchievements: async (userId) => {
    set({ isLoadingAchievements: true });

    const [achievementsRes, userAchievementsRes] = await Promise.all([
      supabase.from("achievements").select("*").order("requirement_value"),
      supabase.from("user_achievements").select("*").eq("user_id", userId),
    ]);

    const earned = new Map(
      (userAchievementsRes.data as any[])?.map((ua: any) => [ua.achievement_id, ua.earned_at]) ?? []
    );

    const withStatus: AchievementWithStatus[] = (achievementsRes.data ?? []).map((a: any) => ({
      ...a,
      isEarned: earned.has(a.id),
      earnedAt: earned.get(a.id),
    }));

    set({ achievements: withStatus, isLoadingAchievements: false });
  },

  checkAndAwardAchievements: async (userId) => {
    const profile = useUserStore.getState().profile;
    if (!profile) return;

    const { data: allAchievements } = await supabase
      .from("achievements")
      .select("*");
    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const earnedIds = new Set((userAchievements as any[])?.map((ua: any) => ua.achievement_id) ?? []);

    for (const achievement of (allAchievements as any[]) ?? []) {
      if (earnedIds.has(achievement.id)) continue;

      let qualifies = false;

      switch (achievement.requirement_type) {
        case "xp":
          qualifies = profile.xp >= achievement.requirement_value;
          break;
        case "streak":
          qualifies = profile.streak_days >= achievement.requirement_value;
          break;
        case "level":
          qualifies = profile.level >= achievement.requirement_value;
          break;
      }

      if (qualifies) {
        await supabase.from("user_achievements").insert({
          user_id: userId,
          achievement_id: achievement.id,
        } as any);

        await useUserStore
          .getState()
          .awardXP(userId, XP_REWARDS.ACHIEVEMENT_UNLOCK, "achievement_unlock", `Achievement: ${achievement.title}`);

        logEvent(AnalyticsEvents.ACHIEVEMENT_EARNED, { achievement_id: achievement.id });
      }
    }

    await get().fetchAchievements(userId);
  },

  fetchLeaderboard: async (tab, userId) => {
    set({ isLoadingLeaderboard: true, leaderboardTab: tab });

    let query = supabase
      .from("profiles")
      .select("id, full_name, avatar_url, xp, level, country")
      .order("xp", { ascending: false })
      .limit(100);

    if (tab === "kenya") {
      query = query.eq("country", "KE");
    } else if (tab === "qatar") {
      query = query.eq("country", "QA");
    }

    const { data, error } = await query;
    if (error) {
      set({ isLoadingLeaderboard: false });
      return;
    }

    const entries: LeaderboardEntry[] = (data ?? []).map((p: any, index: number) => ({
      user_id: p.id,
      full_name: p.full_name ?? "Anonymous",
      avatar_url: p.avatar_url,
      xp: p.xp,
      level: p.level,
      rank: index + 1,
      country: p.country,
      isCurrentUser: p.id === userId,
    }));

    set({ leaderboard: entries, isLoadingLeaderboard: false });
  },

  setLeaderboardTab: (tab) => set({ leaderboardTab: tab }),

  fetchCertificates: async (userId) => {
    const { data } = await supabase
      .from("certificates")
      .select("*, career_paths(*)")
      .eq("user_id", userId)
      .order("issued_at", { ascending: false });

    set({
      certificates: (data ?? []).map((c: any) => ({
        ...c,
        careerPath: c.career_paths,
      })),
    });
  },

  fetchOpportunities: async (userId) => {
    set({ isLoadingOpportunities: true });
    const profile = useUserStore.getState().profile;

    const { data } = await supabase
      .from("opportunities")
      .select("*")
      .order("required_xp");

    const opportunities: OpportunityWithStatus[] = (data ?? []).map((o: any) => {
      const isUnlocked =
        !o.is_locked ||
        (profile ? profile.xp >= o.required_xp && profile.level >= o.required_level : false);

      const unlockProgress = profile
        ? Math.min(100, Math.round((profile.xp / Math.max(o.required_xp, 1)) * 100))
        : 0;

      return { ...o, isUnlocked, unlockProgress };
    });

    set({ opportunities, isLoadingOpportunities: false });
  },

  issueCertificate: async (userId, careerPathId) => {
    const alreadyIssued = get().certificates.some(
      (c) => c.career_path_id === careerPathId && c.user_id === userId
    );
    if (alreadyIssued) return;

    await supabase.from("certificates").insert({
      user_id: userId,
      career_path_id: careerPathId,
      certificate_id: generateCertificateId(),
    } as any);

    logEvent(AnalyticsEvents.CERTIFICATE_EARNED, { career_path_id: careerPathId });
    await get().fetchCertificates(userId);
  },
}));
