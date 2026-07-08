import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Trophy, XCircle, RefreshCw, BookOpen, ListChecks, Home } from "lucide-react-native";
import { useCertificationStore } from "../../src/stores/certificationStore";
import { useInterstitialMoment } from "../../src/hooks/useAds";

export default function CertificationResult() {
  const router = useRouter();
  const { lastResult } = useCertificationStore();
  const triggerInterstitial = useInterstitialMoment();

  const anim = useRef(new Animated.Value(0)).current;
  const passed = !!lastResult?.passed;

  // On the way to the (now unlocked) jobs — show a celebration interstitial.
  async function goToJobs() {
    await triggerInterstitial("quiz_passed");
    router.replace("/(tabs)/jobs" as any);
  }

  // Nothing to show (e.g. deep-linked) → back to hub.
  useEffect(() => {
    if (!lastResult) {
      router.replace("/certification" as any);
      return;
    }
    // Celebratory pop-in; success haptic on a pass.
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
    Haptics.notificationAsync(
      passed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    ).catch(() => {});
  }, [lastResult]);
  if (!lastResult) return null;

  const stats = [
    { label: "Correct", value: lastResult.correct_count, color: "#22C55E" },
    { label: "Incorrect", value: lastResult.incorrect_count, color: "#EF4444" },
    { label: "Skipped", value: lastResult.skipped_count, color: "#9CA3AF" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Animated.View
          style={{ opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}
          className={`rounded-3xl p-6 items-center mb-5 ${passed ? "bg-green-600" : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"}`}
        >
          {passed ? <Trophy size={48} color="#FFFFFF" /> : <XCircle size={48} color="#EF4444" />}
          <Text className={`text-2xl font-extrabold mt-3 ${passed ? "text-white" : "text-gray-900 dark:text-white"}`}>
            {passed ? "Congratulations!" : lastResult.expired ? "Time's up" : "Not quite yet"}
          </Text>
          <Text className={`text-center mt-1 ${passed ? "text-green-50" : "text-gray-500 dark:text-gray-400"}`}>
            {passed
              ? "You are now Job Ready. You can apply for remote jobs!"
              : `You scored ${lastResult.percentage}%. Required: ${lastResult.passing_score}%. Review your courses and try again.`}
          </Text>
          <Text className={`text-5xl font-extrabold mt-4 ${passed ? "text-white" : "text-gray-900 dark:text-white"}`}>{lastResult.percentage}%</Text>
        </Animated.View>

        <View className="flex-row gap-3 mb-6">
          {stats.map((s) => (
            <View key={s.label} className="flex-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 items-center">
              <Text className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</Text>
              <Text className="text-xs text-gray-400 mt-1">{s.label}</Text>
            </View>
          ))}
        </View>

        {passed ? (
          <TouchableOpacity onPress={goToJobs} className="rounded-2xl bg-primary p-4 flex-row items-center justify-center gap-2 mb-3">
            <BookOpen size={18} color="#FFFFFF" />
            <Text className="text-white font-bold">Browse unlocked jobs</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.replace("/certification" as any)} className="rounded-2xl bg-primary p-4 flex-row items-center justify-center gap-2 mb-3">
            <RefreshCw size={18} color="#FFFFFF" />
            <Text className="text-white font-bold">Back to certification</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.push({ pathname: "/certification/review", params: { id: lastResult.attempt_id } } as any)}
          className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 flex-row items-center justify-center gap-2 mb-3"
        >
          <ListChecks size={18} color="#2563EB" />
          <Text className="text-primary font-bold">Review answers</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(tabs)" as any)} className="flex-row items-center justify-center gap-2 p-3">
          <Home size={16} color="#9CA3AF" />
          <Text className="text-gray-400 font-medium">Back home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
