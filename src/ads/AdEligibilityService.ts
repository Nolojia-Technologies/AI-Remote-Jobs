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
    const screen = state.session.currentScreen;
    if (snapshot.sessionCount <= 1) return no("first session");
    if (state.session.cameFromNotification) return no("came from notification");
    if (screen === "lesson" || screen === "quiz") return no("user is learning");
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
