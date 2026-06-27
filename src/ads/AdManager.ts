import { loadAdsSdk, ADS_MODULE_AVAILABLE } from "./adConfig";
import { RewardedAdManager } from "./RewardedAdManager";
import { InterstitialAdManager } from "./InterstitialAdManager";
import { AppOpenAdManager } from "./AppOpenAdManager";
import { MediationManager } from "./MediationManager";

/**
 * Top-level ad orchestrator (singleton). Initializes the Google Mobile Ads SDK
 * once, then preloads the full-screen ad types in priority order
 * (rewarded → interstitial → app-open). No-op in Expo Go.
 */
class AdManagerImpl {
  private initialized = false;
  private initializing: Promise<void> | null = null;

  async init(): Promise<void> {
    if (!ADS_MODULE_AVAILABLE || this.initialized) return;
    if (this.initializing) return this.initializing;
    this.initializing = (async () => {
      const m = await loadAdsSdk();
      if (!m) return;
      try {
        const statuses = await m.default().initialize();
        this.initialized = true;
        // Register mediation adapters (AdMob + Meta + any future networks).
        MediationManager.init(statuses);
        // Preload by priority: rewarded is the primary revenue model.
        RewardedAdManager.preload();
        InterstitialAdManager.preload();
        AppOpenAdManager.preload();
      } catch {
        // SDK init failed (e.g. missing config) — leave uninitialized; managers
        // will retry their own preloads on demand.
      }
    })();
    return this.initializing;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Thin show facade (decision logic lives in AdIntelligenceEngine).
  showRewarded(): Promise<boolean> {
    return RewardedAdManager.show();
  }
  showInterstitial(): Promise<boolean> {
    return InterstitialAdManager.show();
  }
  showAppOpen(): Promise<boolean> {
    return AppOpenAdManager.show();
  }

  rewardedReady(): boolean {
    return RewardedAdManager.isReady();
  }
}

export const AdManager = new AdManagerImpl();
