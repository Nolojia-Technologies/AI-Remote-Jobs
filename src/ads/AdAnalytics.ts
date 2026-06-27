import { useAdStore } from "../stores/adStore";
import { AD_CONFIG } from "./config";
import { AdAnalyticsSnapshot, AdType } from "./types";
import { logEvent } from "../lib/analytics";

/**
 * Revenue + performance analytics. Revenue is ESTIMATED from configured
 * eCPM so ARPDAU and per-type revenue can be surfaced without a real ad
 * network reporting hook. Swap `estimateRevenue` for live values later.
 */
export const AdAnalytics = {
  estimateRevenue(type: Exclude<AdType, "none">): number {
    return AD_CONFIG.ecpm[type] / 1000; // per single impression
  },

  /** Call when an ad impression is confirmed. Records revenue + event. */
  recordImpression(type: Exclude<AdType, "none">) {
    const revenue = this.estimateRevenue(type);
    useAdStore.getState().addRevenue(type, revenue);
    logEvent("ad_impression", { ad_type: type, est_revenue: revenue });
  },

  recordDecision(type: AdType, shown: boolean, reason: string) {
    logEvent("ad_decision", { ad_type: type, shown, reason });
  },

  snapshot(): AdAnalyticsSnapshot {
    const s = useAdStore.getState();
    const sessions = Math.max(1, s.lifetime.sessionCount);
    const totalAdsLifetime =
      s.lifetime.rewardedWatched +
      s.lifetime.interstitialsShown +
      s.lifetime.appOpenShown;
    const sessionMinutes = Math.max(0, (Date.now() - s.session.sessionStartAt) / 60000);

    return {
      arpdau: round(s.revenue.todayTotal), // single-device proxy for ARPDAU
      rewardedRevenue: round(s.revenue.byTypeLifetime.rewarded),
      interstitialRevenue: round(s.revenue.byTypeLifetime.interstitial),
      appOpenRevenue: round(s.revenue.byTypeLifetime.app_open),
      bannerRevenue: round(s.revenue.byTypeLifetime.banner),
      totalRevenue: round(s.revenue.lifetimeTotal),
      avgAdsPerSession: round(totalAdsLifetime / sessions),
      avgRewardedPerUser: round(s.lifetime.rewardedWatched),
      averageSessionMinutes: round(sessionMinutes),
      dailyTotalAds: s.daily.total,
    };
  },
};

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
