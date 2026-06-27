import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { DayActivity } from "../../revision/types";
import { CALENDAR_COLORS } from "../../revision/config";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function dayColor(activity: DayActivity | undefined, isFuture: boolean, isMissed: boolean): string {
  if (isFuture) return CALENDAR_COLORS.future;
  if (activity) {
    if (activity.milestone) return CALENDAR_COLORS.milestone;
    if (activity.revisions > 0) return CALENDAR_COLORS.revision;
    if (activity.lessons > 0 || activity.challenges > 0) return CALENDAR_COLORS.productive;
  }
  if (isMissed) return CALENDAR_COLORS.missed;
  return CALENDAR_COLORS.empty;
}

export function CalendarGrid({ history }: { history: Record<string, DayActivity> }) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const firstActivity = Object.keys(history).sort()[0] ?? null;
  const firstActivityTime = firstActivity ? new Date(firstActivity).getTime() : Infinity;

  const firstDow = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayKey = today.toISOString().split("T")[0];

  const move = (delta: number) => {
    let m = view.month + delta;
    let y = view.year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setView({ year: y, month: m });
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity onPress={() => move(-1)} className="p-1">
          <ChevronLeft size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 dark:text-white">
          {MONTHS[view.month]} {view.year}
        </Text>
        <TouchableOpacity onPress={() => move(1)} className="p-1">
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View className="flex-row">
        {WEEKDAYS.map((d, i) => (
          <View key={i} className="flex-1 items-center pb-2">
            <Text className="text-xs text-gray-400">{d}</Text>
          </View>
        ))}
      </View>

      {/* Day cells */}
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={{ width: `${100 / 7}%` }} className="aspect-square p-1" />;
          const key = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dateTime = new Date(key).getTime();
          const isFuture = key > todayKey;
          const isMissed = !isFuture && key < todayKey && dateTime >= firstActivityTime;
          const color = dayColor(history[key], isFuture, isMissed);
          const isToday = key === todayKey;
          return (
            <View key={i} style={{ width: `${100 / 7}%` }} className="aspect-square p-1">
              <View
                className={`flex-1 rounded-lg items-center justify-center ${isToday ? "border-2 border-primary" : ""}`}
                style={{ backgroundColor: color + (history[key] || isFuture ? "" : "55") }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: history[key] && !isFuture ? "#FFFFFF" : "#94A3B8" }}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <Legend color={CALENDAR_COLORS.productive} label="Productive" />
        <Legend color={CALENDAR_COLORS.revision} label="Revision" />
        <Legend color={CALENDAR_COLORS.milestone} label="Milestone" />
        <Legend color={CALENDAR_COLORS.missed} label="Missed" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
      <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}
