import React from "react";
import { View, Text } from "react-native";
import { Job, JobEligibility } from "../../types/jobs.types";
import { getJobStatNotes, getCompetitionMessage } from "../../lib/socialProof";

/** Small activity/notification cards under a job (social proof). */
export function SocialStatNotes({ job }: { job: Job }) {
  const notes = getJobStatNotes(job);
  return (
    <View className="gap-2">
      {notes.map((n, i) => (
        <View
          key={i}
          className="flex-row items-center gap-2.5 bg-blue-50 dark:bg-blue-900/15 rounded-xl px-3 py-2.5"
        >
          <Text className="text-base">{n.emoji}</Text>
          <Text className="flex-1 text-sm text-blue-800 dark:text-blue-200">{n.text}</Text>
        </View>
      ))}
    </View>
  );
}

/** Competition banner shown on locked jobs to drive learning. */
export function CompetitionBanner({
  applicants,
  eligibility,
  minLevel,
  levelMet,
}: {
  applicants: number;
  eligibility: JobEligibility;
  minLevel: number;
  levelMet: boolean;
}) {
  const message = getCompetitionMessage(
    applicants,
    eligibility.coursesRemaining,
    eligibility.testsRemaining,
    levelMet,
    minLevel
  );
  return (
    <View className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex-row items-center gap-3">
      <Text className="text-2xl">🏁</Text>
      <Text className="flex-1 text-sm font-semibold text-orange-700 dark:text-orange-300 leading-5">
        {message}
      </Text>
    </View>
  );
}
