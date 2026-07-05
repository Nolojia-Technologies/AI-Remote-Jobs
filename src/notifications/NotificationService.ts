import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * NotificationService — local (offline) engagement + reminder notifications.
 *
 * Uses Expo Notifications with deterministic identifiers, so re-scheduling
 * simply replaces the existing notification (never stacks duplicates). All
 * calls are guarded — notification failures never affect the app. Local
 * scheduling works in Expo Go and EAS builds; no push token required.
 *
 * Android: every reminder is posted to a per-category notification channel so
 * it surfaces as a heads-up banner with sound/vibration (Android 8+ silently
 * drops notifications that have no channel). Each notification also carries a
 * `route` in its data payload so tapping it deep-links to the right screen
 * (see NotificationProvider).
 */

const HOUR = 3600;

type Category = "engagement" | "inactivity" | "quiz" | "energy" | "certification";

// Where each notification deep-links when tapped.
const ROUTES = {
  home: "/",
  learn: "/learn",
  revision: "/revision",
  jobs: "/jobs",
  certification: "/certification",
  chapter: (id: string) => `/chapter/${id}`,
} as const;

// Daily reminder pool (one rotates in per day).
const DAILY_MESSAGES = [
  { title: "🔥 New remote jobs are available", body: "Fresh AI jobs just dropped — see if you qualify." },
  { title: "🎯 Today's lesson is waiting", body: "A few minutes of learning unlocks new opportunities." },
  { title: "💼 15 AI jobs were added today", body: "Keep learning and unlock them one by one." },
  { title: "🏆 Protect your streak", body: "Don't break the chain — complete today's lesson." },
  { title: "🎁 Claim your daily reward", body: "Your bonus is waiting inside the app." },
  { title: "📚 Continue learning and unlock jobs", body: "You're closer than you think to your next unlock." },
  { title: "👥 Thousands are applying right now", body: "Stay ahead — sharpen your skills today." },
  { title: "🧠 Your revision session is ready", body: "A quick review keeps your skills sharp." },
];

// Smart inactivity ladder (reset every time the user is active).
const INACTIVITY = [
  { id: "inactive-6h", hours: 6, title: "👋 Ready to continue?", body: "Your next lesson is waiting — pick up where you left off." },
  { id: "inactive-24h", hours: 24, title: "🔥 Your streak is in danger", body: "Come back today to keep your learning streak alive." },
  { id: "inactive-48h", hours: 48, title: "🎁 Claim your daily reward", body: "We saved a reward for you — open the app to grab it." },
  { id: "inactive-72h", hours: 72, title: "🙁 We miss you", body: "New AI jobs were added while you were away. Take a look!" },
  { id: "inactive-7d", hours: 24 * 7, title: "🎉 Welcome back gift", body: "Return now for a comeback reward and fresh jobs." },
];

// Random engagement nudges (used by notifyEngagement()).
const ENGAGEMENT = [
  { title: "Almost there!", body: "Only one lesson left before unlocking a job." },
  { title: "🔥 Your streak is in danger", body: "Keep it alive with a quick lesson." },
  { title: "💼 5 new AI jobs are waiting", body: "See which ones match your skills." },
  { title: "🧠 Today's revision takes 3 minutes", body: "Quick review, big retention boost." },
  { title: "📈 You're getting closer to Level 5", body: "A little more XP to go!" },
];

// Per-category Android channels. HIGH = heads-up banner + sound; DEFAULT = sound
// but no intrusive banner. Names/descriptions appear in the system settings so
// users can fine-tune each category there.
const CHANNELS: Record<Category, { name: string; description: string; importance: Notifications.AndroidImportance }> = {
  engagement: { name: "Daily reminders", description: "Your once-a-day nudge to keep learning.", importance: Notifications.AndroidImportance.HIGH },
  inactivity: { name: "Comeback reminders", description: "Gentle nudges when you've been away.", importance: Notifications.AndroidImportance.HIGH },
  quiz: { name: "Quizzes & unlocks", description: "When a quiz, retry, or new chapter is ready.", importance: Notifications.AndroidImportance.HIGH },
  energy: { name: "Energy", description: "When your learning energy has refilled.", importance: Notifications.AndroidImportance.DEFAULT },
  certification: { name: "Job Readiness", description: "Certification unlocks, retakes, and Job Ready status.", importance: Notifications.AndroidImportance.HIGH },
};

let setupPromise: Promise<void> | null = null;

/** Idempotent: install the foreground handler + (Android) the channels. */
function ensureSetup(): Promise<void> {
  if (!setupPromise) {
    setupPromise = (async () => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (Platform.OS === "android") {
        await Promise.all(
          (Object.keys(CHANNELS) as Category[]).map((key) =>
            Notifications.setNotificationChannelAsync(key, {
              name: CHANNELS[key].name,
              description: CHANNELS[key].description,
              importance: CHANNELS[key].importance,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: "#2563EB",
              sound: "default",
            })
          )
        );
      }
    })().catch(() => {
      // Channel/handler setup failed (e.g. unsupported env) — let it retry next time.
      setupPromise = null;
    });
  }
  return setupPromise;
}

async function hasPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

