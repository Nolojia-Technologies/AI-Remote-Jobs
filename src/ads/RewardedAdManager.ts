import { loadAdsSdk, ADS_MODULE_AVAILABLE, AD_UNIT_IDS, AD_REQUEST_OPTIONS } from "./adConfig";
import { MediationManager } from "./MediationManager";

/**
 * Rewarded ads (highest priority, always optional). Singleton: keeps one
 * preloaded ad ready, shows it on demand, and immediately preloads the next.
 * Dedupes concurrent load requests and fails gracefully.
 */
class RewardedAdManagerImpl {
  private ad: any = null;
  private loaded = false;
  private loading = false;

  /** Preload the next rewarded ad (no-op in Expo Go / if already loading). */
  async preload(): Promise<void> {
    if (!ADS_MODULE_AVAILABLE || this.loading || this.loaded) return;
    const m = await loadAdsSdk();
    if (!m) return;
    this.loading = true;
    try {
      const { RewardedAd, RewardedAdEventType, AdEventType } = m;
      const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, AD_REQUEST_OPTIONS);
      MediationManager.recordRequest("rewarded");
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this.loaded = true;
        this.loading = false;
        MediationManager.recordFill("rewarded");
      });
      ad.addAdEventListener(AdEventType.ERROR, () => {
        this.loaded = false;
        this.loading = false;
        this.ad = null;
      });
      this.ad = ad;
      ad.load();
    } catch {
      this.loading = false;
      this.ad = null;
    }
  }

  isReady(): boolean {
    return this.loaded;
  }

  /**
   * Show the rewarded ad. Resolves true only if the reward was actually earned.
   * If no ad is ready, kicks a preload and resolves false (caller shows the
   * "ad unavailable" message). Always preloads the next ad afterwards.
   */
  async show(): Promise<boolean> {
    if (!ADS_MODULE_AVAILABLE) return true; // Expo Go stub: grant the reward so flows are testable
    const m = await loadAdsSdk();
    if (!m) return false;
    if (!this.loaded || !this.ad) {
      this.preload();
      return false;
    }
    const ad = this.ad;
    this.loaded = false;
    return new Promise<boolean>((resolve) => {
      let earned = false;
      let settled = false;
      const done = (v: boolean) => {
        if (settled) return;
        settled = true;
        this.ad = null;
        this.preload(); // reload immediately after display
        resolve(v);
      };
      try {
        const { RewardedAdEventType, AdEventType } = m;
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        });
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          MediationManager.recordImpression("rewarded", MediationManager.adapterClassOf(ad));
          done(earned);
        });
        ad.addAdEventListener(AdEventType.ERROR, () => done(false));
        ad.show();
      } catch {
        done(false);
      }
    });
  }
}

export const RewardedAdManager = new RewardedAdManagerImpl();
