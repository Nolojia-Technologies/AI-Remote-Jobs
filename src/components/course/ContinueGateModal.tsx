import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, Animated } from "react-native";
import { CheckCircle2, Clock, Gift } from "lucide-react-native";
import { Button } from "../ui/Button";
import { formatCountdown } from "../../lib/readingTime";

interface ContinueGateModalProps {
  visible: boolean;
  /** Epoch ms when the cooldown ends (ignored once `unlocked`). */
  cooldownUntil: number;
  /** True when a rewarded ad has already unlocked the next lesson. */
  unlocked: boolean;
  /** Title of the lesson the learner just finished. */
  lessonTitle: string;
  /** Watch a rewarded ad to skip the wait. Returns whether it was watched. */
  onWatchAd: () => Promise<boolean>;
  /** Proceed to the next lesson (enabled once unlocked / countdown done). */
  onContinue: () => void;
}

/**
 * Shown after a lesson is completed. The next lesson is held behind a short
 * cooldown; the learner can wait out the countdown or watch one rewarded ad to
 * continue immediately. Intentionally calm and non-manipulative — it always
 * offers a free path (waiting) alongside the ad.
 */
export function ContinueGateModal({
  visible,
  cooldownUntil,
  unlocked,
  lessonTitle,
  onWatchAd,
  onContinue,
}: ContinueGateModalProps) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const [now, setNow] = useState(Date.now());
  const [adLoading, setAdLoading] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setRewarded(false);
    scale.setValue(0.9);
    Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 140, useNativeDriver: true }).start();
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [visible]);

  const remainingMs = Math.max(0, cooldownUntil - now);
  const ready = unlocked || rewarded || remainingMs <= 0;

  const handleWatchAd = async () => {
    setAdLoading(true);
    const watched = await onWatchAd();
    setAdLoading(false);
    if (watched) setRewarded(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => ready && onContinue()}>
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <Animated.View
          style={{ transform: [{ scale }] }}
          className="bg-white dark:bg-gray-800 rounded-3xl px-6 pt-7 pb-6 w-full max-w-sm items-center"
        >
          <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-3">
            <CheckCircle2 size={34} color="#22C55E" />
          </View>

          <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
            Lesson complete! 🎉
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 mb-5" numberOfLines={2}>
            {lessonTitle}
          </Text>

          {rewarded ? (
            // ── Reward confirmation ──────────────────────────────────────────
            <View className="items-center">
              <View className="flex-row items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-2xl px-4 py-3 mb-4">
                <Gift size={18} color="#22C55E" />
                <Text className="text-sm font-semibold text-green-700 dark:text-green-300 text-center flex-shrink">
                  Thanks for supporting AI Remote Jobs. Your next lesson has been unlocked.
                </Text>
              </View>
              <Button label="Continue Learning →" onPress={onContinue} variant="primary" size="lg" fullWidth />
            </View>
          ) : ready ? (
            // ── Cooldown elapsed ─────────────────────────────────────────────
            <View className="items-center w-full">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your next lesson is ready.</Text>
              <Button label="Continue Learning →" onPress={onContinue} variant="primary" size="lg" fullWidth />
            </View>
          ) : (
            // ── Counting down: watch ad or wait ──────────────────────────────
            <View className="items-center w-full">
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                Choose how you'd like to continue.
              </Text>

              <Button
                label={adLoading ? "Loading ad…" : "Watch Ad — Unlock Now 🎁"}
                onPress={handleWatchAd}
                loading={adLoading}
                variant="accent"
                size="lg"
                fullWidth
              />

              <View className="flex-row items-center gap-2 mt-4">
                <Clock size={16} color="#9CA3AF" />
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  Next lesson unlocks in{" "}
                  <Text className="font-bold text-gray-700 dark:text-gray-200">{formatCountdown(Math.ceil(remainingMs / 1000))}</Text>
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
