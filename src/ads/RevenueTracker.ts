import AsyncStorage from "@react-native-async-storage/async-storage";
import { AdFormat, AdNetwork } from "./MediationConfig";
import { AdRevenueAnalytics } from "./AdRevenueAnalytics";

const KEY = "@aha/ad-revenue/v1";

interface Counters {
  revenue: number;
  impressions: number;
  clicks: number;
}
const zero = (): Counters => ({ revenue: 0, impressions: 0, clicks: 0 });

interface PeriodAgg {
  key: string; // date / week-start / month-start
  revenue: number;
  impressions: number;
}

interface RevenueState {
  byNetwork: Record<string, Counters>;
  byFormat: Record<string, Counters>;
  requests: number;
  fills: number;
  daily: PeriodAgg;
  weekly: PeriodAgg;
  monthly: PeriodAgg;
  lifetimeRevenue: number;
  lifetimeImpressions: number;
}

function today() {
  return new Date().toISOString().split("T")[0];
}
function weekStart() {
  const d = new Date();
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}
function monthStart() {
  return new Date().toISOString().slice(0, 7); // yyyy-mm
}

function emptyState(): RevenueState {
  return {
    byNetwork: {},
    byFormat: {},
    requests: 0,
    fills: 0,
    daily: { key: today(), revenue: 0, impressions: 0 },
    weekly: { key: weekStart(), revenue: 0, impressions: 0 },
    monthly: { key: monthStart(), revenue: 0, impressions: 0 },
    lifetimeRevenue: 0,
    lifetimeImpressions: 0,
  };
}

/**
 * Tracks ad revenue/impressions/clicks per network + format, plus daily/weekly/
 * monthly aggregates, eCPM and fill rate. Best-effort in-app view of revenue
 * (paid events surface what the SDK exposes); the AdMob console remains the
 * source of truth. Self-contained singleton, persisted to AsyncStorage.
 */
class RevenueTrackerImpl {
  private state: RevenueState = emptyState();
  private hydrated = false;

  private async ensure() {
    if (this.hydrated) return;
    this.hydrated = true;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) this.state = { ...emptyState(), ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    this.rollPeriods();
  }

  private rollPeriods() {
    const s = this.state;
    if (s.daily.key !== today()) s.daily = { key: today(), revenue: 0, impressions: 0 };
    if (s.weekly.key !== weekStart()) s.weekly = { key: weekStart(), revenue: 0, impressions: 0 };
    if (s.monthly.key !== monthStart()) s.monthly = { key: monthStart(), revenue: 0, impressions: 0 };
  }

  private persist() {
    AsyncStorage.setItem(KEY, JSON.stringify(this.state)).catch(() => {});
  }

  /** Call when an ad is requested (for fill-rate). */
  async recordRequest(_format: AdFormat) {
    await this.ensure();
    this.state.requests += 1;
    this.persist();
  }

  /** Call when an ad fills (loads) — for fill-rate. */
  async recordFill(_format: AdFormat) {
    await this.ensure();
    this.state.fills += 1;
    this.persist();
  }

  /**
   * Record a shown impression with best-effort network attribution and optional
   * paid-event revenue (in `currency`). Updates all aggregates + analytics.
   */
  async recordImpression(format: AdFormat, network: AdNetwork, revenue = 0, currency = "USD") {
    await this.ensure();
    this.rollPeriods();
    const s = this.state;

    const net = (s.byNetwork[network] ??= zero());
    const fmt = (s.byFormat[format] ??= zero());
    net.impressions += 1;
    fmt.impressions += 1;
    net.revenue += revenue;
    fmt.revenue += revenue;

    s.daily.impressions += 1;
    s.weekly.impressions += 1;
    s.monthly.impressions += 1;
    s.daily.revenue += revenue;
    s.weekly.revenue += revenue;
    s.monthly.revenue += revenue;
    s.lifetimeImpressions += 1;
    s.lifetimeRevenue += revenue;

    this.persist();

    AdRevenueAnalytics.networkImpression(format, network);
    if (revenue > 0) {
      AdRevenueAnalytics.revenue(format, network, revenue, currency);
      AdRevenueAnalytics.ecpm(format, network, this.ecpm(net));
    }
  }

  async recordClick(format: AdFormat, network: AdNetwork) {
    await this.ensure();
    (this.state.byNetwork[network] ??= zero()).clicks += 1;
    (this.state.byFormat[format] ??= zero()).clicks += 1;
    this.persist();
  }

  private ecpm(c: Counters): number {
    return c.impressions > 0 ? (c.revenue / c.impressions) * 1000 : 0;
  }

  /** Snapshot for a future revenue dashboard. */
  getStats() {
    const s = this.state;
    const fillRate = s.requests > 0 ? s.fills / s.requests : 0;
    return {
      byNetwork: s.byNetwork,
      byFormat: s.byFormat,
      fillRate,
      daily: s.daily,
      weekly: s.weekly,
      monthly: s.monthly,
      lifetimeRevenue: s.lifetimeRevenue,
      lifetimeImpressions: s.lifetimeImpressions,
      overallEcpm: s.lifetimeImpressions > 0 ? (s.lifetimeRevenue / s.lifetimeImpressions) * 1000 : 0,
    };
  }
}

export const RevenueTracker = new RevenueTrackerImpl();
