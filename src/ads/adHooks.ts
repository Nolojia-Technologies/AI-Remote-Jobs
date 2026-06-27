/**
 * Reusable ad hooks — single import surface for screens/components.
 * The implementations live in src/hooks/useAds.ts (they touch React + stores);
 * this re-exports them under src/ads/ alongside the rest of the ad system, and
 * adds a couple of manager-backed helpers.
 */
export {
  useRewardedAd,
  useRewardedBonusXp,
  useAdBonusStatus,
  useInterstitialMoment,
  useBannerEligible,
  useAdAnalytics,
  useEngagement,
  useAdAction,
  reportAdAction,
} from "../hooks/useAds";

import { AdManager } from "./AdManager";
import { BannerAdManager } from "./BannerAdManager";

/** Initialise + preload the whole ad system (call once on app start). */
export function initAds(): Promise<void> {
  return AdManager.init();
}

/** The adaptive banner unit id (for the <BannerAd> component). */
export function bannerUnitId(): string {
  return BannerAdManager.getUnitId();
}
