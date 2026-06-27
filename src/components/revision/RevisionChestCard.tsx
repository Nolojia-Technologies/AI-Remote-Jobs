import React, { useState } from "react";
import { View, Text } from "react-native";
import { ProgressBar } from "../ui/ProgressBar";
import { Button } from "../ui/Button";
import { RevisionEngine } from "../../revision/revisionEngine";
import { CHEST_TIERS } from "../../revision/config";
import { useRevisionStore } from "../../stores/revisionStore";

export function RevisionChestCard({ onClaim }: { onClaim: () => Promise<boolean> }) {
  const state = useRevisionStore();
  const [loading, setLoading] = useState(false);

  const { next, progress, remaining } = RevisionEngine.nextChest(state.chestSessions);
  const claimable = RevisionEngine.claimableTierIndex(state);
  const claimTier = claimable >= 0 ? CHEST_TIERS[claimable] : null;

  const handleClaim = async () => {
    setLoading(true);
    const ok = await onClaim();
    setLoading(false);
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-gray-900 dark:text-white">Revision Chest</Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">{state.chestSessions} sessions</Text>
      </View>

      {claimTier ? (
        <View className="items-center py-2">
          <Text className="text-5xl mb-2">{claimTier.emoji}</Text>
          <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {claimTier.label} ready!
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
            Open it with a rewarded ad for XP, boosters, energy & more.
          </Text>
          <Button
            label={loading ? "Opening…" : `Open ${claimTier.label} 🎁`}
            onPress={handleClaim}
            loading={loading}
            variant="accent"
            fullWidth
          />
        </View>
      ) : (
        <View>
          <View className="flex-row items-center gap-3 mb-3">
            <Text className="text-4xl">{next.emoji}</Text>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900 dark:text-white">{next.label}</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {remaining} more revision{remaining === 1 ? "" : "s"} to unlock
              </Text>
            </View>
          </View>
          <ProgressBar progress={progress} height={8} color={next.color} />
          <View className="flex-row justify-between mt-3">
            {CHEST_TIERS.map((t, i) => (
              <View key={t.id} className="items-center">
                <Text className={`text-lg ${state.chestSessions >= t.threshold ? "" : "opacity-30"}`}>{t.emoji}</Text>
                <Text className="text-[10px] text-gray-400">{t.threshold}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
