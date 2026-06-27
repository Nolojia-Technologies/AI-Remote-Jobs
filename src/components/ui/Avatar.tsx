import React from "react";
import { View, Text, Image } from "react-native";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: { container: "w-8 h-8", text: "text-xs", image: 32 },
  sm: { container: "w-10 h-10", text: "text-sm", image: 40 },
  md: { container: "w-12 h-12", text: "text-base", image: 48 },
  lg: { container: "w-16 h-16", text: "text-xl", image: 64 },
  xl: { container: "w-24 h-24", text: "text-3xl", image: 96 },
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getColorFromName(name?: string): string {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-red-500",
    "bg-indigo-500",
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ uri, name, size = "md", className = "" }: AvatarProps) {
  const { container, text, image } = sizeMap[size];
  const bgColor = getColorFromName(name);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`${container} rounded-full ${className}`}
        style={{ width: image, height: image, borderRadius: image / 2 }}
      />
    );
  }

  return (
    <View
      className={`${container} ${bgColor} rounded-full items-center justify-center ${className}`}
    >
      <Text className={`${text} text-white font-bold`}>{getInitials(name)}</Text>
    </View>
  );
}
