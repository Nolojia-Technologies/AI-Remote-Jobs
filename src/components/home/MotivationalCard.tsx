import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const QUOTES = [
  { text: "Every expert was once a beginner. Start today.", author: "AI Remote Jobs" },
  { text: "Your skills are your passport to the world.", author: "AI Remote Jobs" },
  { text: "Consistency beats talent every single time.", author: "AI Remote Jobs" },
  { text: "The best time to learn AI was yesterday. The second best time is now.", author: "AI Remote Jobs" },
  { text: "You are one skill away from changing your life.", author: "AI Remote Jobs" },
  { text: "Remote work is not the future — it's the present.", author: "AI Remote Jobs" },
  { text: "Your phone is a portal to global opportunities.", author: "AI Remote Jobs" },
  { text: "Africa's AI talent is the world's next superpower.", author: "AI Remote Jobs" },
  { text: "Small daily progress beats a perfect plan tomorrow.", author: "AI Remote Jobs" },
  { text: "Learn. Earn. Grow. Repeat.", author: "AI Remote Jobs" },
];

const GRADIENTS: [string, string][] = [
  ["#2563EB", "#0EA5E9"],
  ["#8B5CF6", "#EC4899"],
  ["#22C55E", "#14B8A6"],
  ["#F59E0B", "#EF4444"],
  ["#0EA5E9", "#22C55E"],
];

export function MotivationalCard() {
  const dayIndex = new Date().getDay();
  const quote = QUOTES[dayIndex % QUOTES.length];
  const gradient = GRADIENTS[dayIndex % GRADIENTS.length];

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-2xl p-5"
    >
      <Text className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wider">
        Daily Motivation
      </Text>
      <Text className="text-white text-lg font-bold leading-7 mb-3">
        "{quote.text}"
      </Text>
      <Text className="text-white/60 text-xs">— {quote.author}</Text>
    </LinearGradient>
  );
}
