import { loadAdsSdk, ADS_MODULE_AVAILABLE, AD_UNIT_IDS, AD_REQUEST_OPTIONS, NATIVE_ADS_ENABLED } from "./adConfig";

/**
 * Native ads. Native ads are rendered per-card (each <NativeAdCard/> owns its
 * own ad instance via the <NativeAdView/> in production). This singleton just
 * centralises creation + an availability flag, and stays Expo-Go-safe.
 *
 * Real native ads require a Native ad unit id (EXPO_PUBLIC_ADMOB_NATIVE_ANDROID).
 * Until one is set, production renders nothing (no slots are inserted), while
 * dev previews a "Sponsored" placeholder so placement can be reviewed.
 */
class NativeAdManagerImpl {
  /** True if native ads should be requested at runtime (prod + real unit id). */
  isEnabled(): boolean {
    return ADS_MODULE_AVAILABLE && NATIVE_ADS_ENABLED && AD_UNIT_IDS.native.length > 0;
  }

  /** Create + load a single native ad. Returns null when unavailable. */
  async createAd(): Promise<any | null> {
    if (!this.isEnabled()) return null;
    const m = await loadAdsSdk();
    if (!m) return null;
    try {
      return await m.NativeAd.createForAdRequest(AD_UNIT_IDS.native, AD_REQUEST_OPTIONS);
    } catch {
      return null;
    }
  }
}

export const NativeAdManager = new NativeAdManagerImpl();
