import { AD_UNIT_IDS } from "./adConfig";

/**
 * Banner ads (lowest priority). Banners render via the <BannerAd> component
 * (see components/ads/RealBanner.tsx); this singleton centralises the unit id,
 * the adaptive size, and request options so the component stays declarative.
 */
class BannerAdManagerImpl {
  readonly unitId = AD_UNIT_IDS.banner;
  /** Anchored adaptive banner — best fill + UX for a bottom anchor. */
  readonly size = "ANCHORED_ADAPTIVE_BANNER";
  readonly requestOptions = { requestNonPersonalizedAdsOnly: true };

  getUnitId(): string {
    return this.unitId;
  }
}

export const BannerAdManager = new BannerAdManagerImpl();
