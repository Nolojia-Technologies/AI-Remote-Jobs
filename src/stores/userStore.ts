import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Profile, XPSource } from "../types/app.types";
import { getLevelFromXP, getLevelInfo, XP_REWARDS } from "../constants/xp";
import { logEvent, AnalyticsEvents } from "../lib/analytics";

interface UserState {
  profile: Profile | null;
  isLoading: boolean;

  // Actions
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  selectCareerPath: (careerPathId: string) => Promise<{ error: string | null }>;
  selectGoal: (goal: string) => Promise<void>;
  awardXP: (userId: string, amount: number, source: XPSource, description: string) => Promise<void>;
  recordDailyLogin: (userId: string) => Promise<void>;
  updateStreak: (userId: string) => Promise<void>;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async (userId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      set({ profile: data as Profile, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const profile = get().profile;
    if (!profile) return { error: "No profile loaded" };

    const { error } = await (supabase.from("profiles") as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (!error) {
      set({ profile: { ...profile, ...updates } });
    }
    return { error: error?.message ?? null };
  },

  selectCareerPath: async (careerPathId) => {
    const result = await get().updateProfile({ career_path_id: careerPathId });
    if (!result.error) {
      logEvent(AnalyticsEvents.CAREER_PATH_SELECTED, { career_path_id: careerPathId });
    }
    return result;
  },

  selectGoal: async (goal) => {
    await get().updateProfile({ goal });
  },

  awardXP: async (userId, amount, source, description) => {
    const profile = get().profile;
    if (!profile) return;

    const newXP = profile.xp + amount;
    const oldLevel = profile.level;
    const newLevel = getLevelFromXP(newXP);

    await (supabase.from("profiles") as any).update({
      xp: newXP,
      level: newLevel,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);

    await (supabase.from("xp_logs") as any).insert({
      user_id: userId,
      amount,
      source,
      description,
    });

    set({ profile: { ...profile, xp: newXP, level: newLevel } });

    if (newLevel > oldLevel) {
      logEvent(AnalyticsEvents.LEVEL_UP, { new_level: newLevel });
    }
  },

  recordDailyLogin: async (userId) => {
    const profile = get().profile;
    if (!profile) return;

    const today = new Date().toISOString().split("T")[0];
    const lastDate = profile.streak_last_date?.split("T")[0];

    if (lastDate === today) return; // Already logged in today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const newStreak =
      lastDate === yesterdayStr ? profile.streak_days + 1 : 1;

    await (supabase.from("profiles") as any).update({
      streak_days: newStreak,
      streak_last_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", userId);

    set({
      profile: {
        ...profile,
        streak_days: newStreak,
        streak_last_date: new Date().toISOString(),
      },
    });

    // Award daily login XP
    await get().awardXP(userId, XP_REWARDS.DAILY_LOGIN, "daily_login", "Daily login bonus");

    // Streak milestones
    if (newStreak === 7) {
      await get().awardXP(userId, XP_REWARDS.STREAK_7_DAYS, "streak_7_days", "7-day streak!");
      logEvent(AnalyticsEvents.STREAK_MILESTONE, { days: 7 });
    } else if (newStreak === 14) {
      await get().awardXP(userId, XP_REWARDS.STREAK_14_DAYS, "streak_14_days", "14-day streak!");
      logEvent(AnalyticsEvents.STREAK_MILESTONE, { days: 14 });
    } else if (newStreak === 30) {
      await get().awardXP(userId, XP_REWARDS.STREAK_30_DAYS, "streak_30_days", "30-day streak!");
      logEvent(AnalyticsEvents.STREAK_MILESTONE, { days: 30 });
    }
  },

  updateStreak: async (userId) => {
    await get().recordDailyLogin(userId);
  },

  clearProfile: () => set({ profile: null }),
}));
