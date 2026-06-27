import { Linking, Platform } from "react-native";
import { RATING_CONFIG } from "./config";

/**
 * Store-listing launcher for the rating flow.
 *
 * On the explicit "Rate App" tap we send the user straight to the store listing
 * (preferring the native store app, falling back to the https URL). This is
 * deterministic — unlike the Google In-App Review API, which is quota-limited,
 * can silently show nothing, and disallows a preceding custom prompt like ours.
 */

/** The public Play Store / App Store listing URL for this app. */
export function storeListingUrl(): string {
  if (Platform.OS === "android") {
    return `https://play.google.com/store/apps/details?id=${RATING_CONFIG.android.packageName}`;
  }
  // iOS App Store URL — slot in the numeric app id once published.
  return "https://apps.apple.com/app/id000000000?action=write-review";
}

/** The native deep link that opens the store app directly (no browser). */
function storeDeepLink(): string {
  if (Platform.OS === "android") {
    return `market://details?id=${RATING_CONFIG.android.packageName}`;
  }
  return "itms-apps://itunes.apple.com/app/id000000000?action=write-review";
}

/**
 * Open the store listing for the user to rate (prefers the native store app,
 * falls back to the https listing). Returns whether anything was launched.
 * Never throws.
 */
export async function openStoreListing(): Promise<boolean> {
  try {
    const deepLink = storeDeepLink();
    if (await Linking.canOpenURL(deepLink)) {
      await Linking.openURL(deepLink);
      return true;
    }
  } catch {
    // fall through to https
  }
  try {
    await Linking.openURL(storeListingUrl());
    return true;
  } catch {
    return false;
  }
}
