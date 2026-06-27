import React, { useRef, useState } from "react";
import { View, Text, Dimensions, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../../src/components/ui/Button";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🤖",
    gradient: ["#2563EB", "#0EA5E9"] as [string, string],
    title: "Learn AI Skills and\nBuild Your Future",
    description:
      "Master AI tools used by top professionals worldwide. No degree required — just dedication.",
  },
  {
    emoji: "💰",
    gradient: ["#22C55E", "#14B8A6"] as [string, string],
    title: "Unlock Remote Income\nOpportunities",
    description:
      "Complete skills, earn certificates, and access real remote work opportunities from Kenya, Qatar, and beyond.",
  },
  {
    emoji: "🏆",
    gradient: ["#8B5CF6", "#EC4899"] as [string, string],
    title: "Compete, Grow, and\nRise to the Top",
    description:
      "Earn XP, climb leaderboards, unlock achievements, and prove your skills with official certificates.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      const next = index + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    } else {
      router.push("/(onboarding)/career-path");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1">
            <LinearGradient
              colors={item.gradient}
              className="flex-1 items-center justify-center px-8 py-12"
            >
              <Text className="text-8xl mb-8">{item.emoji}</Text>
              <Text className="text-3xl font-bold text-white text-center leading-10 mb-4">
                {item.title}
              </Text>
              <Text className="text-white/75 text-lg text-center leading-7">
                {item.description}
              </Text>
            </LinearGradient>
          </View>
        )}
      />

      {/* Bottom */}
      <View className="px-6 pb-8 pt-6 bg-white dark:bg-gray-950">
        {/* Dots */}
        <View className="flex-row justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                height: 8,
                borderRadius: 4,
                width: i === index ? 24 : 8,
                backgroundColor: i === index ? "#2563EB" : "#E2E8F0",
              }}
            />
          ))}
        </View>

        <Button
          label={index === SLIDES.length - 1 ? "Get Started 🚀" : "Next"}
          onPress={handleNext}
          fullWidth
          size="xl"
        />

        {index < SLIDES.length - 1 && (
          <TouchableOpacity
            onPress={() => router.push("/(onboarding)/career-path")}
            className="items-center mt-4"
          >
            <Text className="text-gray-400 dark:text-gray-500 text-sm">Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
