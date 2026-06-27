import React, { useEffect, useRef } from "react";
import { View, Text, Modal, Animated, Pressable, Easing } from "react-native";
import * as Haptics from "expo-haptics";
import { Star } from "lucide-react-native";
import { Button } from "../ui/Button";

interface RatingPromptProps {
  visible: boolean;
  onRate: () => void;
  onMaybeLater: () => void;
  onNoThanks: () => void;
}

/**
 * Professional, native-feeling rating prompt. Premium card with a soft spring
 * entrance, a gentle twinkle on the stars, and respectful, non-manipulative
 * copy. Tapping the backdrop is treated as "Maybe Later" so the user is never
 * trapped.
 */
export function RatingPrompt({ visible, onRate, onMaybeLater, onNoThanks }: RatingPromptProps) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0.85);
    opacity.setValue(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 140, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  const starScale = twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onMaybeLater}>
      <Animated.View style={{ opacity }} className="flex-1 items-center justify-center bg-black/60 px-6">
        {/* Backdrop tap = Maybe Later (never trap the user). */}
        <Pressable className="absolute inset-0" onPress={onMaybeLater} />

        <Animated.View
          style={{ transform: [{ scale }] }}
          className="bg-white dark:bg-gray-800 rounded-3xl px-6 pt-7 pb-6 w-full max-w-sm items-center shadow-2xl"
        >
          {/* Stars */}
          <View className="flex-row items-center gap-1 mb-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Animated.View key={i} style={{ transform: [{ scale: starScale }] }}>
                <Star size={28} color="#F59E0B" fill="#F59E0B" strokeWidth={1.5} />
              </Animated.View>
            ))}
          </View>

          <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Enjoying AI Remote Jobs?
          </Text>

          <Text className="text-[15px] leading-6 text-gray-600 dark:text-gray-300 text-center mb-6">
            We're working hard to help people learn skills and unlock remote opportunities.
            If the app has helped you, we'd greatly appreciate a quick rating on Google Play.
            Your support helps us improve and reach more job seekers.
          </Text>

          <Button label="Rate App" onPress={onRate} variant="primary" size="lg" fullWidth />

          <Button
            label="Maybe Later"
            onPress={onMaybeLater}
            variant="ghost"
            size="lg"
            fullWidth
            className="mt-2"
          />

          <Pressable onPress={onNoThanks} hitSlop={8} className="mt-3 py-1">
            <Text className="text-sm text-gray-400 dark:text-gray-500">No Thanks</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
