import React, { useEffect, useState } from "react";
import { BackHandler, Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Star, LogOut } from "lucide-react-native";
import { openStoreListing } from "../rating/StoreReview";
import { useRatingStore } from "../stores/ratingStore";
import { logEvent } from "../lib/analytics";
import { NativeAdCard } from "./ads/NativeAdCard";

/**
 * Android back-press exit dialog. Pressing back on a tab root (where back
 * would normally quit the app) shows a rate-or-exit prompt instead:
 *  • Rate → opens the Play Store listing (marks the rating flow complete)
 *  • Exit → actually leaves the app
 *  • back again / "Keep earning" → dismisses and stays
 */
export function ExitPrompt() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // A pushed screen (task runner, wallet…) handles its own back-pop.
      if (router.canGoBack()) return false;
      setVisible((v) => {
        if (v) return false; // back while open → close, stay in the app
        logEvent("exit_prompt_shown", {});
        return true;
      });
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const rate = async () => {
    logEvent("exit_prompt_rate", {});
    useRatingStore.getState().markReviewCompleted();
    await openStoreListing();
    setVisible(false);
  };

  const exit = () => {
    logEvent("exit_prompt_exit", {});
    setVisible(false);
    BackHandler.exitApp();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-8">
          <View className="items-center mb-4">
            <Text className="text-4xl mb-2">🌟</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
              Before you go…
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
              Enjoying earning with AI Tasks? A 5-star rating helps us bring you more
              tasks and bigger rewards!
            </Text>
          </View>

          {/* Exit-moment native ad */}
          <View className="mb-4">
            <NativeAdCard />
          </View>

          <TouchableOpacity
            onPress={rate}
            className="bg-primary-600 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            activeOpacity={0.85}
          >
            <Star size={18} color="#fff" fill="#fff" />
            <Text className="text-white font-bold text-base">Rate on Play Store</Text>
          </TouchableOpacity>

          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              onPress={exit}
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
              activeOpacity={0.85}
            >
              <LogOut size={16} color="#6B7280" />
              <Text className="text-gray-600 dark:text-gray-300 font-semibold">Exit App</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl py-3.5 items-center justify-center"
              activeOpacity={0.85}
            >
              <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                💰 Keep earning
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
