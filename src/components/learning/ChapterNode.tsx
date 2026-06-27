import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Lock, Check, Star, Crown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Chapter, ChapterStatus } from "../../learning/types";

interface ChapterNodeProps {
  chapter: Chapter;
  status: ChapterStatus;
  stageColor: string;
  isLast: boolean;
  onPress: () => void;
}

export function ChapterNode({ chapter, status, stageColor, isLast, onPress }: ChapterNodeProps) {
  const kind = status.kind;
  const isActive = kind === "active";
  const isDone = kind === "completed";

  const circleStyle =
    isDone
      ? { backgroundColor: stageColor, borderColor: stageColor }
      : isActive
      ? { backgroundColor: "#FFFFFF", borderColor: stageColor }
      : { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" };

  return (
    <View className="flex-row items-stretch">
      {/* Rail with node */}
      <View className="items-center w-16">
        <TouchableOpacity
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }}
          activeOpacity={0.8}
          className="w-14 h-14 rounded-full items-center justify-center border-4"
          style={circleStyle}
        >
          {isDone ? (
            <Check size={24} color="#FFFFFF" strokeWidth={3} />
          ) : kind === "locked" ? (
            <Lock size={20} color="#94A3B8" />
          ) : chapter.isMilestone ? (
            <Crown size={22} color={stageColor} />
          ) : (
            <Text className="text-base font-bold" style={{ color: stageColor }}>
              {chapter.chapterIndex}
            </Text>
          )}
        </TouchableOpacity>
        {!isLast && (
          <View
            className="flex-1 w-1 my-1 rounded-full"
            style={{ backgroundColor: isDone ? stageColor : "#E2E8F0", minHeight: 28 }}
          />
        )}
      </View>

      {/* Card */}
      <TouchableOpacity
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.85}
        className={`flex-1 mb-3 rounded-2xl p-4 border-2 ${
          isActive
            ? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
            : isDone
            ? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
            : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-80"
        }`}
      >
        <View className="flex-row items-center gap-2 mb-1 flex-wrap">
          <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: stageColor }}>
            Chapter {chapter.chapterIndex}
          </Text>
          {chapter.isMilestone && (
            <View className="flex-row items-center gap-1 bg-amber-100 dark:bg-amber-900/30 rounded-md px-1.5 py-0.5">
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-[10px] font-bold text-amber-600">Milestone</Text>
            </View>
          )}
          {isDone && (
            <View className="bg-green-100 dark:bg-green-900/30 rounded-md px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-green-600">Completed</Text>
            </View>
          )}
        </View>

        <Text
          className={`text-base font-bold ${
            kind === "locked" ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
          }`}
          numberOfLines={1}
        >
          {chapter.title}
        </Text>

        {kind === "locked" ? (
          <Text className="text-xs text-gray-400 mt-1">🔒 {status.reason}</Text>
        ) : (
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {chapter.completedLessons}/{chapter.totalLessons} lessons · +{chapter.xp_reward} XP
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
