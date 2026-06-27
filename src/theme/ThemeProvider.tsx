import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, useColorScheme as useDeviceColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colorScheme as nwColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";
import { DEFAULT_FAMILY_ID, resolveScheme, resolveTheme, type ColorScheme, type ThemeMode } from "./tokens";
import { useTheme } from "./useTheme";

const MODE_KEY = "@aha/theme/mode/v1";
const FAMILY_KEY = "@aha/theme/family/v1";
/** Cross-fade duration when the theme changes (spec: 200–300ms). */
const FADE_MS = 250;

function isMode(v: unknown): v is ThemeMode {
  return v === "light" || v === "dark" || v === "system";
}

/**
 * Centralizes all theme state:
 *  • loads the saved preference from AsyncStorage on startup and applies it
 *    BEFORE rendering children (no flash),
 *  • drives NativeWind's global color scheme so every existing `dark:` className
 *    across the app responds to the choice,
 *  • exposes resolved tokens via {@link useTheme},
 *  • plays a smooth fade whenever the resolved scheme changes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const device = (useDeviceColorScheme() ?? "light") as ColorScheme;

  const [mode, setModeState] = useState<ThemeMode>("system");
  const [familyId, setFamilyState] = useState<string>(DEFAULT_FAMILY_ID);
  const [ready, setReady] = useState(false);

  // ── Load persisted preference once, apply before first paint ──────────────
  useEffect(() => {
    (async () => {
      try {
        const [savedMode, savedFamily] = await Promise.all([
          AsyncStorage.getItem(MODE_KEY),
          AsyncStorage.getItem(FAMILY_KEY),
        ]);
        const m: ThemeMode = isMode(savedMode) ? savedMode : "system";
        nwColorScheme.set(m); // make NativeWind apply it immediately
        setModeState(m);
        if (savedFamily) setFamilyState(savedFamily);
      } catch {
        nwColorScheme.set("system");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const scheme = useMemo<ColorScheme>(() => resolveScheme(mode, device), [mode, device]);
  const theme = useMemo(() => resolveTheme(familyId, mode, device), [familyId, mode, device]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    nwColorScheme.set(next);
    AsyncStorage.setItem(MODE_KEY, next).catch(() => {});
  }, []);

  const setFamily = useCallback((next: string) => {
    setFamilyState(next);
    AsyncStorage.setItem(FAMILY_KEY, next).catch(() => {});
  }, []);

  // ── Smooth fade on scheme change ──────────────────────────────────────────
  const fade = useSharedValue(0);
  const firstScheme = useRef(true);
  const [overlayColor, setOverlayColor] = useState(theme.colors.background);

  useEffect(() => {
    if (firstScheme.current) {
      firstScheme.current = false;
      return;
    }
    // Briefly cover the screen with the incoming background, then fade it away
    // so the swap reads as a clean dissolve rather than an abrupt flip.
    setOverlayColor(theme.colors.background);
    fade.value = 1;
    fade.value = withTiming(0, { duration: FADE_MS });
  }, [scheme]); // eslint-disable-line react-hooks/exhaustive-deps

  const overlayStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      isDark: scheme === "dark",
      theme,
      colors: theme.colors,
      familyId,
      setMode,
      setFamily,
      ready,
    }),
    [mode, scheme, theme, familyId, setMode, setFamily, ready]
  );

  // Hold rendering until the saved preference is applied. The native splash
  // screen is still up at this point, so the user never sees a wrong-theme flash.
  if (!ready) return null;

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }, overlayStyle]}
        />
      </View>
    </ThemeContext.Provider>
  );
}

/**
 * Status bar that follows the active theme: dark icons on light, light icons on
 * dark. Place inside {@link ThemeProvider}. Falls back to "auto" pre-mount.
 */
export function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} animated />;
}
