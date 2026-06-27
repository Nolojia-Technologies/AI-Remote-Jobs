import React from "react";
import { ScrollView, TouchableOpacity, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { JOB_CATEGORIES } from "../../data/jobs";

interface JobCategoryChipsProps {
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function JobCategoryChips({ selected, onSelect }: JobCategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      <TouchableOpacity
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(null);
        }}
        className={`px-3 py-2 rounded-xl ${
          selected === null ? "bg-primary" : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        <Text
          className={`text-sm font-semibold ${
            selected === null ? "text-white" : "text-gray-600 dark:text-gray-400"
          }`}
        >
          🌟 All
        </Text>
      </TouchableOpacity>

      {JOB_CATEGORIES.map((cat) => {
        const active = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(active ? null : cat.id);
            }}
            className={`px-3 py-2 rounded-xl ${
              active ? "" : "bg-gray-100 dark:bg-gray-800"
            }`}
            style={active ? { backgroundColor: cat.color } : undefined}
          >
            <Text
              className={`text-sm font-semibold ${
                active ? "text-white" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {cat.emoji} {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
