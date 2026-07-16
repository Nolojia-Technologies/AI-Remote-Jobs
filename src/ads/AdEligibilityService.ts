import { AdScreen, AdState, BehaviorSnapshot, EligibilityResult } from "./types";
import { PROTECTED_SCREENS, BANNER_SCREENS } from "./config";
import { AdCooldownManager } from "./AdCooldownManager";

const ok = (): EligibilityResult => ({ eligible: true, reason: "ok" });
const no = (reason: string): EligibilityResult => ({ eligible: false, reason });

/**
 * Hard eligibility gates per ad type. Pure functions — no side effects.
 * The interstitial *trigger* (action-counter / forced moments) lives in the
 * engine; this only enforces the non-negotiable guards: protected screen,
 * per-type cooldown, day-based daily cap, and session-length distribution cap.
 */
export const AdEligibilityService = {
  banner(screen: AdScreen): EligibilityResult {
    return BANNER_SCREENS.includes(screen) ? ok() : no(`banner not allowed on ${screen}`);
  },

  interstitial(state: AdState, _snapshot: BehaviorSnapshot, now: number): EligibilityResult {
    const screen = state.session.currentScreen;
    if (PROTECTED_SCREENS.includes(screen)) return no(`protected screen: ${screen}`);
    if (!AdCooldownManager.interstitialCooldownPassed(state, now)) return no("cooldown active");
    if (!AdCooldownManager.interstitialWithinDaily(state, now)) return no("daily interstitial limit reached");
    if (!AdCooldownManager.interstitialWithinSessionCap(state, now)) return no("session distribution cap reached");
    return ok();
  },

  appOpen(state: AdState, snapshot: BehaviorSnapshot, now: number): EligibilityResult {
    // Fires on EVERY open (launch + resume) for all users. Only exceptions:
    // the very first session after install, an interstitial in the last 10s
    // (back-to-back ads are what AdMob flags), and sub-30s background blips
    // (share sheet / sign-in dialogs briefly background the app).
    if (snapshot.sessionCount <= 1) return no("first session");
    if (AdCooldownManager.interstitialJustShown(state, now)) return no("interstitial just shown");
    if (!AdCooldownManager.appOpenInactivityMet(state, now)) return no("not inactive long enough");
    if (!AdCooldownManager.withinDailyLimit("app_open", state, now)) return no("daily app-open limit reached");
    return ok();
  },

  /** Rewarded ads are always available (highest priority, never forced). */
  rewarded(): EligibilityResult {
    return ok();
  },
};
