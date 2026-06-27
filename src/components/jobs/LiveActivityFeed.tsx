import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { buildActivityFeed, ActivityItem } from "../../lib/socialProof";

export function LiveActivityFeed({ count = 6 }: { count?: number }) {
  const [items, setItems] = useState<ActivityItem[]>(() => buildActivityFeed(count));
  const dot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => setItems(buildActivityFeed(count)), 25000);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dot, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => {
      clearInterval(interval);
      loop.stop();
    };
  }, []);

  return (
    <View>
      <View className="flex-row items-center gap-2 px-5 mb-3">
        <Animated.View style={{ opacity: dot }} className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Live Activity</Text>
      </View>

      <View className="px-5 gap-2">
        {items.map((item) => (
          <View
            key={item.id}
            className="flex-row items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700"
          >
            <View className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center">
              <Text className="text-base">{item.emoji}</Text>
            </View>
            <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300" numberOfLines={2}>
              {item.text}
            </Text>
            <Text className="text-xs text-gray-400">{item.time}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
