import React, { useEffect, useRef, useState } from "react";
import { Text, Animated, Easing, TextProps } from "react-native";

interface AnimatedCounterProps extends TextProps {
  value: number;
  duration?: number;
  /** format the running number (e.g. toLocaleString) */
  format?: (n: number) => string;
}

/**
 * Counts up to `value` on mount / when value changes.
 * Uses the JS-driven Animated value so we can read it via a listener.
 */
export function AnimatedCounter({
  value,
  duration = 900,
  format = (n) => n.toLocaleString(),
  ...textProps
}: AnimatedCounterProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value]);

  return <Text {...textProps}>{format(display)}</Text>;
}
