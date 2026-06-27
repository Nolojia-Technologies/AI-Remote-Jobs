import { useContext } from "react";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";

/**
 * Access the active theme. Must be called from inside {@link ThemeProvider}.
 *
 * @example
 *   const { colors, isDark, mode, setMode } = useTheme();
 *   <View style={{ backgroundColor: colors.background }} />
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>.");
  return ctx;
}
