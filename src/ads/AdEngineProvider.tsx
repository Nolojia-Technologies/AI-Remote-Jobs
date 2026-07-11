import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { usePathname } from "expo-router";
import { AdIntelligenceEngine } from "./AdIntelligenceEngine";
import { AdScreen } from "./types";
import { initializeAds } from "../lib/admob";
import { initFacebookSdk } from "../lib/facebook";
import { NotificationService } from "../notifications/NotificationService";

function pathToScreen(path: string): AdScreen {
  const p = path.toLowerCase();
  if (p === "/" || p === "/index") return "home";
  if (p.startsWith("/jobs") || p === "/tasks") return "jobs";
  // Never interrupt an active task run with engine-driven ads.
  if (p.startsWith("/tasks/")) return "quiz";
  if (p.startsWith("/learn")) return "learn";
  // Protect the timed certification quiz/result/review from ads; hub = normal tab.
  if (p.startsWith("/certification/")) return "quiz";
  if (p.startsWith("/certification")) return "learn";
  if (p.startsWith("/profile")) return "profile";
  if (p.startsWith("/leaderboard")) return "leaderboard";
  if (p.startsWith("/lesson")) return "lesson";
  if (p.startsWith("/chapter")) return "lesson"; // gamified chapter = learning, protect it
  if (p.startsWith("/revision/session")) return "quiz"; // protect the revision drill
  if (p.startsWith("/quiz")) return "quiz";
  if (p.startsWith("/job/")) return "job_detail";
  if (p.startsWith("/apply")) return "application";
  if (p.startsWith("/opportunities")) return "opportunities";
  if (p.startsWith("/certificates")) return "certificates";
  if (p.startsWith("/achievements")) return "achievements";
  if (p.startsWith("/applications")) return "other";
  if (/(welcome|career-path|goals)/.test(p)) return "onboarding";
  if (/(login|register|forgot-password)/.test(p)) return "auth";
  return "other";
}

/**
 * Drives the Ad Intelligence Engine from a single mount point:
 *  - boots the engine (hydrate + start session) on cold start
 *  - maps the current route to an AdScreen on every navigation
 *  - handles background/foreground (session + app-open ads)
 */
// Screens that trigger an interstitial when opened (tabs + job/challenge detail).
// Gated by the engine's cooldown/caps + protected-screen rules, so this never
// fires during lessons/quizzes/forms.
const INTERSTITIAL_ON_OPEN = new Set<AdScreen>([
  "home",
  "learn",
  "jobs",
  "profile",
  // job opens are handled by JobInterstitialManager (interstitial before nav)
]);

export function AdEngineProvider() {
  const pathname = usePathname();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const firstNav = useRef(true);

  useEffect(() => {
    AdIntelligenceEngine.init();
    initializeAds(); // no-op in Expo Go; initializes the AdMob SDK in builds
    initFacebookSdk(); // no-op until FB App ID + Client Token are configured
    NotificationService.syncEngagement(); // (re)arm daily + inactivity reminders

    // Best-effort app-open on cold launch once the ad has had time to preload.
    const launchTimer = setTimeout(() => {
      AdIntelligenceEngine.onLaunch();
    }, 2500);

    const sub = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;
      if (prev.match(/inactive|background/) && next === "active") {
        AdIntelligenceEngine.onForeground();
        NotificationService.syncEngagement(); // reset inactivity timers from now
      } else if (next.match(/inactive|background/)) {
        AdIntelligenceEngine.onBackground();
      }
    });

    return () => {
      clearTimeout(launchTimer);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const screen = pathToScreen(pathname);
    AdIntelligenceEngine.setScreen(screen);

    // Skip the cold-launch landing so an interstitial doesn't stack on the
    // app-open ad. After that, show an interstitial on every eligible page open
    // (engine still enforces the cooldown / daily & session caps).
    if (firstNav.current) {
      firstNav.current = false;
      return;
    }
    if (INTERSTITIAL_ON_OPEN.has(screen)) {
      AdIntelligenceEngine.maybeShowInterstitial("manual");
    }
  }, [pathname]);

  return null;
}
