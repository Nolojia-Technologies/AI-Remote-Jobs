import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, Animated, Easing, Dimensions, Modal } from "react-native";
import { Button } from "../ui/Button";

const { width, height } = Dimensions.get("window");
const CONFETTI_COLORS = ["#2563EB", "#0EA5E9", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

interface UnlockCelebrationProps {
  visible: boolean;
  jobTitle: string;
  xpAwarded?: number;
  onClose: () => void;
}

interface Piece {
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  rotateTo: number;
}

function ConfettiPiece({ piece, progress }: { piece: Piece; progress: Animated.Value }) {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, height + 40],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, piece.drift],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${piece.rotateTo}deg`],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: piece.left,
        width: piece.size,
        height: piece.size * 1.4,
        backgroundColor: piece.color,
        borderRadius: 2,
        transform: [{ translateY }, { translateX }, { rotate }],
        opacity,
      }}
    />
  );
}

export function UnlockCelebration({
  visible,
  jobTitle,
  xpAwarded = 100,
  onClose,
}: UnlockCelebrationProps) {
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 28 }).map(() => ({
        left: Math.random() * width,
        size: 7 + Math.random() * 7,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 400,
        duration: 1800 + Math.random() * 1400,
        drift: (Math.random() - 0.5) * 160,
        rotateTo: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
      })),
    []
  );
  const progresses = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) return;

    cardScale.setValue(0);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, damping: 9, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    const anims = progresses.map((p, i) => {
      p.setValue(0);
      return Animated.timing(p, {
        toValue: 1,
        duration: pieces[i].duration,
        delay: pieces[i].delay,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      });
    });
    Animated.stagger(40, anims).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-8">
        {/* Confetti layer */}
        <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {pieces.map((piece, i) => (
            <ConfettiPiece key={i} piece={piece} progress={progresses[i]} />
          ))}
        </View>

        {/* Card */}
        <Animated.View
          style={{ transform: [{ scale: cardScale }], opacity: cardOpacity }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 items-center w-full max-w-sm"
        >
          <Text className="text-6xl mb-3">🎉</Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
            Congratulations!
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
            You unlocked
          </Text>
          <Text className="text-lg font-bold text-primary text-center mb-4">{jobTitle}</Text>

          <View className="flex-row items-center gap-2 mb-2">
            <View className="bg-amber-100 dark:bg-amber-900/30 rounded-xl px-3 py-2 flex-row items-center gap-1">
              <Text className="text-base">⚡</Text>
              <Text className="font-bold text-amber-600 dark:text-amber-400">+{xpAwarded} XP</Text>
            </View>
            <View className="bg-primary-100 dark:bg-primary-900/30 rounded-xl px-3 py-2 flex-row items-center gap-1">
              <Text className="text-base">🏅</Text>
              <Text className="font-bold text-primary">Job Ready</Text>
            </View>
          </View>

          <Button label="Awesome! 🚀" onPress={onClose} fullWidth size="lg" className="mt-4" />
        </Animated.View>
      </View>
    </Modal>
  );
}
