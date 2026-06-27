import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AdState,
  AdScreen,
  AdType,
  UserType,
  AdBehavior,
} from "../ads/types";
import { AD_BONUS_XP } from "../constants/xp";

const STORAGE_KEY = "@aha/ad-state/v1";

function todayStr(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

function weekStartStr(d = new Date()): string {
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return monday.toISOString().split("T")[0];
}

function emptyAdXp() {
  return {
    date: todayStr(),
    todayCount: 0,
    todayXp: 0,
    weekStart: weekStartStr(),
    weekXp: 0,
    lifetimeXp: 0,
  };
}

function emptyDaily(date = todayStr()) {
  return { date, total: 0, rewarded: 0, interstitial: 0, appOpen: 0, bannerImpressions: 0 };
}

function emptyRevenue(date = todayStr()) {
  return {
    date,
    todayTotal: 0,
    lifetimeTotal: 0,
    byTypeLifetime: { rewarded: 0, interstitial: 0, app_open: 0, banner: 0 },
  };
}

const initialState: AdState = {
  timestamps: {
    lastAdAt: null,
    lastInterstitialAt: null,
    lastRewardedAt: null,
    lastAppOpenAt: null,
    lastActiveAt: null,
  },
  daily: emptyDaily(),
  lifetime: {
    rewardedWatched: 0,
    interstitialsShown: 0,
    appOpenShown: 0,
    bannerImpressions: 0,
    sessionCount: 0,
  },
  session: {
    sessionStartAt: Date.now(),
    currentScreen: "other",
    cameFromNotification: false,
    interstitialsThisSession: 0,
    actionsThisSession: 0,
    jobsViewedThisSession: 0,
    visitedLeaderboard: false,
    actionCounter: 0,
    actionsSinceInterstitial: 0,
    jobViewsSinceInterstitial: 0,
  },
  behavior: {
    lessonsCompleted: 0,
    challengesCompleted: 0,
    jobsViewed: 0,
    applicationsSubmitted: 0,
    achievementsEarned: 0,
  },
  revenue: emptyRevenue(),
  adXp: emptyAdXp(),
  firstUseDate: todayStr(),
  engagementScore: 0,
  retentionScore: 0,
  userType: "new",
  hydrated: false,
};

// Persisted subset (not the ephemeral session block).
interface Persisted {
  timestamps: AdState["timestamps"];
  daily: AdState["daily"];
  lifetime: AdState["lifetime"];
  behavior: AdState["behavior"];
  revenue: AdState["revenue"];
  adXp: AdState["adXp"];
  firstUseDate: AdState["firstUseDate"];
}

interface AdStore extends AdState {
  hydrate: () => Promise<void>;
  startSession: (cameFromNotification: boolean) => void;
  setScreen: (screen: AdScreen) => void;
  touch: () => void;
  resetDailyIfNeeded: () => void;
  recordAdShown: (type: Exclude<AdType, "none" | "banner">) => void;
  recordBannerImpression: () => void;
  incBehavior: (key: keyof AdBehavior, by?: number) => void;
  incAction: () => void;
  addAction: (weight: number, isJobView: boolean) => void;
  incJobsViewedThisSession: () => void;
  markLeaderboardVisited: () => void;
  addRevenue: (type: Exclude<AdType, "none">, amount: number) => void;
  setScores: (engagement: number, retention: number, userType: UserType) => void;
  /** Next bonus XP a rewarded ad would grant (0 if the daily cap is hit). */
  nextAdBonus: () => number;
  /** Record a granted bonus XP amount into the daily/weekly/lifetime ledger. */
  recordAdXp: (amount: number) => void;
}

function persist(state: AdState) {
  const data: Persisted = {
    timestamps: state.timestamps,
    daily: state.daily,
    lifetime: state.lifetime,
    behavior: state.behavior,
    revenue: state.revenue,
    adXp: state.adXp,
    firstUseDate: state.firstUseDate,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

export const useAdStore = create<AdStore>((set, get) => ({
  ...initialState,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Persisted;
        set({
          timestamps: { ...initialState.timestamps, ...data.timestamps },
          daily: data.daily ?? emptyDaily(),
          lifetime: { ...initialState.lifetime, ...data.lifetime },
          behavior: { ...initialState.behavior, ...data.behavior },
          revenue: data.revenue ?? emptyRevenue(),
          adXp: data.adXp ?? emptyAdXp(),
          firstUseDate: data.firstUseDate ?? todayStr(),
        });
      }
    } catch {
      // ignore corrupt storage
    }
    get().resetDailyIfNeeded();
    set({ hydrated: true });
  },

  startSession: (cameFromNotification) => {
    const now = Date.now();
    get().resetDailyIfNeeded();
    set((s) => ({
      session: {
        sessionStartAt: now,
        currentScreen: "other",
        cameFromNotification,
        interstitialsThisSession: 0,
        actionsThisSession: 0,
        jobsViewedThisSession: 0,
        visitedLeaderboard: false,
        actionCounter: 0,
        actionsSinceInterstitial: 0,
        jobViewsSinceInterstitial: 0,
      },
      lifetime: { ...s.lifetime, sessionCount: s.lifetime.sessionCount + 1 },
      timestamps: { ...s.timestamps, lastActiveAt: now },
    }));
    persist(get());
  },

  setScreen: (screen) =>
    set((s) => ({
      session: { ...s.session, currentScreen: screen },
      timestamps: { ...s.timestamps, lastActiveAt: Date.now() },
    })),

  touch: () =>
    set((s) => ({ timestamps: { ...s.timestamps, lastActiveAt: Date.now() } })),

  resetDailyIfNeeded: () => {
    const today = todayStr();
    const week = weekStartStr();
    const s = get();
    if (s.daily.date !== today) {
      set({ daily: emptyDaily(today) });
    }
    if (s.revenue.date !== today) {
      set((st) => ({ revenue: { ...st.revenue, date: today, todayTotal: 0 } }));
    }
    if (s.adXp.date !== today || s.adXp.weekStart !== week) {
      set((st) => ({
        adXp: {
          ...st.adXp,
          date: today,
          todayCount: st.adXp.date !== today ? 0 : st.adXp.todayCount,
          todayXp: st.adXp.date !== today ? 0 : st.adXp.todayXp,
          weekStart: week,
          weekXp: st.adXp.weekStart !== week ? 0 : st.adXp.weekXp,
        },
      }));
    }
  },

  recordAdShown: (type) => {
    get().resetDailyIfNeeded();
    const now = Date.now();
    set((s) => {
      const daily = { ...s.daily, total: s.daily.total + 1 };
      const lifetime = { ...s.lifetime };
      const timestamps = { ...s.timestamps, lastAdAt: now };
      const session = { ...s.session };
      if (type === "rewarded") {
        daily.rewarded += 1;
        lifetime.rewardedWatched += 1;
        timestamps.lastRewardedAt = now;
      } else if (type === "interstitial") {
        daily.interstitial += 1;
        lifetime.interstitialsShown += 1;
        timestamps.lastInterstitialAt = now;
        session.interstitialsThisSession += 1;
        // reset the action-counter window after an interstitial
        session.actionsSinceInterstitial = 0;
        session.jobViewsSinceInterstitial = 0;
      } else if (type === "app_open") {
        daily.appOpen += 1;
        lifetime.appOpenShown += 1;
        timestamps.lastAppOpenAt = now;
      }
      return { daily, lifetime, timestamps, session };
    });
    persist(get());
  },

  recordBannerImpression: () => {
    get().resetDailyIfNeeded();
    set((s) => ({
      daily: { ...s.daily, bannerImpressions: s.daily.bannerImpressions + 1 },
      lifetime: { ...s.lifetime, bannerImpressions: s.lifetime.bannerImpressions + 1 },
    }));
    persist(get());
  },

  incBehavior: (key, by = 1) => {
    set((s) => ({ behavior: { ...s.behavior, [key]: s.behavior[key] + by } }));
    persist(get());
  },

  incAction: () =>
    set((s) => ({ session: { ...s.session, actionsThisSession: s.session.actionsThisSession + 1 } })),

  addAction: (weight, isJobView) =>
    set((s) => ({
      session: {
        ...s.session,
        actionsThisSession: s.session.actionsThisSession + 1,
        actionCounter: s.session.actionCounter + weight,
        actionsSinceInterstitial: s.session.actionsSinceInterstitial + weight,
        jobViewsSinceInterstitial: s.session.jobViewsSinceInterstitial + (isJobView ? 1 : 0),
        jobsViewedThisSession: s.session.jobsViewedThisSession + (isJobView ? 1 : 0),
      },
    })),

  incJobsViewedThisSession: () =>
    set((s) => ({ session: { ...s.session, jobsViewedThisSession: s.session.jobsViewedThisSession + 1 } })),

  markLeaderboardVisited: () =>
    set((s) => ({ session: { ...s.session, visitedLeaderboard: true } })),

  addRevenue: (type, amount) => {
    get().resetDailyIfNeeded();
    set((s) => ({
      revenue: {
        ...s.revenue,
        todayTotal: s.revenue.todayTotal + amount,
        lifetimeTotal: s.revenue.lifetimeTotal + amount,
        byTypeLifetime: {
          ...s.revenue.byTypeLifetime,
          [type]: s.revenue.byTypeLifetime[type] + amount,
        },
      },
    }));
    persist(get());
  },

  setScores: (engagement, retention, userType) =>
    set({ engagementScore: engagement, retentionScore: retention, userType }),

  nextAdBonus: () => {
    get().resetDailyIfNeeded();
    const { todayCount, todayXp } = get().adXp;
    if (todayCount >= AD_BONUS_XP.maxAdsPerDay) return 0;
    const next = AD_BONUS_XP.schedule[todayCount] ?? AD_BONUS_XP.schedule[AD_BONUS_XP.schedule.length - 1];
    const remaining = AD_BONUS_XP.maxPerDay - todayXp;
    return Math.max(0, Math.min(next, remaining));
  },

  recordAdXp: (amount) => {
    if (amount <= 0) return;
    get().resetDailyIfNeeded();
    set((s) => ({
      adXp: {
        ...s.adXp,
        todayCount: s.adXp.todayCount + 1,
        todayXp: s.adXp.todayXp + amount,
        weekXp: s.adXp.weekXp + amount,
        lifetimeXp: s.adXp.lifetimeXp + amount,
      },
    }));
    persist(get());
  },
}));
