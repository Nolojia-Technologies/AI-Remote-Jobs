import { loadAdsSdk, ADS_MODULE_AVAILABLE, AD_UNIT_IDS, AD_REQUEST_OPTIONS } from "./adConfig";
import { MediationManager } from "./MediationManager";

/**
 * Interstitial ads (secondary revenue). Singleton, preloaded, auto-reloads
 * after each display. The Ad Intelligence Engine decides *when* to call show();
 * this just manages the ad lifecycle.
 */
class InterstitialAdManagerImpl {
  private ad: any = null;
  private loaded = false;
  private loading = false;

  async preload(): Promise<void> {
    if (!ADS_MODULE_AVAILABLE || this.loading || this.loaded) return;
    const m = await loadAdsSdk();
    if (!m) return;
    this.loading = true;
    try {
      const { InterstitialAd, AdEventType } = m;
      const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, AD_REQUEST_OPTIONS);
      MediationManager.recordRequest("interstitial");
      ad.addAdEventListener(AdEventType.LOADED, () => {
        this.loaded = true;
        this.loading = false;
        MediationManager.recordFill("interstitial");
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

  /** Show if ready; resolves true if displayed. Always preloads the next one. */
  async show(): Promise<boolean> {
    if (!ADS_MODULE_AVAILABLE) {
      console.log("[Ads] Interstitial (Expo Go stub)");
      return true;
    }
    const m = await loadAdsSdk();
    if (!m) return false;
    if (!this.loaded || !this.ad) {
      this.preload();
      return false;
    }
    const ad = this.ad;
    this.loaded = false;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (v: boolean) => {
        if (settled) return;
        settled = true;
        this.ad = null;
        this.preload();
        resolve(v);
      };
      try {
        const { AdEventType } = m;
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          MediationManager.recordImpression("interstitial", MediationManager.adapterClassOf(ad));
          done(true);
        });
        ad.addAdEventListener(AdEventType.ERROR, () => done(false));
        ad.show();
      } catch {
        done(false);
      }
    });
  }
}

export const InterstitialAdManager = new InterstitialAdManagerImpl();
