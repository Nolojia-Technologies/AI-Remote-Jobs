import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Zap, Plus } from "lucide-react-native";
import { useProgressionStore } from "../../stores/progressionStore";
import { ProgressionEngine } from "../../learning/progressionEngine";
import { PROGRESSION } from "../../learning/config";

function formatCountdown(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

export function EnergyBar({ onAddPress }: { onAddPress?: () => void }) {
  const state = useProgressionStore();
  const [, force] = useState(0);

  // Re-render each minute so the regen countdown stays fresh.
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const energy = ProgressionEngine.getEnergy(state, now);
  const max = PROGRESSION.energy.max;
  const nextAt = ProgressionEngine.nextEnergyAt(state, now);

  return (
    <View className="flex-row items-center gap-2 bg-white dark:bg-gray-800 rounded-2xl px-3 py-2 border border-gray-100 dark:border-gray-700">
      <Zap size={18} color="#F59E0B" fill="#F59E0B" />
      <Text className="text-base font-bold text-gray-900 dark:text-white">
        {energy}
        <Text className="text-sm font-normal text-gray-400">/{max}</Text>
      </Text>

      {/* pips */}
      <View className="flex-row gap-1 ml-1">
        {Array.from({ length: Math.min(max, 10) }).map((_, i) => (
          <View
            key={i}
            className="w-1.5 h-4 rounded-full"
            style={{ backgroundColor: i < energy ? "#F59E0B" : "#E5E7EB" }}
          />
        ))}
      </View>

      {energy < max && nextAt && (
        <Text className="text-xs text-gray-400 ml-1">+1 in {formatCountdown(nextAt - now)}</Text>
      )}

      {onAddPress && (
        <TouchableOpacity
          onPress={onAddPress}
          className="ml-auto w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center"
        >
          <Plus size={16} color="#F59E0B" />
        </TouchableOpacity>
      )}
    </View>
  );
}
