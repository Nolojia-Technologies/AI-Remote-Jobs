import { Platform } from "react-native";

// Firebase Analytics — JS SDK works in Expo Go; native SDK requires EAS build
let analytics: ReturnType<typeof import("firebase/analytics").getAnalytics> | null = null;

async function init() {
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getAnalytics, isSupported } = await import("firebase/analytics");

    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    if (!firebaseConfig.apiKey) return;

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    if (await isSupported()) {
      analytics = getAnalytics(app);
    }
  } catch {
    // Analytics not critical — fail silently
  }
}

export async function logEvent(name: string, params?: Record<string, unknown>) {
  try {
    if (!analytics) await init();
    if (!analytics) return;
    const { logEvent: firebaseLogEvent } = await import("firebase/analytics");
    firebaseLogEvent(analytics, name, params);
  } catch {
    // fail silently
  }
}

export async function setUserProperties(properties: Record<string, string>) {
  try {
    if (!analytics) await init();
    if (!analytics) return;
    const { setUserProperties: fbSetUserProperties } = await import("firebase/analytics");
    fbSetUserProperties(analytics, properties);
  } catch {
    // fail silently
  }
}

export const AnalyticsEvents = {
  SIGN_UP: "sign_up",
  LOGIN: "login",
  LESSON_COMPLETE: "lesson_complete",
  QUIZ_COMPLETE: "quiz_complete",
  CHALLENGE_COMPLETE: "challenge_complete",
  LEVEL_UP: "level_up",
  ACHIEVEMENT_EARNED: "achievement_earned",
  STREAK_MILESTONE: "streak_milestone",
  CAREER_PATH_SELECTED: "career_path_selected",
  OPPORTUNITY_VIEWED: "opportunity_viewed",
  CERTIFICATE_EARNED: "certificate_earned",
  AD_WATCHED: "ad_watched",
  // ─── Ad lifecycle ───────────────────────────────────────────
  REWARDED_AD_STARTED: "rewarded_ad_started",
  REWARDED_AD_COMPLETED: "rewarded_ad_completed",
  REWARDED_AD_REWARD_GRANTED: "rewarded_ad_reward_granted",
  INTERSTITIAL_SHOWN: "interstitial_shown",
  APP_OPEN_SHOWN: "app_open_shown",
  BANNER_IMPRESSION: "banner_impression",
  // ─── Rewarded feature events ────────────────────────────────
  DOUBLE_XP_CLAIMED: "double_xp_claimed",
  XP_BONUS_CLAIMED: "xp_bonus_claimed",
  STREAK_SAVED: "streak_saved",
  SALARY_REVEALED: "salary_revealed",
  COMPANY_REVEALED: "company_revealed",
  JOB_REQUIREMENTS_REVEALED: "job_requirements_revealed",
  QUIZ_RETRY: "quiz_retry",
  QUIZ_REOPEN: "quiz_reopen",
  CHAPTER_UNLOCK: "chapter_unlock",
  // ─── Mediation / revenue ────────────────────────────────────
  REWARDED_AD_NETWORK: "rewarded_ad_network",
  INTERSTITIAL_AD_NETWORK: "interstitial_ad_network",
  BANNER_AD_NETWORK: "banner_ad_network",
  NATIVE_AD_NETWORK: "native_ad_network",
  APP_OPEN_AD_NETWORK: "app_open_ad_network",
  AD_REVENUE_RECEIVED: "ad_revenue_received",
  ECPM_RECEIVED: "ecpm_received",
  IMPRESSION_LOGGED: "impression_logged",
  MEDIATION_INITIALIZED: "mediation_initialized",
  // ─── App rating / review ────────────────────────────────────
  RATING_PROMPT_SHOWN: "rating_prompt_shown",
  RATING_RATE_CLICKED: "rating_rate_clicked",
  RATING_MAYBE_LATER_CLICKED: "rating_maybe_later_clicked",
  RATING_NO_THANKS_CLICKED: "rating_no_thanks_clicked",
  RATING_REVIEW_COMPLETED: "rating_review_completed",
} as const;
