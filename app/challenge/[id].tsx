import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Clock, Zap, CheckCircle2, Send } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useChallengeStore } from "../../src/stores/challengeStore";
import { Badge } from "../../src/components/ui/Badge";
import { Button } from "../../src/components/ui/Button";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { reportAdAction } from "../../src/hooks/useAds";

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { challenges, submitChallenge } = useChallengeStore();

  const [submission, setSubmission] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const challenge = challenges.find((c) => c.id === id);

  useEffect(() => {
    if (challenge?.isCompleted && challenge.submission) {
      setSubmission(challenge.submission.submission_text);
      setSubmitted(true);
    }
  }, [challenge]);

  const showSuccessAnimation = () => {
    setShowSuccess(true);
    successScale.setValue(0);
    successOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, damping: 10, useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setShowSuccess(false));
      }, 2000);
    });
  };

  const handleSubmit = async () => {
    if (!submission.trim()) {
      Alert.alert("Empty Submission", "Please write your response before submitting.");
      return;
    }
    if (submission.trim().length < 20) {
      Alert.alert("Too Short", "Please provide a more detailed answer.");
      return;
    }
    if (!user || !challenge) return;

    Alert.alert(
      "Submit Challenge?",
      "Once submitted, you cannot change your answer. Are you ready?",
      [
        { text: "Not Yet", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setIsSubmitting(true);
            const { error } = await submitChallenge(user.id, challenge.id, submission.trim());
            setIsSubmitting(false);
            if (error) {
              Alert.alert("Error", error);
            } else {
              setSubmitted(true);
              showSuccessAnimation();
              // Reward cycle: after the celebration, a forced high-value
              // interstitial moment (engine self-gates by cooldown/caps/screen).
              setTimeout(() => reportAdAction("challenge_completed"), 2600);
            }
          },
        },
      ]
    );
  };

  if (!challenge) {
    return <LoadingSpinner fullScreen message="Loading challenge..." />;
  }

  const hoursLeft = challenge.timeRemaining
    ? Math.floor(challenge.timeRemaining / 3600000)
    : 0;

  const difficultyConfig = {
    easy: "accent" as const,
    medium: "warning" as const,
    hard: "error" as const,
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mr-3"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="flex-1 text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {challenge.title}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Badges */}
          <View className="flex-row gap-2 mb-4 flex-wrap">
            <Badge
              label={challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
              variant={difficultyConfig[challenge.difficulty]}
            />
            <Badge label={challenge.category} variant="gray" />
            {challenge.isCompleted && <Badge label="✓ Submitted" variant="accent" />}
          </View>

          {/* XP & Time */}
          <View className="flex-row gap-3 mb-5">
            <View className="flex-row items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
              <Zap size={14} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-sm font-bold text-amber-600 dark:text-amber-400">
                +{challenge.xp_reward} XP
              </Text>
            </View>
            {!challenge.isCompleted && (
              <View className="flex-row items-center gap-1.5 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                <Clock size={14} color="#EF4444" />
                <Text className="text-sm font-bold text-red-500">{hoursLeft}h left</Text>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-5">
            <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              📋 Challenge Instructions
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400 leading-6">
              {challenge.instructions}
            </Text>
          </View>

          {/* Submission Area */}
          <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
            {submitted ? "Your Submission" : "Your Response"}
          </Text>

          <View
            className={`border-2 rounded-2xl p-4 mb-4 ${
              submitted
                ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            }`}
          >
            <TextInput
              multiline
              editable={!submitted}
              value={submission}
              onChangeText={setSubmission}
              placeholder="Write your response here. Use AI tools to help you, then edit and refine it before submitting..."
              placeholderTextColor="#9CA3AF"
              className="text-base text-gray-900 dark:text-white leading-6"
              textAlignVertical="top"
              style={{ minHeight: 200 }}
            />
          </View>

          {!submitted && (
            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 mb-5">
              <Text className="text-sm text-blue-600 dark:text-blue-400 leading-5">
                💡 <Text className="font-semibold">Tip:</Text> Use ChatGPT to help draft your response, then edit and improve it before submitting.
              </Text>
            </View>
          )}

          {!submitted ? (
            <Button
              label="Submit Challenge"
              onPress={handleSubmit}
              loading={isSubmitting}
              fullWidth
              size="lg"
              icon={<Send size={16} color="white" />}
              iconPosition="right"
            />
          ) : (
            <View className="flex-row items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl py-4">
              <CheckCircle2 size={20} color="#22C55E" />
              <Text className="text-green-600 dark:text-green-400 font-bold">
                Challenge Submitted — +{challenge.xp_reward} XP Earned!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Success popup */}
        {showSuccess && (
          <View className="absolute top-1/3 left-0 right-0 items-center pointer-events-none">
            <Animated.View
              style={{
                transform: [{ scale: successScale }],
                opacity: successOpacity,
              }}
              className="bg-green-500 rounded-2xl px-6 py-4 items-center shadow-xl"
            >
              <CheckCircle2 size={32} color="white" />
              <Text className="text-white text-xl font-bold mt-1">
                +{challenge.xp_reward} XP
              </Text>
              <Text className="text-white/80 text-sm">Challenge Submitted!</Text>
            </Animated.View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
