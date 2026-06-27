import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { Zap, X } from "lucide-react-native";
import { Button } from "../ui/Button";
import { PROGRESSION } from "../../learning/config";

interface EnergyModalProps {
  visible: boolean;
  nextEnergyInMs: number | null;
  onWatchAd: () => Promise<boolean>;
  onRestored: () => void;
  onClose: () => void;
}

function fmt(ms: number): string {
  const m = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

export function EnergyModal({ visible, nextEnergyInMs, onWatchAd, onRestored, onClose }: EnergyModalProps) {
  const [loading, setLoading] = useState(false);

  const handleAd = async () => {
    setLoading(true);
    const watched = await onWatchAd();
    setLoading(false);
    if (watched) onRestored();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-8">
        <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm items-center">
          <TouchableOpacity onPress={onClose} className="self-end p-1">
            <X size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <View className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center mb-3">
            <Zap size={32} color="#F59E0B" fill="#F59E0B" />
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
            Out of Energy
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
            You need energy to start a lesson. Restore it instantly or wait for it to refill.
          </Text>

          <Button
            label={loading ? "Loading ad…" : `Watch ad — restore +${PROGRESSION.energy.adRestore} energy`}
            onPress={handleAd}
            loading={loading}
            fullWidth
            size="lg"
            variant="accent"
            icon={<Text className="text-base">⚡</Text>}
          />

          <Text className="text-xs text-gray-400 mt-4 text-center">
            {nextEnergyInMs != null
              ? `Or wait — +1 energy in ${fmt(nextEnergyInMs)}`
              : "Energy will refill over time"}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
