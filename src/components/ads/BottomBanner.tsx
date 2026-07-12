import React from "react";
import { View } from "react-native";
import { AdBanner } from "./AdBanner";

/**
 * Bottom-anchored adaptive banner for STACK screens (task runner, wallet,
 * referrals) — the tab bar's StickyBanner doesn't reach these. Renders inside
 * the screen's SafeAreaView as an absolutely-positioned footer; screens add
 * ~80px of scroll padding so content never hides behind it.
 */
export function BottomBanner() {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
    >
      <View className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 items-center justify-center py-1">
        <AdBanner screen="jobs" />
      </View>
    </View>
  );
}
