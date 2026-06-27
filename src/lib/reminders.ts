import * as Notifications from "expo-notifications";

// Smart revision reminders. Local scheduled notifications only (Expo Go safe);
// all calls are guarded so notification failures never affect the app.

const REVISION_MESSAGES = [
  { title: "Today's revision is ready 🧠", body: "Keep your skills sharp — it only takes a few minutes." },
  { title: "You have weak topics to strengthen 💪", body: "Review now to restore your mastery." },
  { title: "Your streak is at risk 🔥", body: "Complete today's revision to keep your streak alive." },
  { title: "Lessons are due for review 📚", body: "Complete revision to earn bonus XP." },
];

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  } catch {
    return false;
  }
}

/** Schedule a single daily revision reminder (default 18:00 local). */
export async function scheduleDailyRevisionReminder(hour = 18, minute = 0): Promise<void> {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return;

    // Avoid stacking duplicates across launches.
    await Notifications.cancelAllScheduledNotificationsAsync();

    const msg = REVISION_MESSAGES[new Date().getDay() % REVISION_MESSAGES.length];
    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // notifications unavailable (e.g. limited in Expo Go) — ignore
  }
}

export async function cancelRevisionReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