async function schedule(
  identifier: string,
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  category: Category = "engagement",
  route?: string
): Promise<void> {
  try {
    await ensureSetup();
    if (!(await hasPermission())) return;
    // On Android the channel must be named on the trigger so the OS applies the
    // right importance/sound for this category.
    const finalTrigger =
      Platform.OS === "android" && trigger
        ? ({ ...(trigger as object), channelId: category } as Notifications.NotificationTriggerInput)
        : trigger;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, data: { category, route } },
      trigger: finalTrigger,
    });
  } catch {
    // notifications unavailable — ignore
  }
}

function afterSeconds(seconds: number): Notifications.TimeIntervalTriggerInput {
  return { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(60, Math.floor(seconds)), repeats: false };
}

export const NotificationService = {
  /** Install the handler + channels (safe to call repeatedly). */
  configure(): void {
    void ensureSetup();
  },

  /** Ask for permission (call during onboarding). Returns whether granted. */
  async requestPermission(): Promise<boolean> {
    await ensureSetup();
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.status === "granted") return true;
      const req = await Notifications.requestPermissionsAsync();
      return req.status === "granted";
    } catch {
      return false;
    }
  },

  /**
   * Refresh the engagement schedule: one daily reminder + the inactivity ladder.
   * Call on every app launch/resume so the inactivity timers restart from now.
   */
  async syncEngagement(): Promise<void> {
    await ensureSetup();
    if (!(await hasPermission())) return;

    const msg = DAILY_MESSAGES[new Date().getDate() % DAILY_MESSAGES.length];
    await schedule(
      "engagement-daily",
      msg.title,
      msg.body,
      { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 10, minute: 0 },
      "engagement",
      ROUTES.home
    );

    for (const step of INACTIVITY) {
      await schedule(step.id, step.title, step.body, afterSeconds(step.hours * HOUR), "inactivity", ROUTES.learn);
    }
  },

  /** Notify when a quiz retry / reopen cooldown expires (at = epoch ms). */
  async scheduleQuizCooldown(chapterId: string, at: number, reopen = false): Promise<void> {
    await schedule(
      `quiz-${chapterId}`,
      "⏳ Your quiz cooldown has expired",
      reopen ? "Your quiz is ready to resume — jump back in!" : "Retry your quiz now and pass it!",
      afterSeconds((at - Date.now()) / 1000),
      "quiz",
      ROUTES.chapter(chapterId)
    );
  },

  /** Notify when a chapter unlock cooldown expires. */
  async scheduleChapterUnlock(chapterId: string, at: number): Promise<void> {
    await schedule(
      `chapter-${chapterId}`,
      "🎉 A new chapter is available",
      "Your next chapter just unlocked — keep the momentum going!",
      afterSeconds((at - Date.now()) / 1000),
      "quiz",
      ROUTES.chapter(chapterId)
    );
  },

  /** Notify when energy has regenerated. */
  async scheduleEnergyRegen(at: number): Promise<void> {
    await schedule(
      "energy-regen",
      "⚡ Your energy is back",
      "You have energy to learn again — continue a lesson!",
      afterSeconds((at - Date.now()) / 1000),
      "energy",
      ROUTES.learn
    );
  },

  /** A one-off random engagement nudge after `delaySeconds`. */
  async notifyEngagement(delaySeconds = 4 * HOUR): Promise<void> {
    const m = ENGAGEMENT[Math.floor(Math.random() * ENGAGEMENT.length)];
    await schedule("engagement-nudge", m.title, m.body, afterSeconds(delaySeconds), "engagement", ROUTES.home);
  },

  // ─── Job Readiness Certification ──────────────────────────────────────────
  /** Reached 80% course completion → the Final Certification Quiz is unlocked. */
  async notifyCertUnlocked(): Promise<void> {
    await schedule(
      "cert-unlocked",
      "🎯 Certification unlocked!",
      "You've hit 80% course completion — the Final Certification Quiz is ready. Pass it to become Job Ready.",
      afterSeconds(60),
      "certification",
      ROUTES.certification
    );
  },

  /** Retake cooldown expiry (at = epoch ms) → the next attempt is available. */
  async scheduleRetakeCooldown(at: number): Promise<void> {
    await schedule(
      "cert-cooldown",
      "⏳ Certification retake ready",
      "Your cooldown is over — retake the Job Readiness Certification now!",
      afterSeconds((at - Date.now()) / 1000),
      "certification",
      ROUTES.certification
    );
  },

  /** Passed → Job Ready. */
  async notifyJobReady(): Promise<void> {
    await schedule(
      "cert-job-ready",
      "🎉 Congratulations!",
      "You've successfully passed the Job Readiness Certification. You can now apply for remote jobs.",
      afterSeconds(60),
      "certification",
      ROUTES.jobs
    );
  },

  /** New jobs available after certification (nudge back to the Jobs tab). */
  async notifyNewJobsAfterCert(): Promise<void> {
    await schedule(
      "cert-new-jobs",
      "💼 New remote jobs unlocked",
      "Your certification opened up new jobs — see which ones match your skills.",
      afterSeconds(2 * HOUR),
      "certification",
      ROUTES.jobs
    );
  },

  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // ignore
    }
  },
};
