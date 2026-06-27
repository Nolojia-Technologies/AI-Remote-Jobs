import { useAdStore } from "../stores/adStore";
import { AdScreen, AdState } from "./types";

/**
 * Owns session lifecycle. Thin wrapper over the ad store so the engine
 * and provider have a clear, intention-revealing API.
 */
export const SessionTracker = {
  start(cameFromNotification = false) {
    useAdStore.getState().startSession(cameFromNotification);
  },

  setScreen(screen: AdScreen) {
    const store = useAdStore.getState();
    store.setScreen(screen);
    if (screen === "leaderboard") store.markLeaderboardVisited();
  },

  touch() {
    useAdStore.getState().touch();
  },

  sessionLengthMs(state: AdState, now = Date.now()): number {
    return Math.max(0, now - state.session.sessionStartAt);
  },

  msSinceLastActive(state: AdState, now = Date.now()): number {
    const last = state.timestamps.lastActiveAt;
    return last === null ? 0 : Math.max(0, now - last);
  },

  isFirstSession(state: AdState): boolean {
    return state.lifetime.sessionCount <= 1;
  },
};
