import React from "react";
import { View, Text } from "react-native";
import { CheckCircle2, Circle } from "lucide-react-native";
import { DailyGoal } from "../../revision/types";

export function DailyGoalsCard({ goals }: { goals: DailyGoal[] }) {
  const done = goals.filter((g) => g.current >= g.target).length;

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-gray-900 dark:text-white">🎯 Daily Goals</Text>
        <Text className="text-xs font-bold text-primary">
          {done}/{goals.length} done
        </Text>
      </View>
      <View className="gap-2.5">
        {goals.map((g) => {
          const complete = g.current >= g.target;
          return (
            <View key={g.id} className="flex-row items-center gap-2.5">
              {complete ? (
                <CheckCircle2 size={18} color="#22C55E" />
              ) : (
                <Circle size={18} color="#CBD5E1" />
              )}
              <Text className="text-base mr-1">{g.emoji}</Text>
              <Text
                className={`flex-1 text-sm ${complete ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"}`}
              >
                {g.label}
              </Text>
              <Text className="text-xs font-semibold text-gray-400">
                {Math.min(g.current, g.target)}/{g.target}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
