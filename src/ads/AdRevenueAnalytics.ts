import { logEvent, AnalyticsEvents } from "../lib/analytics";
import { AdFormat, AdNetwork } from "./MediationConfig";

const NETWORK_EVENT: Record<AdFormat, string> = {
  rewarded: AnalyticsEvents.REWARDED_AD_NETWORK,
  interstitial: AnalyticsEvents.INTERSTITIAL_AD_NETWORK,
  banner: AnalyticsEvents.BANNER_AD_NETWORK,
  native: AnalyticsEvents.NATIVE_AD_NETWORK,
  app_open: AnalyticsEvents.APP_OPEN_AD_NETWORK,
};

/**
 * Thin analytics surface for mediation/revenue events. All calls are
 * fire-and-forget and fail silently (analytics is never critical).
 */
export const AdRevenueAnalytics = {
  /** Which network served an impression of a given format. */
  networkImpression(format: AdFormat, network: AdNetwork) {
    logEvent(NETWORK_EVENT[format], { network });
    logEvent(AnalyticsEvents.IMPRESSION_LOGGED, { format, network });
  },

  /** Paid event: revenue value (in `currency`) for a format/network. */
  revenue(format: AdFormat, network: AdNetwork, value: number, currency: string) {
    logEvent(AnalyticsEvents.AD_REVENUE_RECEIVED, { format, network, value, currency });
  },

  ecpm(format: AdFormat, network: AdNetwork, ecpm: number) {
    logEvent(AnalyticsEvents.ECPM_RECEIVED, { format, network, ecpm });
  },

  mediationInitialized(networks: AdNetwork[]) {
    logEvent(AnalyticsEvents.MEDIATION_INITIALIZED, { networks: networks.join(",") });
  },
};
