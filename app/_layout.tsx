import "../global.css";
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "../src/stores/authStore";
import { useUserStore } from "../src/stores/userStore";
import { AdEngineProvider } from "../src/ads/AdEngineProvider";
import { RatingProvider } from "../src/rating/RatingProvider";
import { NotificationProvider } from "../src/notifications/NotificationProvider";
import { UpdateGate } from "../src/components/UpdateGate";
import { ThemeProvider, ThemedStatusBar } from "../src/theme";

SplashScreen.preventAutoHideAsync();

// Sentry: initialise in EAS production builds by importing here with a valid DSN.
// Omitted for Expo Go development to avoid Metro resolving native-only internals.

/**
 * Global auth/navigation guard. Mounted at the root so it reacts to auth-state
 * changes from ANY screen (including the login screen) — not just from index.tsx.
 */
function AuthGuard() {
  const { status, user } = useAuthStore();
  const { profile, fetchProfile, clearProfile } = useUserStore();
  const segments = useSegments();
  const router = useRouter();

  // Keep the profile in sync with the authenticated user.
  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      clearProfile();
    }
  }, [user?.id]);

  // React to auth + profile state and route accordingly.
  useEffect(() => {
    if (status === "loading") return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === "(auth)";
    const atRoot = segs.length === 0;

    if (status === "unauthenticated") {
      if (!inAuthGroup) router.replace("/(auth)/login");
      return;
    }

    // Authenticated — wait until the profile is loaded before deciding where to go.
    if (!profile) return;

    // Only steer the user when they're at the entry points (login screen or root).
    // Leave them alone once they're inside the app (tabs / onboarding / detail screens).
    if (inAuthGroup || atRoot) {
      if (!profile.career_path_id) {
        router.replace("/(onboarding)/welcome");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [status, profile, segments]);

  return null;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize().then(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <AuthGuard />
          <AdEngineProvider />
          <RatingProvider />
          <NotificationProvider />
          <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="lesson/[id]"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="quiz/[id]"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen name="chapter/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="certification/quiz" options={{ headerShown: false }} />
          <Stack.Screen name="certification/result" options={{ headerShown: false }} />
          <Stack.Screen name="certification/review" options={{ headerShown: false }} />
          <Stack.Screen name="job/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="apply/[id]"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen name="applications" options={{ headerShown: false }} />
          <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
          <Stack.Screen name="revision/index" options={{ headerShown: false }} />
          <Stack.Screen name="revision/session" options={{ presentation: "modal", headerShown: false }} />
          <Stack.Screen name="calendar" options={{ headerShown: false }} />
          <Stack.Screen name="opportunities/index" options={{ headerShown: false }} />
          <Stack.Screen name="certificates/index" options={{ headerShown: false }} />
          <Stack.Screen name="achievements/index" options={{ headerShown: false }} />
          <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="course/lesson/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="course/quiz/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="settings/index" options={{ headerShown: false }} />
          <Stack.Screen name="privacy/index" options={{ headerShown: false }} />
          </Stack>
          <UpdateGate />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
