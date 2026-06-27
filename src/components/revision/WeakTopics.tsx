import React from "react";
import { View, Text } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { MemoryBar } from "./MemoryBar";
import { WeakTopic } from "../../revision/types";
import { MEMORY } from "../../revision/config";

export function WeakTopics({ topics }: { topics: WeakTopic[] }) {
  const weak = topics.filter((t) => t.averageStrength < MEMORY.moderateBelow).slice(0, 5);
  if (weak.length === 0) return null;

  return (
    <View>
      <View className="flex-row items-center gap-2 mb-3">
        <AlertTriangle size={18} color="#F59E0B" />
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Topics Needing Improvement</Text>
      </View>
      <View className="gap-3">
        {weak.map((t) => (
          <View key={t.topic} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
                {t.topic}
              </Text>
              {t.dueCount > 0 && (
                <View className="bg-red-100 dark:bg-red-900/30 rounded-md px-2 py-0.5">
                  <Text className="text-xs font-bold text-red-600">{t.dueCount} due</Text>
                </View>
              )}
            </View>
            <MemoryBar strength={t.averageStrength} />
            {t.averageStrength < MEMORY.weakBelow && (
              <Text className="text-xs text-red-500 mt-2">
                ⚠️ Your {t.topic} skill is weakening — review now to restore mastery.
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
