import React from "react";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { AdUnitIds } from "../../lib/admob";
import { logEvent, AnalyticsEvents } from "../../lib/analytics";
import { MediationManager } from "../../ads/MediationManager";

// Only ever rendered in production EAS builds (required dynamically by AdBanner).
export function RealBanner() {
  return (
    <BannerAd
      unitId={AdUnitIds.BANNER}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      onAdLoaded={() => {
        logEvent(AnalyticsEvents.BANNER_IMPRESSION);
        MediationManager.recordFill("banner");
      }}
      onPaid={(event) =>
        MediationManager.recordImpression("banner", null, event.value, event.currency)
      }
    />
  );
}
