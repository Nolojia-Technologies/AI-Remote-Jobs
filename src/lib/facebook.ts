/**
 * Facebook (Meta) App Events + ads attribution — Android.
 *
 * Thin, Expo-Go-safe facade over `react-native-fbsdk-next`. The native module
 * only exists in EAS dev/release builds, so every call goes through a cached
 * dynamic import that resolves to `null` (and every SDK call is try/caught) when
 * the module isn't present — exactly like `loadAdsSdk()` in src/ads/adConfig.ts.
 *
 * Enable by setting BOTH env vars (Facebook App dashboard → Settings → Basic):
 *   EXPO_PUBLIC_FACEBOOK_APP_ID
 *   EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN
 * When unset, the config plugin is skipped (see app.config.ts) and every helper
 * here is a no-op, so default builds are completely unaffected.
 */

const FB_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
const FB_CLIENT_TOKEN = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;

/** True only when both credentials are configured. */
export const FACEBOOK_CONFIGURED = !!FB_APP_ID && !!FB_CLIENT_TOKEN;

/** Parameters accepted by Facebook app events. */
export type FbEventParams = Record<string, string | number>;

// ─── Shared native-SDK loader (Expo-Go-safe, imported at most once) ──────────
let sdkPromise: Promise<any | null> | null = null;
function loadFbSdk(): Promise<any | null> {
  if (!FACEBOOK_CONFIGURED) return Promise.resolve(null);
  if (!sdkPromise) {
    sdkPromise = import("react-native-fbsdk-next")
      .then((m) => m)
      .catch(() => null); // module absent (Expo Go) → no-op everywhere
  }
  return sdkPromise;
}

let initialized = false;

/**
 * Initialize the SDK and start app-event collection. Safe to call repeatedly;
 * only the first call does work. Auto-logs the standard app-activation event
 * (via AutoLogAppEvents) which Meta uses for install/attribution.
 */
export async function initFacebookSdk(): Promise<void> {
  if (initialized || !FACEBOOK_CONFIGURED) return;
  const m = await loadFbSdk();
  const Settings = m?.Settings;
  if (!Settings?.initializeSDK) return;
  try {
    Settings.setAppID(FB_APP_ID);
    Settings.setClientToken(FB_CLIENT_TOKEN);
    // Belt-and-suspenders: the manifest already sets these, but assert them at
    // runtime too so attribution works regardless of build config drift.
    Settings.setAutoLogAppEventsEnabled(true);
    Settings.setAdvertiserIDCollectionEnabled(true);
    Settings.initializeSDK();
    initialized = true;
  } catch {
    // Native module unavailable or init failed — stay disabled silently.
  }
}

/** Log a custom app event (no-op until configured + initialized). */
export async function logFacebookEvent(name: string, params?: FbEventParams): Promise<void> {
  if (!FACEBOOK_CONFIGURED) return;
  const m = await loadFbSdk();
  try {
    if (params) m?.AppEventsLogger?.logEvent(name, params);
    else m?.AppEventsLogger?.logEvent(name);
  } catch {
    /* no-op */
  }
}

/** Log a purchase for value-based attribution / ROAS. */
export async function logFacebookPurchase(amount: number, currency: string, params?: FbEventParams): Promise<void> {
  if (!FACEBOOK_CONFIGURED) return;
  const m = await loadFbSdk();
  try {
    m?.AppEventsLogger?.logPurchase(amount, currency, params);
  } catch {
    /* no-op */
  }
}

/** Associate subsequent events with a user id (call after sign-in). */
export async function setFacebookUserId(userId: string | null): Promise<void> {
  if (!FACEBOOK_CONFIGURED) return;
  const m = await loadFbSdk();
  try {
    m?.AppEventsLogger?.setUserID(userId);
  } catch {
    /* no-op */
  }
}
