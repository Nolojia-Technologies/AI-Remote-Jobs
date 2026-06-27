import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Whether the native google-mobile-ads module is present. It ships in every
 * build EXCEPT Expo Go (the store client), where touching it would crash. We key
 * all native ad load/show paths off this — NOT __DEV__ — so a dev *client* build
 * renders real ads while Expo Go keeps lightweight stubs/placeholders. Combined
 * with USE_TEST_ADS (true while __DEV__), dev builds serve Google TEST ads.
 */
export const ADS_MODULE_AVAILABLE =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/**
 * AdMob configuration for "AI Remote Jobs".
 *
 * Real unit IDs are used in production builds; Google's official TEST units are
 * used in development (Expo Go / dev client) so we never serve — or accidentally
 * click — live ads while testing. The native SDK only exists in EAS builds, so
 * every runtime access goes through `loadAdsSdk()` which is a no-op in Expo Go.
 */

// ─── Real AdMob IDs (production) ───────────────────────────────
export const ADMOB_APP_ID_ANDROID = "ca-app-pub-9972540077910178~8539725754";

type AdKind = "rewarded" | "interstitial" | "appOpen" | "banner" | "native";

const PROD: Record<AdKind, string> = {
  rewarded: "ca-app-pub-9972540077910178/7094782146", // Rewarded XP
  interstitial: "ca-app-pub-9972540077910178/5278607369", // Interstitial Main
  appOpen: "ca-app-pub-9972540077910178/5058125837", // App Open
  banner: "ca-app-pub-9972540077910178/5797482113", // Banner Main
  native: "ca-app-pub-9972540077910178/1211471472", // Native Advanced
};

// ─── Google sample TEST units (development) ────────────────────
const TEST: Record<AdKind, string> = {
  rewarded: "ca-app-pub-3940256099942544/5224354917",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  appOpen: "ca-app-pub-3940256099942544/9257395921",
  banner: "ca-app-pub-3940256099942544/6300978111",
  native: "ca-app-pub-3940256099942544/2247696110",
};

// Force Google TEST ads even in a release build (safe-to-tap, always fill) so
// placement/behaviour can be verified without risking the AdMob/Meta account.
const FORCE_TEST_ADS = process.env.EXPO_PUBLIC_FORCE_TEST_ADS === "true";

// Test ads are used in dev (Expo Go) OR when explicitly forced via the flag.
export const USE_TEST_ADS = __DEV__ || FORCE_TEST_ADS;

// Optional per-platform env override (validated) → real → test.
function valid(id: string | undefined): id is string {
  return !!id && /^ca-app-pub-\d{10,}\/\d{5,}$/.test(id);
}
function unit(kind: AdKind, envId: string | undefined): string {
  if (USE_TEST_ADS) return TEST[kind];
  return valid(envId) ? envId : PROD[kind];
}

export const AD_UNIT_IDS = {
  rewarded: unit("rewarded", Platform.select({ android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID, ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS })),
  interstitial: unit("interstitial", Platform.select({ android: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID, ios: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS })),
  appOpen: unit("appOpen", Platform.select({ android: process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_ANDROID, ios: process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_IOS })),
  banner: unit("banner", Platform.select({ android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID, ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS })),
  native: unit("native", Platform.select({ android: process.env.EXPO_PUBLIC_ADMOB_NATIVE_ANDROID, ios: process.env.EXPO_PUBLIC_ADMOB_NATIVE_IOS })),
} as const;

// Native ads render in dev preview, when forcing test ads, or once a real
// native unit id is configured in production.
export const NATIVE_ADS_ENABLED = USE_TEST_ADS || AD_UNIT_IDS.native.length > 0;

// Priority order: rewarded is the primary revenue model.
export const AD_PRIORITY = ["rewarded", "interstitial", "app_open", "banner"] as const;

export const AD_UNAVAILABLE_MESSAGE = "Ad unavailable right now. Please try again in a moment.";

export const AD_REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true } as const;

// ─── Shared native-SDK loader (Expo-Go-safe) ───────────────────
// Returns the react-native-google-mobile-ads module, or null when the native
// module is unavailable (Expo Go / dev). Cached so we import at most once.
let sdkPromise: Promise<any | null> | null = null;
export function loadAdsSdk(): Promise<any | null> {
  if (!ADS_MODULE_AVAILABLE) return Promise.resolve(null); // Expo Go → no native module
  if (!sdkPromise) {
    sdkPromise = import("react-native-google-mobile-ads")
      .then((m) => m)
      .catch(() => null);
  }
  return sdkPromise;
}
