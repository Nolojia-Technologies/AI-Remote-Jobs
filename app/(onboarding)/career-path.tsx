import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2 } from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
import { CAREER_PATHS } from "../../src/constants/careers";
import { useUserStore } from "../../src/stores/userStore";
import { useAuthStore } from "../../src/stores/authStore";
import * as Haptics from "expo-haptics";

export default function CareerPathScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectCareerPath, profile } = useUserStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(id);
  };

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert("Choose a Path", "Please select a career path to continue.");
      return;
    }
    setIsLoading(true);
    const { error } = await selectCareerPath(selected);
    setIsLoading(false);
    if (error) {
      Alert.alert("Error", error);
    } else {
      router.push("/(onboarding)/goals");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <View className="px-6 pt-6 pb-3">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="h-2 flex-1 rounded-full bg-primary" />
          <View className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          <View className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </View>
        <Text className="text-xs text-gray-400 mb-6 text-center">Step 1 of 3</Text>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your Career Path 🎯
        </Text>
        <Text className="text-gray-500 dark:text-gray-400">
          Select the AI career you want to master. You can change this later.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3 mt-4">
          {CAREER_PATHS.map((path) => {
            const isSelected = selected === path.id;
            return (
              <TouchableOpacity
                key={path.id}
                onPress={() => handleSelect(path.id)}
                activeOpacity={0.75}
                className={`flex-row items-center p-4 rounded-2xl border-2 ${
                  isSelected
                    ? "border-primary bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800"
                }`}
              >
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: path.color + "20" }}
                >
                  <Text className="text-2xl">{path.emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base font-bold mb-0.5 ${
                      isSelected ? "text-primary" : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {path.title}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400" numberOfLines={2}>
                    {path.description}
                  </Text>
                  <View className="flex-row flex-wrap gap-1 mt-2">
                    {path.skills.slice(0, 2).map((skill) => (
                      <View
                        key={skill}
                        className="px-2 py-0.5 rounded-lg"
                        style={{ backgroundColor: path.color + "15" }}
                      >
                        <Text className="text-xs font-medium" style={{ color: path.color }}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                {isSelected && (
                  <CheckCircle2 size={22} color="#2563EB" className="ml-2" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <Button
          label="Continue →"
          onPress={handleContinue}
          loading={isLoading}
          fullWidth
          size="lg"
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  );
}
