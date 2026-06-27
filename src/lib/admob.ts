import { AD_UNIT_IDS } from "../ads/adConfig";
import { AdManager } from "../ads/AdManager";
import { RewardedAdManager } from "../ads/RewardedAdManager";
import { InterstitialAdManager } from "../ads/InterstitialAdManager";
import { AppOpenAdManager } from "../ads/AppOpenAdManager";

/**
 * Back-compat facade. The real implementation now lives in the singleton
 * managers under src/ads/. These exports keep existing call sites (the banner
 * component, the engine) working while delegating to the preloading managers.
 */
export const AdUnitIds = {
  BANNER: AD_UNIT_IDS.banner,
  INTERSTITIAL: AD_UNIT_IDS.interstitial,
  REWARDED: AD_UNIT_IDS.rewarded,
  APP_OPEN: AD_UNIT_IDS.appOpen,
};

export async function initializeAds(): Promise<void> {
  await AdManager.init();
}

export const AdMob = {
  showInterstitial: (): Promise<boolean> => InterstitialAdManager.show(),
  showRewarded: (): Promise<boolean> => RewardedAdManager.show(),
  showAppOpen: (): Promise<boolean> => AppOpenAdManager.show(),
  rewardedReady: (): boolean => RewardedAdManager.isReady(),
};
