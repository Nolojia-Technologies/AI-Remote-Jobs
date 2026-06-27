import React from "react";
import { View, Text } from "react-native";
import { CheckCircle2, Circle } from "lucide-react-native";
import { ProgressBar } from "../ui/ProgressBar";
import { JobEligibility } from "../../types/jobs.types";

interface RequirementChecklistProps {
  eligibility: JobEligibility;
  requiredCourses: string[];
}

export function RequirementChecklist({
  eligibility,
  requiredCourses,
}: RequirementChecklistProps) {
  return (
    <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">
          🔓 Unlock Requirements
        </Text>
        <Text className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {eligibility.completionPercent}%
        </Text>
      </View>

      <ProgressBar
        progress={eligibility.completionPercent}
        height={8}
        color={eligibility.isUnlocked ? "#22C55E" : "#F59E0B"}
        className="mb-4"
      />

      {/* Stat checks */}
      <View className="gap-2.5">
        {eligibility.checks.map((c) => (
          <View key={c.label} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1">
              {c.met ? (
                <CheckCircle2 size={18} color="#22C55E" />
              ) : (
                <Circle size={18} color="#9CA3AF" />
              )}
              <Text
                className={`text-sm ${
                  c.met
                    ? "text-gray-700 dark:text-gray-300 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {c.label}
              </Text>
            </View>
            <Text
              className={`text-sm font-semibold ${
                c.met ? "text-green-600 dark:text-green-400" : "text-gray-500"
              }`}
            >
              {c.current.toLocaleString()}/{c.target.toLocaleString()}
              {c.unit ? ` ${c.unit}` : ""}
            </Text>
          </View>
        ))}
      </View>

      {/* Required courses */}
      {requiredCourses.length > 0 && (
        <View className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            REQUIRED COURSES
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {requiredCourses.map((course) => (
              <View
                key={course}
                className="bg-white dark:bg-gray-700 rounded-lg px-2 py-1"
              >
                <Text className="text-xs text-gray-600 dark:text-gray-300">{course}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
