import { loadAdsSdk, ADS_MODULE_AVAILABLE, AD_UNIT_IDS, AD_REQUEST_OPTIONS } from "./adConfig";
import { MediationManager } from "./MediationManager";

// AdMob app-open ads expire ~4h after load.
const EXPIRY_MS = 4 * 60 * 60 * 1000;

/**
 * App-open ads (third priority). Singleton preloaded in the background. The
 * engine gates *when* it may show (≥4h inactivity, not first launch, etc.);
 * this manages load/expiry/show and skips gracefully when unavailable.
 */
class AppOpenAdManagerImpl {
  private ad: any = null;
  private loaded = false;
  private loading = false;
  private loadedAt = 0;

  async preload(): Promise<void> {
    if (!ADS_MODULE_AVAILABLE || this.loading) return;
    if (this.loaded && Date.now() - this.loadedAt < EXPIRY_MS) return; // still fresh
    const m = await loadAdsSdk();
    if (!m) return;
    this.loading = true;
    try {
      const { AppOpenAd, AdEventType } = m;
      const ad = AppOpenAd.createForAdRequest(AD_UNIT_IDS.appOpen, AD_REQUEST_OPTIONS);
      MediationManager.recordRequest("app_open");
      ad.addAdEventListener(AdEventType.LOADED, () => {
        this.loaded = true;
        this.loading = false;
        this.loadedAt = Date.now();
        MediationManager.recordFill("app_open");
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
    return this.loaded && Date.now() - this.loadedAt < EXPIRY_MS;
  }

  async show(): Promise<boolean> {
    if (!ADS_MODULE_AVAILABLE) return false; // no native module in Expo Go
    const m = await loadAdsSdk();
    if (!m) return false;
    if (!this.isReady() || !this.ad) {
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
          MediationManager.recordImpression("app_open", MediationManager.adapterClassOf(ad));
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

export const AppOpenAdManager = new AppOpenAdManagerImpl();
