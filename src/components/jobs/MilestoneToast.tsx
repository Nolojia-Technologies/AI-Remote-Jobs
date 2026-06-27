import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, Animated, Easing, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const COLORS = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

interface MilestoneToastProps {
  visible: boolean;
  label: string;
  emoji: string;
  onHide: () => void;
}

/** A lightweight top banner with a short confetti burst, auto-dismisses. */
export function MilestoneToast({ visible, label, emoji, onHide }: MilestoneToastProps) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }).map(() => ({
        left: Math.random() * width,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 6,
        delay: Math.random() * 300,
        duration: 1200 + Math.random() * 800,
        drift: (Math.random() - 0.5) * 120,
      })),
    []
  );
  const progresses = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) return;

    Animated.spring(translateY, { toValue: 0, damping: 12, useNativeDriver: true }).start();

    progresses.forEach((p, i) => {
      p.setValue(0);
      Animated.timing(p, {
        toValue: 1,
        duration: pieces[i].duration,
        delay: pieces[i].delay,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    const t = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 350,
        useNativeDriver: true,
      }).start(() => onHide());
    }, 3200);

    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 }}>
      {/* confetti */}
      {pieces.map((piece, i) => {
        const ty = progresses[i].interpolate({ inputRange: [0, 1], outputRange: [0, 180] });
        const tx = progresses[i].interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] });
        const opacity = progresses[i].interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              top: 60,
              left: piece.left,
              width: piece.size,
              height: piece.size * 1.4,
              backgroundColor: piece.color,
              borderRadius: 2,
              transform: [{ translateY: ty }, { translateX: tx }],
              opacity,
            }}
          />
        );
      })}

      {/* banner */}
      <Animated.View
        style={{ transform: [{ translateY }] }}
        className="mx-4 mt-14 bg-gray-900 dark:bg-gray-800 rounded-2xl px-4 py-3 flex-row items-center gap-3 shadow-xl"
      >
        <Text className="text-2xl">{emoji}</Text>
        <View className="flex-1">
          <Text className="text-white font-bold text-sm">Milestone reached!</Text>
          <Text className="text-white/70 text-xs">{label}</Text>
        </View>
      </Animated.View>
    </View>
  );
}
