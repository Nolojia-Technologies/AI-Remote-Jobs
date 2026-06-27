import { useRatingStore } from "../stores/ratingStore";
import { useAdStore } from "../stores/adStore";
import { RATING_CONFIG, RATING_PROTECTED_SCREENS } from "./config";
import { RatingChoice, RatingSource } from "./types";
import { openStoreListing } from "./StoreReview";
import { logEvent, AnalyticsEvents } from "../lib/analytics";

/**
 * RatingManager — the single facade for the rating system.
 *
 * Owns the "should we ask, and what happens when buttons are tapped" logic so
 * UI/provider code stays declarative. Decisions are intentionally conservative:
 * eligibility (engaged users only), strict frequency caps, protected screens,
 * a randomised appearance, and an imperative suspend() for transient flows
 * (rewarded/interstitial ads, payments, job-unlock) that have no screen of
 * their own.
 */
class Manager {
  /** Depth counter so nested suspend()/resume() pairs are safe. */
  private suspendDepth = 0;

  /** Block prompts during a transient flow (ads, payment, job unlock). */
  suspend() {
    this.suspendDepth += 1;
  }

  resume() {
    this.suspendDepth = Math.max(0, this.suspendDepth - 1);
  }

  /** Run `fn` with prompts suspended (auto-resumes even if it throws). */
  async during<T>(fn: () => Promise<T>): Promise<T> {
    this.suspend();
    try {
      return await fn();
    } finally {
      this.resume();
    }
  }

  // ─── Eligibility: only ask engaged users ─────────────────────
  isEligible(): boolean {
    const { engagement } = useRatingStore.getState();
    const e = RATING_CONFIG.eligibility;
    return (
      engagement.lessonsCompleted >= e.minLessons ||
      engagement.quizzesCompleted >= e.minQuizzes ||
      engagement.totalActiveMs >= e.minActiveMs ||
      engagement.appOpens >= e.minAppOpens ||
      engagement.jobsUnlocked >= e.minJobsUnlocked
    );
  }

  /** Hard frequency/timing gates shared by every trigger. */
  private gatesPass(now: number): boolean {
    const r = useRatingStore.getState();

    // Already asked this session / already reviewed → never again now.
    if (r.shownThisSession) return false;
    if (r.reviewCompleted) return false;

    // Cooldown window (14d default, 60d after "No Thanks", etc.).
    if (r.cooldownUntil && now < r.cooldownUntil) return false;

    // Belt-and-braces 14-day minimum gap between prompts.
    if (r.lastShownAt && now - r.lastShownAt < RATING_CONFIG.frequency.minGapMs) return false;

    // Never immediately after launch.
    const ad = useAdStore.getState();
    const sessionAge = now - ad.session.sessionStartAt;
    if (sessionAge < RATING_CONFIG.timing.minSessionAgeMs) return false;

    // Not during/just-after an ad.
    const lastAdAt = ad.timestamps.lastAdAt;
    if (lastAdAt && now - lastAdAt < RATING_CONFIG.timing.recentAdGuardMs) return false;

    // Not on a protected screen (lesson/quiz/job/cert/payment/onboarding/auth).
    if (RATING_PROTECTED_SCREENS.has(ad.session.currentScreen)) return false;

    // Not during a suspended flow (payments, job unlock, ad display).
    if (this.suspendDepth > 0) return false;

    return true;
  }

  private rollRandom(source: RatingSource): boolean {
    const { minChance, maxChance, exitChance } = RATING_CONFIG.random;
    if (source === "exit_app") return Math.random() < exitChance;
    const chance = minChance + Math.random() * (maxChance - minChance);
    return Math.random() < chance;
  }

  /**
   * Attempt to surface the prompt. Returns true if it was shown. Applies
   * eligibility → hard gates → randomised appearance, in that order.
   */
  maybePrompt(source: RatingSource): boolean {
    const now = Date.now();
    if (!this.isEligible()) return false;
    if (!this.gatesPass(now)) return false;
    if (!this.rollRandom(source)) return false;

    const store = useRatingStore.getState();
    store.showPrompt(source);
    store.recordShown();
    logEvent(AnalyticsEvents.RATING_PROMPT_SHOWN, { source });
    return true;
  }

  // ─── Button handlers ─────────────────────────────────────────
  async rateApp() {
    const store = useRatingStore.getState();
    const source = store.promptSource;
    logEvent(AnalyticsEvents.RATING_RATE_CLICKED, { source });
    store.hidePrompt();

    // Don't re-ask after we've sent them to review (best-effort completion).
    this.applyCooldown("rate", RATING_CONFIG.frequency.reviewedCooldownMs);

    // Open the Play Store listing directly. The in-app review API is skipped on
    // an explicit tap because Google quota-limits it (it can silently show
    // nothing) and disallows preceding it with a custom prompt like ours.
    const opened = await openStoreListing();
    if (opened) {
      store.markReviewCompleted();
      logEvent(AnalyticsEvents.RATING_REVIEW_COMPLETED, {
        source,
        in_app_review: false,
      });
    }
  }

  maybeLater() {
    const source = useRatingStore.getState().promptSource;
    logEvent(AnalyticsEvents.RATING_MAYBE_LATER_CLICKED, { source });
    useRatingStore.getState().hidePrompt();
    this.applyCooldown("later", RATING_CONFIG.frequency.maybeLaterCooldownMs);
  }

  noThanks() {
    const source = useRatingStore.getState().promptSource;
    logEvent(AnalyticsEvents.RATING_NO_THANKS_CLICKED, { source });
    useRatingStore.getState().hidePrompt();
    this.applyCooldown("no_thanks", RATING_CONFIG.frequency.noThanksCooldownMs);
  }

  private applyCooldown(choice: RatingChoice, durationMs: number) {
    useRatingStore.getState().recordChoice(choice, Date.now() + durationMs);
  }
}

export const RatingManager = new Manager();
