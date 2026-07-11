import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, BackHandler, Platform } from "react-native";
import { usePathname } from "expo-router";
import { useRatingStore } from "../stores/ratingStore";
import { RatingManager } from "./RatingManager";
import { RATING_CONFIG } from "./config";
import { RatingPrompt } from "../components/rating/RatingPrompt";
import { useRatingPrompt } from "../hooks/useRating";

/** Tab-root routes where it's natural and safe to surface the prompt. */
function isSafePath(path: string): boolean {
  const p = path.toLowerCase();
  return (
    p === "/" ||
    p === "/index" ||
    p === "/learn" ||
    p === "/tasks" ||
    p === "/certification" ||
    p === "/profile"
  );
}

/**
 * Drives the rating system from a single mount point and renders the prompt:
 *  - hydrates persisted state, counts app opens, accumulates active time
 *  - resets per-session flags on cold start + each foreground
 *  - attempts the prompt on arrival at a safe screen (pending signal first,
 *    then a once-per-session random roll) — never during launch/ads/flows
 *  - intercepts the Android back press at a tab root for the exit-app trigger
 */
export function RatingProvider() {
  const pathname = usePathname();
  const prompt = useRatingPrompt();

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const activeSince = useRef<number>(Date.now());
  const randomTriedThisSession = useRef(false);

  // ─── Boot + lifecycle ──────────────────────────────────────
  useEffect(() => {
    const store = useRatingStore.getState();
    store.hydrate().then(() => {
      store.startSession();
      store.recordAppOpen();
    });
    activeSince.current = Date.now();

    const sub = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;

      if (prev.match(/inactive|background/) && next === "active") {
        // New foreground "session".
        randomTriedThisSession.current = false;
        activeSince.current = Date.now();
        const s = useRatingStore.getState();
        s.startSession();
        s.recordAppOpen();
      } else if (next.match(/inactive|background/)) {
        // Bank the foreground time we just spent.
        useRatingStore.getState().addActiveMs(Date.now() - activeSince.current);
      }
    });

    return () => {
      useRatingStore.getState().addActiveMs(Date.now() - activeSince.current);
      sub.remove();
    };
  }, []);

  // ─── Android hardware back → exit-app trigger ──────────────
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBack = () => {
      // Only treat back as an "exit" attempt from a tab root.
      if (!isSafePath(pathname)) return false;
      // Show the prompt instead of exiting — but only occasionally.
      return RatingManager.maybePrompt("exit_app");
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [pathname]);

  // ─── Safe-screen arrival → pending / random trigger ────────
  useEffect(() => {
    if (!pathname || !isSafePath(pathname)) return;

    // Let the screen settle so the prompt never races the transition.
    const t = setTimeout(() => {
      const store = useRatingStore.getState();
      if (!store.hydrated) return;

      const pending = store.consumePending(RATING_CONFIG.timing.pendingSignalTtlMs);
      if (pending) {
        RatingManager.maybePrompt(pending);
        return;
      }

      if (!randomTriedThisSession.current) {
        randomTriedThisSession.current = true;
        RatingManager.maybePrompt("random_session");
      }
    }, 1200);

    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <RatingPrompt
      visible={prompt.visible}
      onRate={prompt.onRate}
      onMaybeLater={prompt.onMaybeLater}
      onNoThanks={prompt.onNoThanks}
    />
  );
}
