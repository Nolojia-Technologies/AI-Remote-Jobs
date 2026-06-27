import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, CheckCircle2, Zap, BookOpen } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useLearnStore } from "../../src/stores/learnStore";
import { useUserStore } from "../../src/stores/userStore";
import { LessonCard } from "../../src/components/learn/LessonCard";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { Button } from "../../src/components/ui/Button";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { LessonWithProgress, ModuleWithProgress } from "../../src/types/app.types";
import { XP_REWARDS } from "../../src/constants/xp";

// Module view — shows all lessons in the module
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { modules, currentModule, setCurrentModule, completeLesson, isLessonCompleted } =
    useLearnStore();
  const { profile } = useUserStore();

  const [selectedLesson, setSelectedLesson] = useState<LessonWithProgress | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showXPPopup, setShowXPPopup] = useState(false);

  const xpScale = useRef(new Animated.Value(0)).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;

  const module = modules.find((m) => m.id === id);

  useEffect(() => {
    if (module) setCurrentModule(module);
    return () => setCurrentModule(null);
  }, [id]);

  const showXPAnimation = () => {
    setShowXPPopup(true);
    xpScale.setValue(0);
    xpOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(xpScale, { toValue: 1, damping: 10, useNativeDriver: true }),
      Animated.timing(xpOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(xpOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(xpScale, { toValue: 1.5, duration: 500, useNativeDriver: true }),
        ]).start(() => setShowXPPopup(false));
      }, 1500);
    });
  };

  const handleCompleteLesson = async () => {
    if (!selectedLesson || !user) return;
    if (isLessonCompleted(selectedLesson.id)) {
      Alert.alert("Already Completed", "You've already completed this lesson!");
      return;
    }
    setIsCompleting(true);
    await completeLesson(user.id, selectedLesson.id);
    setIsCompleting(false);
    showXPAnimation();
    setSelectedLesson(null);
  };

  if (!module) {
    return <LoadingSpinner fullScreen message="Loading module..." />;
  }

  // Show lesson content if a lesson is selected
  if (selectedLesson) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <TouchableOpacity
            onPress={() => setSelectedLesson(null)}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mr-3"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
              {selectedLesson.title}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">{module.title}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-base text-gray-800 dark:text-gray-200 leading-7">
            {selectedLesson.content
              .split("\n")
              .map((line, i) => {
                if (line.startsWith("# ")) {
                  return (
                    <Text key={i} className="text-2xl font-bold text-gray-900 dark:text-white block">
                      {line.replace("# ", "")}{"\n"}
                    </Text>
                  );
                } else if (line.startsWith("## ")) {
                  return (
                    <Text key={i} className="text-xl font-bold text-gray-900 dark:text-white">
                      {"\n"}{line.replace("## ", "")}{"\n"}
                    </Text>
                  );
                } else if (line.startsWith("**") && line.endsWith("**")) {
                  return (
                    <Text key={i} className="font-bold text-gray-900 dark:text-white">
                      {line.replace(/\*\*/g, "")}{"\n"}
                    </Text>
                  );
                }
                return line + "\n";
              })}
          </Text>
        </ScrollView>

        {/* Complete button */}
        <View className="px-5 pb-8 pt-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
          <View className="flex-row items-center gap-2 mb-3">
            <Zap size={14} color="#F59E0B" fill="#F59E0B" />
            <Text className="text-sm text-amber-600 dark:text-amber-400 font-semibold">
              Complete to earn +{XP_REWARDS.LESSON_COMPLETE} XP
            </Text>
          </View>
          {isLessonCompleted(selectedLesson.id) ? (
            <View className="flex-row items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-2xl py-4">
              <CheckCircle2 size={20} color="#22C55E" />
              <Text className="text-green-600 dark:text-green-400 font-bold">
                Lesson Completed!
              </Text>
            </View>
          ) : (
            <Button
              label="Mark as Complete ✓"
              onPress={handleCompleteLesson}
              loading={isCompleting}
              fullWidth
              size="lg"
              variant="accent"
            />
          )}
        </View>

        {/* XP Popup */}
        {showXPPopup && (
          <View className="absolute top-1/3 left-0 right-0 items-center pointer-events-none">
            <Animated.View
              style={{ transform: [{ scale: xpScale }], opacity: xpOpacity }}
              className="bg-amber-500 rounded-2xl px-6 py-4 items-center shadow-xl"
            >
              <Zap size={32} color="white" fill="white" />
              <Text className="text-white text-2xl font-bold mt-1">
                +{XP_REWARDS.LESSON_COMPLETE} XP
              </Text>
              <Text className="text-white/80 text-sm">Lesson Complete!</Text>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Module overview
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mr-3"
        >
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {module.title}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {module.completedLessons}/{module.totalLessons} lessons
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Module info */}
        <View className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 mb-5">
          <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {module.description}
          </Text>
          <ProgressBar
            progress={module.progressPercent}
            height={8}
            color="#2563EB"
            animated
          />
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {module.progressPercent}% complete
            </Text>
            <View className="flex-row items-center gap-1">
              <Zap size={12} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-xs text-amber-600 font-semibold">
                +{module.xp_reward} XP module bonus
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
          Lessons ({module.totalLessons})
        </Text>

        {module.lessons.map((lesson, idx) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={idx}
            onPress={() => setSelectedLesson(lesson)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
