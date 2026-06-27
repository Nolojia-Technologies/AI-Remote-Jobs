import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, Animated } from "react-native";
import { Button } from "../ui/Button";
import { RevisionSessionResult } from "../../revision/types";

interface RevisionRewardModalProps {
  visible: boolean;
  result: RevisionSessionResult | null;
  revisionStreak: number;
  /** Watch a rewarded ad for a small bonus XP. Returns granted XP (-1 skipped, 0 cap). */
  onBonusAd: () => Promise<number>;
  onContinue: () => void;
}

export function RevisionRewardModal({
  visible,
  result,
  revisionStreak,
  onBonusAd,
  onContinue,
}: RevisionRewardModalProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const [bonus, setBonus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setBonus(null);
      scale.setValue(0);
      Animated.spring(scale, { toValue: 1, damping: 9, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!result) return null;

  const accuracy = Math.round((result.correct / Math.max(1, result.total)) * 100);
  const claimed = bonus !== null;

  const handleBonus = async () => {
    setLoading(true);
    const granted = await onBonusAd();
    setLoading(false);
    if (granted >= 0) setBonus(granted);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60 px-8">
        <Animated.View
          style={{ transform: [{ scale }] }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm items-center"
        >
          <Text className="text-6xl mb-2">🧠</Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
            Revision Complete!
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {result.correct}/{result.total} correct · {accuracy}% accuracy
          </Text>

          <View className="w-full gap-2 mb-4">
            <Row emoji="⚡" label="XP earned" value={`+${result.xpEarned}${bonus && bonus > 0 ? ` +${bonus} bonus` : ""}`} />
            <Row emoji="🔥" label="Revision streak" value={`${revisionStreak} day${revisionStreak === 1 ? "" : "s"}`} />
            <Row emoji="💪" label="Memory restored" value={`${result.topicsStrengthened.length} topic${result.topicsStrengthened.length === 1 ? "" : "s"}`} />
          </View>

          {!claimed ? (
            <Button
              label={loading ? "Loading ad…" : "Watch ad — Bonus XP 🎁"}
              onPress={handleBonus}
              loading={loading}
              variant="accent"
              fullWidth
              size="lg"
            />
          ) : (
            <View className="bg-green-50 dark:bg-green-900/20 rounded-2xl py-3 w-full items-center">
              <Text className="font-bold text-green-600 dark:text-green-400">
                {bonus && bonus > 0 ? `+${bonus} bonus XP! 🎉` : "Daily bonus limit reached"}
              </Text>
            </View>
          )}

          <Button label="Continue" onPress={onContinue} variant={claimed ? "primary" : "ghost"} fullWidth size="lg" className="mt-3" />
        </Animated.View>
      </View>
    </Modal>
  );
}

function Row({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2.5">
      <Text className="text-base mr-2">{emoji}</Text>
      <Text className="flex-1 text-sm text-gray-600 dark:text-gray-400">{label}</Text>
      <Text className="text-sm font-bold text-gray-900 dark:text-white">{value}</Text>
    </View>
  );
}
