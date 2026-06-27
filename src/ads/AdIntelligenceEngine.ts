import { useAdStore } from "../stores/adStore";
import { useUserStore } from "../stores/userStore";
import { useLearnStore } from "../stores/learnStore";
import { useChallengeStore } from "../stores/challengeStore";
import { useJobStore } from "../stores/jobStore";
import { useGamificationStore } from "../stores/gamificationStore";
import { AdMob } from "../lib/admob";
import {
  AdScreen,
  BehaviorSnapshot,
  HighValueMoment,
  MeaningfulAction,
  RewardedTrigger,
} from "./types";
import { SessionTracker } from "./SessionTracker";
import { UserBehaviorTracker } from "./UserBehaviorTracker";
import { EngagementScoreCalculator } from "./EngagementScoreCalculator";
import { AdDecisionService } from "./AdDecisionService";
import { AdEligibilityService } from "./AdEligibilityService";
import { AdAnalytics } from "./AdAnalytics";
import { logEvent, AnalyticsEvents } from "../lib/analytics";
import { ACTION_WEIGHTS, AD_CONFIG, FORCED_MOMENT_ACTIONS } from "./config";

// Map a meaningful action to the analytics "moment" label.
const ACTION_MOMENT: Record<MeaningfulAction, HighValueMoment> = {
  lesson_completed: "module_completed",
  quiz_completed: "quiz_passed",
  challenge_completed: "challenge_completed",
  job_viewed: "manual",
  job_unlocked: "job_unlocked",
  application_submitted: "application_submitted",
  certificate_generated: "certificate_generated",
  level_up: "level_up",
  achievement_unlocked: "achievement_unlocked",
  chapter_unlocked: "module_completed",
  profile_completed: "manual",
  milestone_completed: "module_completed",
  leaderboard_promotion: "leaderboard_milestone",
  badge_unlock: "achievement_unlocked",
  daily_chest: "daily_reward_claimed",
  mystery_box: "mystery_box_opened",
};

/**
 * AdIntelligenceEngine — the single public facade.
 *
 * Decision logic lives in the pure services (EngagementScoreCalculator,
 * AdEligibilityService, AdDecisionService, AdCooldownManager) so the
 * "when to show an ad" brain can later be swapped for an ML model
 * without touching call sites. This class only orchestrates: build a
 * snapshot, ask the services, show via AdMob, and record analytics.
 */
class Engine {
  private initialized = false;

  async init(cameFromNotification = false) {
    if (this.initialized) {
      SessionTracker.start(cameFromNotification);
      this.refreshScores();
      return;
    }
    this.initialized = true;
    await useAdStore.getState().hydrate();
    SessionTracker.start(cameFromNotification);
    this.refreshScores();
  }

  // ─── Snapshot: ground the model in real app data ───────────
  buildSnapshot(): BehaviorSnapshot {
    const ad = useAdStore.getState();
    const profile = useUserStore.getState().profile;
    const lessons = useLearnStore.getState().completedLessonIds.size;
    const challenges = useChallengeStore.getState().userSubmissions.length;
    const applications = useJobStore.getState().applications.length;
    const achievements = useGamificationStore
      .getState()
      .achievements.filter((a) => a.isEarned).length;

    return {
      level: profile?.level ?? 1,
      xp: profile?.xp ?? 0,
      streakDays: profile?.streak_days ?? 0,
      lessonsCompleted: Math.max(lessons, ad.behavior.lessonsCompleted),
      challengesCompleted: Math.max(challenges, ad.behavior.challengesCompleted),
      jobsViewed: ad.behavior.jobsViewed,
      applicationsSubmitted: Math.max(applications, ad.behavior.applicationsSubmitted),
      achievementsEarned: Math.max(achievements, ad.behavior.achievementsEarned),
      rewardedWatched: ad.lifetime.rewardedWatched,
      sessionLengthMs: SessionTracker.sessionLengthMs(ad),
      actionsThisSession: ad.session.actionsThisSession,
      sessionCount: ad.lifetime.sessionCount,
      msSinceLastActive: SessionTracker.msSinceLastActive(ad),
      visitedLeaderboard: ad.session.visitedLeaderboard,
    };
  }

  refreshScores() {
    const snapshot = this.buildSnapshot();
    const { engagementScore, retentionScore, userType } =
      EngagementScoreCalculator.compute(snapshot);
    useAdStore.getState().setScores(engagementScore, retentionScore, userType);
    return { snapshot, engagementScore, retentionScore, userType };
  }

  // ─── Navigation / lifecycle ────────────────────────────────
  setScreen(screen: AdScreen) {
    SessionTracker.setScreen(screen);
    this.refreshScores();
  }

