import { AdState, AdType } from "./types";
import {
  AD_CONFIG,
  interstitialCooldownMs,
  interstitialDailyLimit,
  interstitialSessionCap,
} from "./config";

const DAY = 24 * 3600_000;

/**
 * Time-based cooldowns and caps. Pure: every method takes state (+ now)
 * and returns a boolean / number.
 */
export const AdCooldownManager = {
  msSince(ts: number | null, now: number): number {
    return ts === null ? Infinity : now - ts;
  },

  /** Day-number since first use (1-based). */
  dayNumber(state: AdState, now: number): number {
    if (!state.firstUseDate) return 1;
    const first = new Date(state.firstUseDate).getTime();
    return Math.max(1, Math.floor((now - first) / DAY) + 1);
  },

  /** Interstitial cooldown adapts to the user type. */
  interstitialCooldownPassed(state: AdState, now: number): boolean {
    const cd = interstitialCooldownMs(state.userType);
    return this.msSince(state.timestamps.lastInterstitialAt, now) >= cd;
  },

  /** Daily cap (Day 1: 8, Day 2: 12, Day 3+: 15, power/whale: 20). */
  interstitialWithinDaily(state: AdState, now: number): boolean {
    const limit = interstitialDailyLimit(state.userType, this.dayNumber(state, now));
    return state.daily.interstitial < limit;
  },

  /** Session-length distribution cap (cumulative this session). */
  interstitialWithinSessionCap(state: AdState, now: number): boolean {
    const sessionMs = now - state.session.sessionStartAt;
    return state.session.interstitialsThisSession < interstitialSessionCap(sessionMs);
  },

  appOpenInactivityMet(state: AdState, now: number): boolean {
    return this.msSince(state.timestamps.lastActiveAt, now) >= AD_CONFIG.appOpen.inactivityMs;
  },

  interstitialJustShown(state: AdState, now: number): boolean {
    return this.msSince(state.timestamps.lastInterstitialAt, now) < AD_CONFIG.appOpen.interstitialGuardMs;
  },

  withinDailyLimit(type: Exclude<AdType, "none" | "banner">, state: AdState, now: number): boolean {
    switch (type) {
      case "rewarded":
        return state.daily.rewarded < AD_CONFIG.rewarded.dailyLimit;
      case "interstitial":
        return this.interstitialWithinDaily(state, now);
      case "app_open":
        return state.daily.appOpen < AD_CONFIG.appOpen.dailyLimit;
      default:
        return true;
    }
  },
};
