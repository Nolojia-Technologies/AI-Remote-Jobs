import { AdDecision, AdState, BehaviorSnapshot, HighValueMoment } from "./types";
import { AdEligibilityService } from "./AdEligibilityService";

const none = (reason: string): AdDecision => ({ show: false, type: "none", reason });

/**
 * Decides WHICH ad (if any) to show, layering user-type modifiers and
 * engagement protection on top of the hard eligibility rules.
 *
 * Priority of ad types: rewarded > interstitial > app_open > banner.
 * Rewarded is always user-initiated (handled directly by the engine),
 * so this service arbitrates the auto-shown types.
 */
export const AdDecisionService = {
  /**
   * Interstitial decision. The engine has already decided this is a trigger
   * point (action-counter reached / forced high-value moment); here we only
   * enforce the hard gates. Dormant users are routed to app-open instead.
   */
  decideInterstitial(
    state: AdState,
    snapshot: BehaviorSnapshot,
    moment: HighValueMoment,
    now: number
  ): AdDecision {
    const elig = AdEligibilityService.interstitial(state, snapshot, now);
    if (!elig.eligible) return none(elig.reason);
    if (state.userType === "dormant") return none("dormant prefers app-open");
    return { show: true, type: "interstitial", reason: "eligible", moment };
  },

  /** App-open ad on resume after inactivity. */
  decideAppOpen(state: AdState, snapshot: BehaviorSnapshot, now: number): AdDecision {
    const elig = AdEligibilityService.appOpen(state, snapshot, now);
    if (!elig.eligible) return none(elig.reason);
    return { show: true, type: "app_open", reason: "eligible" };
  },

  /** Banner is passive/lowest priority — purely screen-based. */
  decideBanner(state: AdState): AdDecision {
    const elig = AdEligibilityService.banner(state.session.currentScreen);
    return elig.eligible
      ? { show: true, type: "banner", reason: "eligible" }
      : none(elig.reason);
  },
};
