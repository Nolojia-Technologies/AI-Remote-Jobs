import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps {
  onPress?: () => void;
  label: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  className?: string;
}

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: "bg-primary active:bg-primary-700",
    text: "text-white font-semibold",
  },
  secondary: {
    container: "bg-secondary active:bg-secondary-600",
    text: "text-white font-semibold",
  },
  outline: {
    container: "bg-transparent border-2 border-primary active:bg-primary-50",
    text: "text-primary font-semibold",
  },
  ghost: {
    container: "bg-transparent active:bg-gray-100 dark:active:bg-gray-800",
    text: "text-primary dark:text-primary-400 font-semibold",
  },
  danger: {
    container: "bg-red-500 active:bg-red-600",
    text: "text-white font-semibold",
  },
  accent: {
    container: "bg-accent active:bg-accent-600",
    text: "text-white font-semibold",
  },
};

const sizeClasses: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-3 py-2 rounded-xl", text: "text-sm" },
  md: { container: "px-5 py-3 rounded-2xl", text: "text-base" },
  lg: { container: "px-6 py-4 rounded-2xl", text: "text-lg" },
  xl: { container: "px-8 py-5 rounded-3xl", text: "text-xl" },
};

export function Button({
  onPress,
  label,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className = "",
}: ButtonProps) {
  const handlePress = async () => {
    if (disabled || loading || !onPress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const { container, text } = variantClasses[variant];
  const { container: sizeContainer, text: sizeText } = sizeClasses[size];
  const opacityClass = disabled || loading ? "opacity-50" : "";
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`${container} ${sizeContainer} ${opacityClass} ${widthClass} flex-row items-center justify-center gap-2 ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#2563EB" : "#FFFFFF"}
        />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text className={`${text} ${sizeText}`}>{label}</Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </TouchableOpacity>
  );
}
