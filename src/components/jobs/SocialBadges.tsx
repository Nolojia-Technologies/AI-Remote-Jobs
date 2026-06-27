import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { AnimatedCounter } from "./AnimatedCounter";
import { Job } from "../../types/jobs.types";
import {
  getViewersNow,
  getPopularity,
  TrendingBadgeInfo,
  Popularity,
} from "../../lib/socialProof";

// ─── Applicants count ────────────────────────────────────────
export function ApplicantsBadge({
  count,
  size = "sm",
  animate = true,
}: {
  count: number;
  size?: "sm" | "md";
  animate?: boolean;
}) {
  const textCls = size === "md" ? "text-sm" : "text-xs";
  return (
    <View className="flex-row items-center gap-1">
      <Text className={textCls}>👥</Text>
      {animate ? (
        <AnimatedCounter
          value={count}
          className={`${textCls} font-bold text-gray-700 dark:text-gray-300`}
        />
      ) : (
        <Text className={`${textCls} font-bold text-gray-700 dark:text-gray-300`}>
          {count.toLocaleString()}
        </Text>
      )}
      <Text className={`${textCls} text-gray-500 dark:text-gray-400`}>Applicants</Text>
    </View>
  );
}

// ─── Trending badge with pulse ───────────────────────────────
export function TrendingBadge({ info, size = "sm" }: { info: TrendingBadgeInfo; size?: "sm" | "md" }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!info.pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.07, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [info.pulse]);

  const pad = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";
  const txt = size === "md" ? "text-xs" : "text-[11px]";

  return (
    <Animated.View
      style={{ transform: [{ scale }], backgroundColor: info.color + "22" }}
      className={`flex-row items-center gap-1 rounded-lg ${pad} self-start`}
    >
      <Text className={txt}>{info.emoji}</Text>
      <Text className={`${txt} font-bold`} style={{ color: info.color }}>
        {info.label}
      </Text>
    </Animated.View>
  );
}

// ─── Popularity tier pill ────────────────────────────────────
export function PopularityBadge({ popularity }: { popularity: Popularity }) {
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-lg px-2 py-1 self-start"
      style={{ backgroundColor: popularity.color + "1A" }}
    >
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: popularity.color }} />
      <Text className="text-xs font-bold" style={{ color: popularity.color }}>
        {popularity.label}
      </Text>
    </View>
  );
}

// ─── People viewing now (refreshes every ~90s) ───────────────
export function ViewersNow({ job, size = "sm" }: { job: Job; size?: "sm" | "md" }) {
  const [viewers, setViewers] = useState(() => getViewersNow(job));
  const dot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => setViewers(getViewersNow(job)), 90000);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dot, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => {
      clearInterval(interval);
      loop.stop();
    };
  }, [job.id]);

  const txt = size === "md" ? "text-sm" : "text-xs";

  return (
    <View className="flex-row items-center gap-1.5">
      <Animated.View style={{ opacity: dot }} className="w-2 h-2 rounded-full bg-green-500" />
      <AnimatedCounter
        value={viewers}
        duration={500}
        className={`${txt} font-bold text-green-600 dark:text-green-400`}
      />
      <Text className={`${txt} text-gray-500 dark:text-gray-400`}>viewing now</Text>
    </View>
  );
}
