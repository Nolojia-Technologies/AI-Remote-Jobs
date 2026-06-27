import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, CheckCircle2, XCircle, RotateCw } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useRevisionStore } from "../../src/stores/revisionStore";
import { useRewardedBonusXp } from "../../src/hooks/useAds";
import { RevisionEngine } from "../../src/revision/revisionEngine";
import { REVISION_SESSION } from "../../src/revision/config";
import { buildRevisionSession } from "../../src/revision/revisionItems";
import { RevisionItem, RevisionSessionResult } from "../../src/revision/types";
import { Button } from "../../src/components/ui/Button";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { RevisionRewardModal } from "../../src/components/revision/RevisionRewardModal";

export default function RevisionSessionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const revision = useRevisionStore();
  const grantBonusXp = useRewardedBonusXp();

  const items = useMemo<RevisionItem[]>(() => {
    const due = RevisionEngine.getDue(revision.reviews, Date.now()).slice(0, REVISION_SESSION.maxItems);
    return buildRevisionSession(due);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false); // answered / flashcard flipped
  const [flipped, setFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [strengthened, setStrengthened] = useState<string[]>([]);
  const [result, setResult] = useState<RevisionSessionResult | null>(null);

  useEffect(() => {
    if (items.length === 0) router.back();
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[index];
  const isLast = index === items.length - 1;

  const grade = (correct: boolean) => {
    revision.recordReviewResult(item.lessonId, correct);
    if (correct) {
      setCorrectCount((c) => c + 1);
      setStrengthened((t) => [...t, item.topic]);
    }
    setRevealed(true);
  };

  const onSelectMC = (opt: string) => {
    if (revealed) return;
    setSelected(opt);
    grade(opt === item.answer);
  };

  const onTF = (val: boolean) => {
    if (revealed) return;
    setSelected(val ? "True" : "False");
    grade(val === item.statementIsTrue);
  };

  const next = () => {
    if (isLast) {
      const r = revision.completeSession(correctCount, items.length, strengthened);
      setResult(r);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    setFlipped(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-3 mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="flex-1 text-base font-bold text-gray-900 dark:text-white">
            Revision · {index + 1}/{items.length}
          </Text>
          <Text className="text-xs font-bold text-primary">{item.topic}</Text>
        </View>
        <ProgressBar progress={((index + (revealed ? 1 : 0)) / items.length) * 100} height={6} color="#7C3AED" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Prompt */}
        <View className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 mb-5">
          <Text className="text-xs font-bold text-primary uppercase mb-1">
            {item.type === "flashcard" ? "Flashcard" : item.type === "true_false" ? "True or False" : "Quick Quiz"}
          </Text>
          <Text className="text-lg font-bold text-gray-900 dark:text-white leading-7">
            {item.type === "true_false" ? item.statement : item.prompt}
          </Text>
        </View>

        {/* Multiple choice */}
        {item.type === "multiple_choice" &&
          item.options?.map((opt) => {
            const isAnswer = opt === item.answer;
            const isSelected = selected === opt;
            let cls = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
            if (revealed && isAnswer) cls = "bg-green-50 dark:bg-green-900/20 border-green-500";
            else if (revealed && isSelected) cls = "bg-red-50 dark:bg-red-900/20 border-red-500";
            else if (isSelected) cls = "bg-primary-50 dark:bg-primary-900/20 border-primary";
            return (
              <TouchableOpacity
                key={opt}
                disabled={revealed}
                onPress={() => onSelectMC(opt)}
                className={`flex-row items-center p-4 rounded-2xl border-2 mb-2 ${cls}`}
              >
                <Text className="flex-1 text-base text-gray-800 dark:text-gray-200">{opt}</Text>
                {revealed && isAnswer && <CheckCircle2 size={18} color="#22C55E" />}
                {revealed && isSelected && !isAnswer && <XCircle size={18} color="#EF4444" />}
              </TouchableOpacity>
            );
          })}

        {/* True / False */}
        {item.type === "true_false" && (
          <View className="flex-row gap-3">
            {[true, false].map((val) => {
              const label = val ? "True" : "False";
              const isSelected = selected === label;
              const isAnswer = val === item.statementIsTrue;
              let cls = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
              if (revealed && isAnswer) cls = "bg-green-50 dark:bg-green-900/20 border-green-500";
              else if (revealed && isSelected) cls = "bg-red-50 dark:bg-red-900/20 border-red-500";
              return (
                <TouchableOpacity
                  key={label}
                  disabled={revealed}
                  onPress={() => onTF(val)}
                  className={`flex-1 items-center p-5 rounded-2xl border-2 ${cls}`}
                >
                  <Text className="text-base font-bold text-gray-800 dark:text-gray-200">{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Flashcard */}
        {item.type === "flashcard" && (
          <View>
            {!flipped ? (
              <Button
                label="Show Answer"
                onPress={() => setFlipped(true)}
                variant="outline"
                fullWidth
                size="lg"
                icon={<RotateCw size={16} color="#2563EB" />}
              />
            ) : (
              <>
                <View className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 mb-4">
                  <Text className="text-xs font-bold text-green-600 uppercase mb-1">Answer</Text>
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">{item.back}</Text>
                </View>
                {!revealed && (
                  <View className="flex-row gap-3">
                    <Button label="❌ Missed" onPress={() => grade(false)} variant="outline" fullWidth />
                    <Button label="✅ Got it" onPress={() => grade(true)} variant="accent" fullWidth />
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {revealed && (
        <View className="px-5 pb-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button label={isLast ? "Finish Revision 🎉" : "Next →"} onPress={next} fullWidth size="lg" />
        </View>
      )}

      {/* Reward */}
      <RevisionRewardModal
        visible={!!result}
        result={result}
        revisionStreak={revision.revisionStreak}
        onBonusAd={async () => (user ? grantBonusXp(user.id) : -1)}
        onContinue={() => {
          setResult(null);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
