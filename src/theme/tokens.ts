/**
 * Theme tokens — the single source of truth for every color the app paints
 * outside of NativeWind `dark:` className variants (icons, gradients, status bar,
 * chart/progress colors, WebView-rendered lessons, ad container backgrounds…).
 *
 * Architecture is intentionally future-proof: themes are grouped into FAMILIES,
 * each providing a matched light + dark pair. The shipped family is "default";
 * seasonal / holiday / brand / premium / Material-You families can be registered
 * later via {@link registerThemeFamily} without touching consumers — they all go
 * through {@link resolveTheme}.
 */

/** What the user can pick. "system" follows the device setting. */
export type ThemeMode = "light" | "dark" | "system";

/** A concrete, resolved scheme (never "system"). */
export type ColorScheme = "light" | "dark";

/** The semantic color slots every theme must define. */
export interface ThemeColors {
  /** App background / screen base. */
  background: string;
  /** Elevated surface — cards, sheets, list rows. */
  card: string;
  /** Slightly raised surface above `card` (inputs, chips, nested cards). */
  surface: string;
  /** Brand / interactive accent. */
  primary: string;
  /** Foreground that sits on top of `primary` (button labels, etc.). */
  onPrimary: string;
  /** Primary body text. */
  textPrimary: string;
  /** Muted / secondary text. */
  textSecondary: string;
  /** Hairlines, dividers, input outlines. */
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  id: string;
  /** Human label (for settings UIs / debugging). */
  label: string;
  /** Base scheme — drives the status-bar style and which `dark:` variant wins. */
  scheme: ColorScheme;
  colors: ThemeColors;
}

/** A matched light+dark pair. Future themes ship as a family so "system" works. */
export interface ThemeFamily {
  id: string;
  label: string;
  light: Theme;
  dark: Theme;
}

// ── Default family — values mandated by the design spec ──────────────────────

export const lightTheme: Theme = {
  id: "default.light",
  label: "Light",
  scheme: "light",
  colors: {
    background: "#FFFFFF",
    card: "#F8FAFC",
    surface: "#F1F5F9",
    primary: "#2563EB",
    onPrimary: "#FFFFFF",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },
};

export const darkTheme: Theme = {
  id: "default.dark",
  label: "Dark",
  scheme: "dark",
  colors: {
    background: "#0F172A",
    card: "#1E293B",
    surface: "#273449",
    primary: "#3B82F6",
    onPrimary: "#FFFFFF",
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    border: "#334155",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },
};

const defaultFamily: ThemeFamily = {
  id: "default",
  label: "Default",
  light: lightTheme,
  dark: darkTheme,
};

/** Registry of all known families. Mutable so new families can register at runtime. */
export const THEME_FAMILIES: Record<string, ThemeFamily> = {
  default: defaultFamily,
};

export const DEFAULT_FAMILY_ID = "default";

/**
 * Register a new theme family (seasonal / holiday / brand / premium / Material You).
 * Returns the id so callers can immediately select it.
 */
export function registerThemeFamily(family: ThemeFamily): string {
  THEME_FAMILIES[family.id] = family;
  return family.id;
}

/** Collapse a {@link ThemeMode} + device scheme into a concrete scheme. */
export function resolveScheme(mode: ThemeMode, deviceScheme: ColorScheme | null | undefined): ColorScheme {
  if (mode === "light" || mode === "dark") return mode;
  return deviceScheme === "dark" ? "dark" : "light";
}

/** Pick the active {@link Theme} for a family + resolved mode. Falls back safely. */
export function resolveTheme(
  familyId: string,
  mode: ThemeMode,
  deviceScheme: ColorScheme | null | undefined
): Theme {
  const family = THEME_FAMILIES[familyId] ?? defaultFamily;
  const scheme = resolveScheme(mode, deviceScheme);
  return scheme === "dark" ? family.dark : family.light;
}
