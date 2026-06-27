import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2 } from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
import { GOALS } from "../../src/types/app.types";
import { useUserStore } from "../../src/stores/userStore";
import { NotificationService } from "../../src/notifications/NotificationService";
import * as Haptics from "expo-haptics";

export default function GoalsScreen() {
  const router = useRouter();
  const { selectGoal } = useUserStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert("Choose a Goal", "Please select your primary goal to continue.");
      return;
    }
    setIsLoading(true);
    await selectGoal(selected);
    // Ask for notification permission at the end of onboarding, then arm reminders.
    await NotificationService.requestPermission();
    await NotificationService.syncEngagement();
    setIsLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <View className="flex-1 px-6 pt-6">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="h-2 flex-1 rounded-full bg-primary" />
          <View className="h-2 flex-1 rounded-full bg-primary" />
          <View className="h-2 flex-1 rounded-full bg-primary" />
        </View>
        <Text className="text-xs text-gray-400 mb-6 text-center">Step 3 of 3</Text>

        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What's Your Main Goal? 🎯
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mb-8">
          We'll personalise your experience based on what matters most to you.
        </Text>

        <View className="gap-3 flex-1">
          {GOALS.map((goal) => {
            const isSelected = selected === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelected(goal.id);
                }}
                activeOpacity={0.75}
                className={`flex-row items-center p-5 rounded-2xl border-2 ${
                  isSelected
                    ? "border-primary bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <Text className="text-3xl mr-4">{goal.icon}</Text>
                <Text
                  className={`text-base font-semibold flex-1 ${
                    isSelected ? "text-primary" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {goal.label}
                </Text>
                {isSelected && <CheckCircle2 size={22} color="#2563EB" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="pb-8 pt-6">
          <Button
            label="Start My Journey 🚀"
            onPress={handleContinue}
            loading={isLoading}
            fullWidth
            size="xl"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
