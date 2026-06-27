import { useAdStore } from "../stores/adStore";

/**
 * Records meaningful user actions into the ad store. These feed the
 * engagement model. XP/level/streak are NOT duplicated here — they are
 * read live from userStore by the engine when building a snapshot.
 */
export const UserBehaviorTracker = {
  lessonCompleted() {
    const s = useAdStore.getState();
    s.incBehavior("lessonsCompleted");
    s.incAction();
  },
  challengeCompleted() {
    const s = useAdStore.getState();
    s.incBehavior("challengesCompleted");
    s.incAction();
  },
  jobViewed() {
    const s = useAdStore.getState();
    s.incBehavior("jobsViewed");
    s.incJobsViewedThisSession();
    s.incAction();
  },
  applicationSubmitted() {
    const s = useAdStore.getState();
    s.incBehavior("applicationsSubmitted");
    s.incAction();
  },
  achievementEarned() {
    const s = useAdStore.getState();
    s.incBehavior("achievementsEarned");
    s.incAction();
  },
  /** Generic positive interaction (used for in-session activity weighting). */
  action() {
    useAdStore.getState().incAction();
  },
};
