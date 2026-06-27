import { AdIntelligenceEngine } from "./AdIntelligenceEngine";

/**
 * Shows an interstitial when a user opens a job, then navigates to the details.
 *
 * Flow: tap job → (try interstitial, respecting the per-user-type cooldown
 * (60–90s) / daily & session caps / "just saw an ad" guard) → after the ad
 * closes, navigate.
 * If no ad is eligible or available, navigate immediately. Never blocks.
 */
class JobInterstitialManagerImpl {
  private busy = false;

  async openJob(navigate: () => void): Promise<void> {
    if (this.busy) return; // guard against double-taps
    this.busy = true;
    try {
      // Resolves true only after the ad closes; false (fast) if not shown.
      await AdIntelligenceEngine.maybeShowInterstitial("job_opened");
    } catch {
      // never block navigation on an ad error
    } finally {
      this.busy = false;
      navigate();
    }
  }
}

export const JobInterstitialManager = new JobInterstitialManagerImpl();
