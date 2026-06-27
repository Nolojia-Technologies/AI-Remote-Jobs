import { AdFormat, AdNetwork, NETWORKS, networkFromAdapter } from "./MediationConfig";
import { MetaAudienceNetworkManager } from "./MetaAudienceNetworkManager";
import { RevenueTracker } from "./RevenueTracker";
import { AdRevenueAnalytics } from "./AdRevenueAnalytics";

/**
 * Network-agnostic mediation orchestration layer.
 *
 * The Google Mobile Ads SDK runs the real-time auction across all enabled
 * bidding networks (AdMob, Meta, …) and serves the highest payer. This manager
 * sits ON TOP of the existing per-format managers and:
 *   - records which adapters initialized (network readiness),
 *   - attributes each impression to the network that served it,
 *   - funnels revenue/impressions into the RevenueTracker + analytics.
 *
 * Adding a network later (Unity/AppLovin/Pangle/Mintegral/ironSource) is just:
 * add the adapter to the build + flip `enabled` in MediationConfig — no changes
 * here or at any call site.
 */
class MediationManagerImpl {
  private ready = new Set<AdNetwork>(["admob"]);

  /**
   * Called after `mobileAds().initialize()` with its adapter statuses map:
   * `{ [adapterClassName]: { description, state } }` (state 1 = READY).
   */
  init(adapterStatuses?: any) {
    this.ready = new Set<AdNetwork>(["admob"]);
    try {
      // initialize() may resolve to an array of statuses OR a name→status map.
      const entries: [string, any][] = Array.isArray(adapterStatuses)
        ? adapterStatuses.map((s: any) => [s?.name ?? s?.description ?? "", s])
        : adapterStatuses
        ? Object.entries(adapterStatuses)
        : [];
      for (const [name, status] of entries) {
        const isReady = status?.state === 1 || /ready/i.test(status?.description ?? "");
        if (isReady) this.ready.add(networkFromAdapter(name));
      }
    } catch {
      /* defensive — never block init */
    }
    MetaAudienceNetworkManager.setAdapterReady(this.ready.has("meta"));
    AdRevenueAnalytics.mediationInitialized(this.readyNetworks());
  }

  readyNetworks(): AdNetwork[] {
    return NETWORKS.filter((n) => n.enabled && this.ready.has(n.id)).map((n) => n.id);
  }

  isNetworkReady(id: AdNetwork): boolean {
    return this.ready.has(id);
  }

  /** Resolve the serving network from an ad's mediation adapter class name. */
  attribute(adapterClassName?: string | null): AdNetwork {
    return networkFromAdapter(adapterClassName);
  }

  /** Best-effort read of the serving adapter class from a loaded ad object. */
  adapterClassOf(ad: any): string | null {
    try {
      return (
        ad?.responseInfo?.loadedAdapterResponseInfo?.adSourceName ??
        ad?.responseInfo?.mediationAdapterClassName ??
        null
      );
    } catch {
      return null;
    }
  }

  // ─── Funnel impressions/revenue from the format managers ──────
  recordRequest(format: AdFormat) {
    void RevenueTracker.recordRequest(format);
  }
  recordFill(format: AdFormat) {
    void RevenueTracker.recordFill(format);
  }
  recordImpression(format: AdFormat, adapterClassName?: string | null, revenue = 0, currency = "USD") {
    void RevenueTracker.recordImpression(format, this.attribute(adapterClassName), revenue, currency);
  }
  recordClick(format: AdFormat, adapterClassName?: string | null) {
    void RevenueTracker.recordClick(format, this.attribute(adapterClassName));
  }

  getStats() {
    return RevenueTracker.getStats();
  }
}

export const MediationManager = new MediationManagerImpl();
