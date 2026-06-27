import React from "react";
import { View, Text } from "react-native";
import { NativeAdManager } from "../../ads/NativeAdManager";
import { ADS_MODULE_AVAILABLE } from "../../ads/adConfig";

// Real native ads mount whenever the native module is present (dev client /
// preview / release) and native ads are enabled — never in Expo Go. In dev
// builds NativeAdManager.isEnabled() is true via test units, so a real TEST
// native ad renders.
let RealNativeAd: React.ComponentType | null = null;
if (ADS_MODULE_AVAILABLE && NativeAdManager.isEnabled()) {
  try {
    RealNativeAd = require("./RealNativeAd").RealNativeAd;
  } catch {
    RealNativeAd = null;
  }
}

/**
 * Drop-in native ad card. Blends with content (resembles a job/course card).
 * - Dev (Expo Go): a labelled "Sponsored" placeholder so placement is visible.
 * - Production with a native unit id: a real native ad.
 * - Production without one: renders nothing.
 */
export function NativeAdCard() {
  if (RealNativeAd) return <RealNativeAd />;
  if (ADS_MODULE_AVAILABLE) return null; // real build w/ native ads off → render nothing

  // Expo Go placeholder (no native module)
  return (
    <View className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-bold uppercase tracking-wide text-gray-400">Sponsored</Text>
        <Text className="text-[10px] text-gray-400">Native ad</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
          <Text className="text-lg">📣</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">Your ad could be here</Text>
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            Native ad slot — shows a real ad in production
          </Text>
        </View>
      </View>
    </View>
  );
}
