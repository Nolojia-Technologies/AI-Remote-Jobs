import React from "react";
import { View, Text } from "react-native";
import { RevisionEngine } from "../../revision/revisionEngine";

export function MemoryBar({
  strength,
  label,
  showValue = true,
  height = 8,
}: {
  strength: number;
  label?: string;
  showValue?: boolean;
  height?: number;
}) {
  const color = RevisionEngine.memoryColor(strength);
  const level = RevisionEngine.memoryLevel(strength);

  return (
    <View>
      {(label || showValue) && (
        <View className="flex-row items-center justify-between mb-1">
          {label && <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>}
          {showValue && (
            <Text className="text-xs font-bold capitalize" style={{ color }}>
              {strength}% · {level}
            </Text>
          )}
        </View>
      )}
      <View className="rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700" style={{ height }}>
        <View className="h-full rounded-full" style={{ width: `${strength}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}