  async onForeground() {
    // Check inactivity against the time we backgrounded BEFORE touching, else
    // the app-open inactivity window would always read ~0.
    const shown = await this.maybeShowAppOpen();
    SessionTracker.touch();
    return shown;
  }

  /** Best-effort app-open on cold launch (skips on first session / if no ad). */
  async onLaunch() {
    return this.maybeShowAppOpen();
  }

  onBackground() {
    SessionTracker.touch();
  }

  // ─── Action counter → interstitial rhythm ──────────────────
  /**
   * Report a meaningful action. Increments the session action-counter and
   * auto-attempts an interstitial when the threshold is hit, a Jobs view-quota
   * is reached, or it's a forced high-value moment. The decision/eligibility
   * layer still enforces cooldown, session caps, daily caps and protected
   * screens — so this never feels spammy.
   */
  async recordAction(action: MeaningfulAction): Promise<void> {
    const weight = ACTION_WEIGHTS[action] ?? 1;
    const isJobView = action === "job_viewed";
    useAdStore.getState().addAction(weight, isJobView);
    this.refreshScores();

    const s = useAdStore.getState().session;
    const cfg = AD_CONFIG.interstitial;
    const threshold = s.interstitialsThisSession === 0 ? cfg.firstThreshold : cfg.recurringThreshold;

    const counterReached = s.actionsSinceInterstitial >= threshold;
    const jobQuotaReached = s.jobViewsSinceInterstitial >= cfg.jobViewsPerAd;
    const forced = FORCED_MOMENT_ACTIONS.has(action);

    if (counterReached || jobQuotaReached || forced) {
      await this.maybeShowInterstitial(ACTION_MOMENT[action]);
    }
  }

  // ─── Interstitial (auto, at high-value moments) ────────────
  async maybeShowInterstitial(moment: HighValueMoment): Promise<boolean> {
    const { snapshot } = this.refreshScores();
    const state = useAdStore.getState();
    const decision = AdDecisionService.decideInterstitial(state, snapshot, moment, Date.now());
    AdAnalytics.recordDecision("interstitial", decision.show, decision.reason);
    if (!decision.show) return false;

    const shown = await safe(() => AdMob.showInterstitial());
    if (shown) {
      useAdStore.getState().recordAdShown("interstitial");
      AdAnalytics.recordImpression("interstitial");
      logEvent(AnalyticsEvents.INTERSTITIAL_SHOWN, { moment });
    }
    return shown;
  }

  // ─── App-open (auto, on resume after inactivity) ───────────
  async maybeShowAppOpen(): Promise<boolean> {
    const { snapshot } = this.refreshScores();
    const state = useAdStore.getState();
    const decision = AdDecisionService.decideAppOpen(state, snapshot, Date.now());
    AdAnalytics.recordDecision("app_open", decision.show, decision.reason);
    if (!decision.show) return false;

    const shown = await safe(() => AdMob.showAppOpen());
    if (shown) {
      useAdStore.getState().recordAdShown("app_open");
      AdAnalytics.recordImpression("app_open");
      logEvent(AnalyticsEvents.APP_OPEN_SHOWN);
    }
    return shown;
  }

  // ─── Rewarded (on-demand, highest priority, never forced) ──
  async showRewarded(trigger: RewardedTrigger): Promise<boolean> {
    AdEligibilityService.rewarded(); // always eligible — documented call
    AdAnalytics.recordDecision("rewarded", true, `trigger:${trigger}`);
    logEvent(AnalyticsEvents.REWARDED_AD_STARTED, { trigger });
    const watched = await safe(() => AdMob.showRewarded());
    if (watched) {
      useAdStore.getState().recordAdShown("rewarded");
      AdAnalytics.recordImpression("rewarded");
      logEvent(AnalyticsEvents.REWARDED_AD_COMPLETED, { trigger });
      logEvent(AnalyticsEvents.REWARDED_AD_REWARD_GRANTED, { trigger });
    }
    return watched;
  }

  /** Whether a preloaded rewarded ad is ready (for "ad unavailable" UX). */
  rewardedReady(): boolean {
    return AdMob.rewardedReady();
  }

  // ─── Banner (passive, lowest priority) ─────────────────────
  shouldShowBanner(screen: AdScreen): boolean {
    return AdEligibilityService.banner(screen).eligible;
  }

  recordBannerImpression() {
    useAdStore.getState().recordBannerImpression();
    AdAnalytics.recordImpression("banner");
  }

  // ─── Behaviour passthroughs ────────────────────────────────
  behavior = UserBehaviorTracker;

  getAnalytics() {
    return AdAnalytics.snapshot();
  }
}

async function safe(fn: () => Promise<boolean>): Promise<boolean> {
  try {
    return await fn();
  } catch {
    return false;
  }
}

export const AdIntelligenceEngine = new Engine();
