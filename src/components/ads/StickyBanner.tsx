import React from "react";
import { View } from "react-native";
import { usePathname } from "expo-router";
import { AdBanner } from "./AdBanner";
import { useBannerEligible } from "../../hooks/useAds";
import { AdScreen } from "../../ads/types";

function pathToScreen(path: string): AdScreen {
  const p = (path || "").toLowerCase();
  if (p === "/" || p === "" || p.endsWith("/index")) return "home";
  if (p.includes("/jobs")) return "jobs";
  if (p.includes("/tasks/")) return "quiz"; // no banners while actively completing tasks
  if (p.includes("/tasks")) return "jobs";
  if (p.includes("/certification/")) return "quiz"; // protect the timed quiz from banners
  if (p.includes("/certification")) return "learn";
  if (p.includes("/profile")) return "profile";
  if (p.includes("/leaderboard")) return "leaderboard";
  return "other"; // learn + everything else → not banner-eligible
}

/**
 * Sticky adaptive banner pinned just above the tab bar — always visible on
 * eligible tabs (Home, Jobs, Challenges, Profile) without scrolling, which is
 * far more lucrative than a banner buried at the end of a scroll view. The
 * engine still gates eligibility per screen; renders nothing when ineligible.
 */
export function StickyBanner({ bottom }: { bottom: number }) {
  const pathname = usePathname();
  const screen = pathToScreen(pathname);
  const eligible = useBannerEligible(screen);

  if (!eligible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, bottom }}
    >
      <View className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 items-center justify-center py-1">
        <AdBanner screen={screen} />
      </View>
    </View>
  );
}
