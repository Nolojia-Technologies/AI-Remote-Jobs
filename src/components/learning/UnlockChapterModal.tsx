import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { Lock, X, Clock } from "lucide-react-native";
import { Button } from "../ui/Button";
import { ChapterStatus } from "../../learning/types";

interface UnlockChapterModalProps {
  visible: boolean;
  chapterTitle: string;
  status: ChapterStatus | null;
  onUnlockAd: () => Promise<boolean>;
  onBonusAd: () => Promise<boolean>;
  onUnlocked: () => void;
  onClose: () => void;
}

function fmt(ms: number): string {
  const h = Math.max(0, Math.ceil(ms / 3600000));
  return `${h}h`;
}

export function UnlockChapterModal({
  visible,
  chapterTitle,
  status,
  onUnlockAd,
  onBonusAd,
  onUnlocked,
  onClose,
}: UnlockChapterModalProps) {
  const [loading, setLoading] = useState(false);
  const now = Date.now();
  const dailyBlocked = status?.dailyBlocked;
  const bonusAvailable = status?.bonusAvailable;
  const autoIn = status?.autoUnlockAt ? Math.max(0, status.autoUnlockAt - now) : null;

  const run = async (fn: () => Promise<boolean>) => {
    setLoading(true);
    const ok = await fn();
    setLoading(false);
    if (ok) onUnlocked();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-8">
        <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm items-center">
          <TouchableOpacity onPress={onClose} className="self-end p-1">
            <X size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mb-3">
            <Lock size={30} color="#2563EB" />
          </View>

          {dailyBlocked ? (
            <>
              <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
                Daily Limit Reached
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
                Amazing work today! Come back tomorrow for more learning
                {bonusAvailable ? ", or unlock one bonus chapter now." : "."}
              </Text>
              {bonusAvailable && (
                <Button
                  label={loading ? "Loading ad…" : "Watch ad — unlock +1 bonus chapter"}
                  onPress={() => run(onBonusAd)}
                  loading={loading}
                  fullWidth
                  size="lg"
                  variant="accent"
                  icon={<Text className="text-base">🎁</Text>}
                />
              )}
            </>
          ) : (
            <>
              <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
                🔒 Next Chapter Locked
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
                {chapterTitle}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
                Unlock it now like opening the next level — or let it unlock on its own.
              </Text>
              <Button
                label={loading ? "Loading ad…" : "Watch ad — Unlock Now 🚀"}
                onPress={() => run(onUnlockAd)}
                loading={loading}
                fullWidth
                size="lg"
              />
              {autoIn != null && autoIn > 0 && (
                <View className="flex-row items-center gap-1.5 mt-4">
                  <Clock size={14} color="#9CA3AF" />
                  <Text className="text-xs text-gray-400">
                    Or wait — unlocks automatically in {fmt(autoIn)}
                  </Text>
                </View>
              )}
            </>
          )}

          <TouchableOpacity onPress={onClose} className="mt-4">
            <Text className="text-sm text-gray-500">Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
