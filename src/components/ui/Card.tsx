import React from "react";
import { View, TouchableOpacity, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  variant?: "default" | "elevated" | "bordered" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const variantClasses = {
  default: "bg-white dark:bg-gray-800 rounded-2xl shadow-sm",
  elevated: "bg-white dark:bg-gray-800 rounded-2xl shadow-md",
  bordered: "bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700",
  flat: "bg-gray-50 dark:bg-gray-900 rounded-2xl",
};

export function Card({
  children,
  onPress,
  className = "",
  variant = "default",
  padding = "md",
}: CardProps) {
  const baseClasses = `${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.75}
        className={baseClasses}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View className={baseClasses}>{children}</View>;
}
