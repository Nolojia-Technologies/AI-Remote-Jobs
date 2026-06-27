import React from "react";
import { View, Text } from "react-native";
import { DayActivity } from "../../revision/types";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function WeeklyReport({ history }: { history: Record<string, DayActivity> }) {
  // Last 7 days (oldest → newest)
  const days: { key: string; label: string; activity: DayActivity }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split("T")[0];
    days.push({
      key,
      label: DOW[d.getDay()],
      activity: history[key] ?? { lessons: 0, revisions: 0, challenges: 0, xp: 0, milestone: false },
    });
  }

  const totals = days.reduce(
    (acc, d) => ({
      lessons: acc.lessons + d.activity.lessons,
      revisions: acc.revisions + d.activity.revisions,
      xp: acc.xp + d.activity.xp,
      challenges: acc.challenges + d.activity.challenges,
    }),
    { lessons: 0, revisions: 0, xp: 0, challenges: 0 }
  );

  const maxXp = Math.max(1, ...days.map((d) => d.activity.xp));

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">📊 Weekly Report</Text>

      {/* XP bar chart */}
      <View className="flex-row items-end justify-between h-28 mb-2">
        {days.map((d) => {
          const h = Math.round((d.activity.xp / maxXp) * 100);
          return (
            <View key={d.key} className="flex-1 items-center justify-end">
              <View
                className="w-5 rounded-t-md"
                style={{ height: `${Math.max(6, h)}%`, backgroundColor: d.activity.xp > 0 ? "#2563EB" : "#E2E8F0" }}
              />
              <Text className="text-[10px] text-gray-400 mt-1">{d.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Totals */}
      <View className="flex-row flex-wrap mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <Stat label="Lessons" value={totals.lessons} />
        <Stat label="Revisions" value={totals.revisions} />
        <Stat label="Challenges" value={totals.challenges} />
        <Stat label="XP earned" value={totals.xp} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="w-1/2 mb-2">
      <Text className="text-xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}
