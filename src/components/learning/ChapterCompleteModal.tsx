import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, Animated } from "react-native";
import { Button } from "../ui/Button";

interface ChapterCompleteModalProps {
  visible: boolean;
  chapterTitle: string;
  xp: number;
  isMilestone: boolean;
  isStageComplete?: boolean;
  /** Watch a rewarded ad for a small bonus XP. Returns granted XP (-1 ad skipped, 0 cap reached). */
  onBonusAd: () => Promise<number>;
  onContinue: () => void;
}

export function ChapterCompleteModal({
  visible,
  chapterTitle,
  xp,
  isMilestone,
  isStageComplete,
  onBonusAd,
  onContinue,
}: ChapterCompleteModalProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const [bonus, setBonus] = useState<number | null>(null); // null = not tried, >=0 = result
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setBonus(null);
      scale.setValue(0);
      Animated.spring(scale, { toValue: 1, damping: 9, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handleBonus = async () => {
    setLoading(true);
    const granted = await onBonusAd();
    setLoading(false);
    if (granted >= 0) setBonus(granted); // -1 means ad not watched → let them try again
  };

  const claimed = bonus !== null;
  const title = isStageComplete
    ? "Stage Complete! 🏆"
    : isMilestone
    ? "Milestone Passed! ⭐"
    : "Chapter Completed! 🎉";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60 px-8">
        <Animated.View
          style={{ transform: [{ scale }] }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm items-center"
        >
          <Text className="text-6xl mb-3">{isStageComplete ? "🏆" : isMilestone ? "⭐" : "🎉"}</Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
            {title}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
            {chapterTitle}
          </Text>

          <View className="flex-row items-center gap-2 mb-2">
            <View className="bg-amber-100 dark:bg-amber-900/30 rounded-xl px-3 py-2 flex-row items-center gap-1">
              <Text className="text-base">⚡</Text>
              <Text className="font-bold text-amber-600 dark:text-amber-400">
                +{xp} XP{bonus && bonus > 0 ? ` +${bonus} bonus` : ""}
              </Text>
            </View>
            <View className="bg-primary-100 dark:bg-primary-900/30 rounded-xl px-3 py-2 flex-row items-center gap-1">
              <Text className="text-base">🏅</Text>
              <Text className="font-bold text-primary">Badge earned</Text>
            </View>
          </View>

          {!claimed ? (
            <Button
              label={loading ? "Loading ad…" : "Watch ad — Bonus XP 🎁"}
              onPress={handleBonus}
              loading={loading}
              variant="accent"
              fullWidth
              size="lg"
              className="mt-3"
            />
          ) : (
            <View className="bg-green-50 dark:bg-green-900/20 rounded-2xl py-3 w-full items-center mt-3">
              <Text className="font-bold text-green-600 dark:text-green-400">
                {bonus && bonus > 0 ? `+${bonus} bonus XP added! 🎉` : "Daily bonus limit reached"}
              </Text>
            </View>
          )}

          <Button
            label="Continue"
            onPress={onContinue}
            variant={claimed ? "primary" : "ghost"}
            fullWidth
            size="lg"
            className="mt-3"
          />
        </Animated.View>
      </View>
    </Modal>
  );
}
