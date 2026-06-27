/**
 * Mediation configuration.
 *
 * Bidding is performed by the Google Mobile Ads SDK (AdMob as the mediation
 * host). We never hardcode network priorities in JS — the SDK runs the
 * real-time auction and serves the highest-paying network. This file declares
 * the network REGISTRY so revenue/attribution works and so new networks can be
 * added later (Unity, AppLovin, Pangle, Mintegral, ironSource) by flipping a
 * flag + adding the native adapter — without rewriting the system.
 */

export type AdNetwork =
  | "admob"
  | "meta"
  | "unity"
  | "applovin"
  | "pangle"
  | "mintegral"
  | "ironsource"
  | "unknown";

export type AdFormat = "rewarded" | "interstitial" | "banner" | "native" | "app_open";

export interface NetworkDef {
  id: AdNetwork;
  label: string;
  enabled: boolean; // adapter included in the build + dashboard mediation group
  bidding: boolean; // participates in real-time bidding
  formats: AdFormat[]; // formats this network competes for
  /** Lowercased substrings used to map an AdMob adapter class name → this network. */
  match: string[];
}

const env = (k: string) => process.env[k] === "true";

// Meta Audience Network turns on once you've: created Meta placements, built a
// mediation group in the AdMob console, added the adapter to the build, and set
// EXPO_PUBLIC_ENABLE_META_MEDIATION=true.
export const META_ENABLED = env("EXPO_PUBLIC_ENABLE_META_MEDIATION");

export const NETWORKS: NetworkDef[] = [
  {
    id: "admob",
    label: "Google AdMob",
    enabled: true,
    bidding: true,
    formats: ["rewarded", "interstitial", "banner", "native", "app_open"],
    match: ["admob", "google", "gms", "admobadapter"],
  },
  {
    id: "meta",
    label: "Meta Audience Network",
    enabled: META_ENABLED,
    bidding: true,
    // App Open stays AdMob-only by design.
    formats: ["rewarded", "interstitial", "banner", "native"],
    match: ["facebook", "meta", "audiencenetwork"],
  },
  // ─── Future networks (add adapter + flip enabled, no code rewrite) ───
  { id: "unity", label: "Unity Ads", enabled: false, bidding: true, formats: ["rewarded", "interstitial", "banner"], match: ["unity"] },
  { id: "applovin", label: "AppLovin", enabled: false, bidding: true, formats: ["rewarded", "interstitial", "banner", "native"], match: ["applovin"] },
  { id: "pangle", label: "Pangle", enabled: false, bidding: true, formats: ["rewarded", "interstitial", "banner", "native"], match: ["pangle"] },
  { id: "mintegral", label: "Mintegral", enabled: false, bidding: true, formats: ["rewarded", "interstitial", "banner", "native"], match: ["mintegral", "mbridge"] },
  { id: "ironsource", label: "ironSource", enabled: false, bidding: true, formats: ["rewarded", "interstitial", "banner"], match: ["ironsource"] },
];

export const ENABLED_NETWORKS = NETWORKS.filter((n) => n.enabled);

/** Map an AdMob mediation adapter class name → our network id. */
export function networkFromAdapter(adapterClassName?: string | null): AdNetwork {
  if (!adapterClassName) return "admob"; // served directly by the mediation host
  const lc = adapterClassName.toLowerCase();
  for (const n of NETWORKS) {
    if (n.match.some((m) => lc.includes(m))) return n.id;
  }
  return "unknown";
}

export function networkLabel(id: AdNetwork): string {
  return NETWORKS.find((n) => n.id === id)?.label ?? "Unknown";
}
