import { META_ENABLED } from "./MediationConfig";

/**
 * Meta Audience Network (via AdMob mediation bidding).
 *
 * IMPORTANT: With AdMob as the mediation host, Meta ads are served by the
 * Google Mobile Ads SDK through the Meta adapter — there is no separate JS
 * "show a Meta ad" call. This manager therefore reports adapter status and
 * holds Meta-specific compliance/test config. Real bidding requires:
 *   1. A Meta Audience Network account + app/placements.
 *   2. An AdMob mediation group wiring Meta as a bidding source.
 *   3. The Meta adapter in the native build (config plugin, flag-gated).
 *   4. EXPO_PUBLIC_ENABLE_META_MEDIATION=true.
 */
class MetaAudienceNetworkManagerImpl {
  private adapterReady = false;

  isEnabled(): boolean {
    return META_ENABLED;
  }

  /** Called with the AdMob adapter-initialization result. */
  setAdapterReady(ready: boolean) {
    this.adapterReady = ready;
  }

  isReady(): boolean {
    return META_ENABLED && this.adapterReady;
  }

  status(): { enabled: boolean; adapterReady: boolean } {
    return { enabled: META_ENABLED, adapterReady: this.adapterReady };
  }
}

export const MetaAudienceNetworkManager = new MetaAudienceNetworkManagerImpl();
