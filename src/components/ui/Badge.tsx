import React from "react";
import { View, Text } from "react-native";

type BadgeVariant = "primary" | "secondary" | "accent" | "warning" | "error" | "success" | "gray";
type BadgeSize = "xs" | "sm" | "md";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, { container: string; text: string }> = {
  primary: { container: "bg-primary-100 dark:bg-primary-900/30", text: "text-primary-700 dark:text-primary-300" },
  secondary: { container: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300" },
  accent: { container: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  warning: { container: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  error: { container: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  success: { container: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  gray: { container: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
};

const sizeClasses: Record<BadgeSize, { container: string; text: string }> = {
  xs: { container: "px-2 py-0.5 rounded-lg", text: "text-xs" },
  sm: { container: "px-2.5 py-1 rounded-xl", text: "text-xs" },
  md: { container: "px-3 py-1.5 rounded-xl", text: "text-sm" },
};

export function Badge({ label, variant = "primary", size = "sm", icon, className = "" }: BadgeProps) {
  const { container, text } = variantClasses[variant];
  const { container: sizeContainer, text: sizeText } = sizeClasses[size];

  return (
    <View className={`flex-row items-center gap-1 self-start ${container} ${sizeContainer} ${className}`}>
      {icon}
      <Text className={`font-semibold ${text} ${sizeText}`}>{label}</Text>
    </View>
  );
}
