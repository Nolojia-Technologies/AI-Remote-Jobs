import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Challenge, ChallengeWithStatus, ChallengeSubmission } from "../types/app.types";
import { useUserStore } from "./userStore";
import { XP_REWARDS } from "../constants/xp";
import { logEvent, AnalyticsEvents } from "../lib/analytics";

interface ChallengeState {
  challenges: ChallengeWithStatus[];
  activeChallenge: ChallengeWithStatus | null;
  userSubmissions: ChallengeSubmission[];
  isLoading: boolean;

  // Actions
  fetchChallenges: (userId: string) => Promise<void>;
  submitChallenge: (userId: string, challengeId: string, submissionText: string) => Promise<{ error: string | null }>;
  setActiveChallenge: (challenge: ChallengeWithStatus | null) => void;
  getCompletedChallengeIds: () => Set<string>;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  activeChallenge: null,
  userSubmissions: [],
  isLoading: false,

  fetchChallenges: async (userId) => {
    set({ isLoading: true });

    const now = new Date().toISOString();
    const [challengesRes, submissionsRes] = await Promise.all([
      supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .gte("expires_at", now)
        .order("created_at", { ascending: false }),
      supabase
        .from("challenge_submissions")
        .select("*")
        .eq("user_id", userId),
    ]);

    const submissions = submissionsRes.data ?? [];
    const submissionMap = new Map((submissions as any[]).map((s: any) => [s.challenge_id, s]));

    const challengesWithStatus: ChallengeWithStatus[] = (challengesRes.data ?? []).map(
      (c: Challenge) => ({
        ...c,
        isCompleted: submissionMap.has(c.id),
        submission: submissionMap.get(c.id),
        timeRemaining: Math.max(
          0,
          new Date(c.expires_at).getTime() - Date.now()
        ),
      })
    );

    set({
      challenges: challengesWithStatus,
      userSubmissions: submissions,
      isLoading: false,
    });
  },

  submitChallenge: async (userId, challengeId, submissionText) => {
    const alreadySubmitted = get().userSubmissions.some(
      (s) => s.challenge_id === challengeId
    );
    if (alreadySubmitted) return { error: "Already submitted" };

    const { data, error } = await supabase
      .from("challenge_submissions")
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        submission_text: submissionText,
        status: "pending",
        xp_awarded: XP_REWARDS.CHALLENGE_COMPLETE,
      } as any)
      .select()
      .single();

    if (error) return { error: error.message };

    // Award XP immediately
    await useUserStore
      .getState()
      .awardXP(userId, XP_REWARDS.CHALLENGE_COMPLETE, "challenge_complete", "Challenge submitted");

    // Update local state
    const updated = get().challenges.map((c) =>
      c.id === challengeId
        ? { ...c, isCompleted: true, submission: data as ChallengeSubmission }
        : c
    );
    set({
      challenges: updated,
      userSubmissions: [...get().userSubmissions, data as ChallengeSubmission],
    });

    logEvent(AnalyticsEvents.CHALLENGE_COMPLETE, { challenge_id: challengeId });
    return { error: null };
  },

  setActiveChallenge: (challenge) => set({ activeChallenge: challenge }),

  getCompletedChallengeIds: () => {
    return new Set(get().userSubmissions.map((s) => s.challenge_id));
  },
}));
