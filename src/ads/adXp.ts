import { useAdStore } from "../stores/adStore";
import { useUserStore } from "../stores/userStore";

/**
 * Central rewarded "bonus XP" granting. Enforces the escalating daily
 * schedule (5/5/10/10/15), the 5-ads/day and 45-XP/day caps, and tracks
 * daily/weekly/lifetime ad XP for anti-abuse + the job-XP split.
 *
 * Returns the XP actually granted (0 if the daily cap is already reached).
 */
export async function grantAdBonusXp(userId: string): Promise<number> {
  const amount = useAdStore.getState().nextAdBonus();
  if (amount <= 0) return 0;
  useAdStore.getState().recordAdXp(amount);
  await useUserStore.getState().awardXP(userId, amount, "ad_bonus", "Bonus XP (rewarded ad)");
  return amount;
}

/** Lifetime ad XP — used to cap how much ad XP counts toward job unlocks. */
export function lifetimeAdXp(): number {
  return useAdStore.getState().adXp.lifetimeXp;
}

export function adXpSummary() {
  const x = useAdStore.getState().adXp;
  return {
    todayXp: x.todayXp,
    todayCount: x.todayCount,
    weekXp: x.weekXp,
    lifetimeXp: x.lifetimeXp,
  };
}
