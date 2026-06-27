import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { AdScreen } from "../../ads/types";
import { useBannerEligible } from "../../hooks/useAds";
import { AdIntelligenceEngine } from "../../ads/AdIntelligenceEngine";
import { ADS_MODULE_AVAILABLE } from "../../ads/adConfig";

// The real AdMob <BannerAd> is loaded in any build that has the native module
// (dev client / preview / release) — never in Expo Go, where the module is
// absent. In dev builds it serves Google TEST ads (see USE_TEST_ADS).
let RealBanner: React.ComponentType | null = null;
if (ADS_MODULE_AVAILABLE) {
  try {
    RealBanner = require("./RealBanner").RealBanner;
  } catch {
    RealBanner = null;
  }
}

interface AdBannerProps {
  screen: AdScreen;
  className?: string;
}

/**
 * Adaptive banner slot. The engine decides eligibility by screen (lowest
 * priority, never on protected screens). Real AdMob banner in builds,
 * lightweight placeholder in Expo Go.
 */
export function AdBanner({ screen, className = "" }: AdBannerProps) {
  const eligible = useBannerEligible(screen);

  useEffect(() => {
    if (eligible) AdIntelligenceEngine.recordBannerImpression();
  }, [eligible, screen]);

  if (!eligible) return null;

  if (RealBanner) {
    return (
      <View className={`items-center justify-center ${className}`}>
        <RealBanner />
      </View>
    );
  }

  return (
    <View className={`h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center ${className}`}>
      <Text className="text-xs text-gray-400">Sponsored · Adaptive Banner</Text>
    </View>
  );
}
