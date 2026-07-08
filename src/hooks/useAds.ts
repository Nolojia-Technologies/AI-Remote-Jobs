import { useCallback } from "react";
import { Alert } from "react-native";
import { AdIntelligenceEngine } from "../ads/AdIntelligenceEngine";
import { useAdStore } from "../stores/adStore";
import { grantAdBonusXp } from "../ads/adXp";
import { RewardedAdManager } from "../ads/RewardedAdManager";
import { AD_UNAVAILABLE_MESSAGE, ADS_MODULE_AVAILABLE } from "../ads/adConfig";
import { AdScreen, HighValueMoment, MeaningfulAction, RewardedTrigger } from "../ads/types";
import { useUserStore } from "../stores/userStore";

/** True if a rewarded ad can be shown right now (always true in the Expo Go stub). */
function rewardedAvailable(): boolean {
  return !ADS_MODULE_AVAILABLE || AdIntelligenceEngine.rewardedReady();
}

/** Standard "ad unavailable" message + kick a preload for next time. */
function notifyAdUnavailable(): void {
  RewardedAdManager.preload();
  Alert.alert("Ad unavailable", AD_UNAVAILABLE_MESSAGE);
}

/**
 * Watch a rewarded ad for a SMALL escalating bonus XP (5/5/10/10/15, capped
 * 5 ads & 45 XP per day). Returns the XP granted: -1 = ad not watched,
 * 0 = daily cap reached, >0 = XP added.
 */
export function useRewardedBonusXp() {
  return useCallback(async (userId: string): Promise<number> => {
    if (!rewardedAvailable()) {
      notifyAdUnavailable();
      return -1;
    }
    const watched = await AdIntelligenceEngine.showRewarded("bonus_xp");
    if (!watched) return -1;
    return grantAdBonusXp(userId);
  }, []);
}

/** Today's remaining bonus-XP availability (for UI gating). */
export function useAdBonusStatus() {
  useAdStore((s) => s.adXp.todayCount);
  const adXp = useAdStore((s) => s.adXp);
  const next = useAdStore.getState().nextAdBonus();
  return { todayXp: adXp.todayXp, todayCount: adXp.todayCount, nextBonus: next, capReached: next <= 0 };
}

/**
 * Offer to DOUBLE just-earned XP via an opt-in rewarded ad. Call it right after
 * awarding the base XP; it prompts, and on accept + a completed ad it grants an
 * additional `amount` (so total = 2×). Resolves true when doubled.
 */
export function useDoubleXp() {
  return useCallback(
    (userId: string, amount: number, description = "Double XP"): Promise<boolean> => {
      if (amount <= 0) return Promise.resolve(false);
      return new Promise((resolve) => {
        Alert.alert(
          "Double your XP? ⚡",
          `You earned +${amount} XP. Watch a short ad to make it +${amount * 2}.`,
          [
            { text: "No thanks", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Double it ▶",
              onPress: async () => {
                if (!rewardedAvailable()) {
                  notifyAdUnavailable();
                  resolve(false);
                  return;
                }
                const watched = await AdIntelligenceEngine.showRewarded("double_xp");
                if (watched) {
                  await useUserStore.getState().awardXP(userId, amount, "double_xp", description);
                  resolve(true);
                } else {
                  resolve(false);
                }
              },
            },
          ],
          { cancelable: true, onDismiss: () => resolve(false) }
        );
      });
    },
    []
  );
}

/**
 * Report a meaningful action to the interstitial action-counter. The engine
 * decides whether to surface an interstitial (counter threshold, Jobs view
 * quota, or forced high-value moment) while respecting cooldown / caps /
 * protected screens. Fire-and-forget from anywhere.
 */
export function reportAdAction(action: MeaningfulAction): void {
  void AdIntelligenceEngine.recordAction(action);
}

export function useAdAction() {
  return useCallback((action: MeaningfulAction) => reportAdAction(action), []);
}

/**
 * Show a rewarded ad on demand (highest priority, never forced).
 * Returns whether the reward was earned so the caller can grant it.
 */
export function useRewardedAd() {
  return useCallback(async (trigger: RewardedTrigger): Promise<boolean> => {
    if (!rewardedAvailable()) {
      notifyAdUnavailable();
      return false;
    }
    return AdIntelligenceEngine.showRewarded(trigger);
  }, []);
}

/**
 * Attempt an interstitial at a high-value moment. The engine decides
 * whether it is actually appropriate (cooldowns, limits, engagement,
 * protected screens) — callers just fire the intent.
 */
export function useInterstitialMoment() {
  return useCallback(
    (moment: HighValueMoment): Promise<boolean> =>
      AdIntelligenceEngine.maybeShowInterstitial(moment),
    []
  );
}

/** Whether a banner should render on the given screen. */
export function useBannerEligible(screen: AdScreen): boolean {
  // Subscribe so the value re-evaluates when the user type / screen changes.
  useAdStore((s) => s.userType);
  return AdIntelligenceEngine.shouldShowBanner(screen);
}

/** Live ad-engine telemetry for debug / analytics surfaces. */
export function useAdAnalytics() {
  useAdStore((s) => s.revenue.lifetimeTotal);
  return AdIntelligenceEngine.getAnalytics();
}

/** Current engagement classification (for UI that adapts to user type). */
export function useEngagement() {
  const engagementScore = useAdStore((s) => s.engagementScore);
  const retentionScore = useAdStore((s) => s.retentionScore);
  const userType = useAdStore((s) => s.userType);
  return { engagementScore, retentionScore, userType };
}

export const AdBehavior = AdIntelligenceEngine.behavior;
