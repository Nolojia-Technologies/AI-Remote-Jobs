export const Colors = {
  primary: "#2563EB",
  primaryLight: "#60A5FA",
  primaryDark: "#1D4ED8",

  secondary: "#0EA5E9",
  secondaryLight: "#38BDF8",
  secondaryDark: "#0369A1",

  accent: "#22C55E",
  accentLight: "#86EFAC",
  accentDark: "#16A34A",

  background: "#FFFFFF",
  backgroundDark: "#111827",

  surface: "#F8FAFC",
  surfaceDark: "#1F2937",

  card: "#FFFFFF",
  cardDark: "#1F2937",

  border: "#E2E8F0",
  borderDark: "#374151",

  text: {
    primary: "#0F172A",
    secondary: "#64748B",
    tertiary: "#94A3B8",
    inverse: "#FFFFFF",
    primaryDark: "#F8FAFC",
    secondaryDark: "#94A3B8",
  },

  xp: "#F59E0B",
  streak: "#EF4444",
  gold: "#F59E0B",
  silver: "#94A3B8",
  bronze: "#B45309",

  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#0EA5E9",

  levelColors: [
    "#94A3B8", // Level 1  - Slate
    "#22C55E", // Level 2  - Green
    "#0EA5E9", // Level 3  - Blue
    "#8B5CF6", // Level 4  - Purple
    "#F59E0B", // Level 5  - Amber
    "#EF4444", // Level 6  - Red
    "#EC4899", // Level 7  - Pink
    "#14B8A6", // Level 8  - Teal
    "#F97316", // Level 9  - Orange
    "#2563EB", // Level 10+ - Primary
  ],

  careerColors: {
    "ai-content-writer": "#8B5CF6",
    "ai-virtual-assistant": "#0EA5E9",
    "ai-customer-support": "#22C55E",
    "ai-research-assistant": "#F59E0B",
    "ai-social-media-manager": "#EC4899",
    "prompt-engineer": "#EF4444",
    "data-entry-specialist": "#14B8A6",
  },
} as const;
