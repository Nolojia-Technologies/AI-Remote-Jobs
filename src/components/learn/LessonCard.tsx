import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2, Circle, PlayCircle, Clock, Zap } from "lucide-react-native";
import { LessonWithProgress } from "../../types/app.types";
import * as Haptics from "expo-haptics";

interface LessonCardProps {
  lesson: LessonWithProgress;
  index: number;
  onPress: () => void;
}

export function LessonCard({ lesson, index, onPress }: LessonCardProps) {
  return (
    <TouchableOpacity
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.75}
      className={`flex-row items-center p-4 mb-2 rounded-2xl border-2 ${
        lesson.isCompleted
          ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
      }`}
    >
      {/* Index / Check */}
      <View className="w-8 h-8 rounded-full items-center justify-center mr-3">
        {lesson.isCompleted ? (
          <CheckCircle2 size={28} color="#22C55E" />
        ) : (
          <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
            <Text className="text-xs font-bold text-primary">{index + 1}</Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text
          className={`text-base font-semibold mb-1 ${
            lesson.isCompleted
              ? "text-green-700 dark:text-green-400"
              : "text-gray-900 dark:text-white"
          }`}
          numberOfLines={1}
        >
          {lesson.title}
        </Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Clock size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {lesson.duration_minutes} min
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Zap size={12} color="#F59E0B" fill="#F59E0B" />
            <Text className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              +{lesson.xp_reward} XP
            </Text>
          </View>
          {lesson.video_url && (
            <View className="flex-row items-center gap-1">
              <PlayCircle size={12} color="#0EA5E9" />
              <Text className="text-xs text-sky-500">Video</Text>
            </View>
          )}
        </View>
      </View>

      {!lesson.isCompleted && (
        <View className="bg-primary rounded-xl px-2.5 py-1.5 ml-2">
          <Text className="text-white text-xs font-bold">Start</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
