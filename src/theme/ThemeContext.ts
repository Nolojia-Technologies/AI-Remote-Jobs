import { createContext } from "react";
import type { ColorScheme, Theme, ThemeColors, ThemeMode } from "./tokens";

/** The shape exposed by {@link useTheme}. */
export interface ThemeContextValue {
  /** The user's stored preference: "light" | "dark" | "system". */
  mode: ThemeMode;
  /** The concrete scheme actually in effect (resolves "system"). */
  scheme: ColorScheme;
  /** Convenience flag — `scheme === "dark"`. */
  isDark: boolean;
  /** The active theme object. */
  theme: Theme;
  /** Shortcut to `theme.colors`. */
  colors: ThemeColors;
  /** The active theme-family id (for future seasonal/premium families). */
  familyId: string;
  /** Change + persist the theme mode. */
  setMode: (mode: ThemeMode) => void;
  /** Select a registered theme family (premium/seasonal). Persisted. */
  setFamily: (familyId: string) => void;
  /** True once the saved preference has been loaded & applied (no flash before this). */
  ready: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
