import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Share,
  Alert,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, CheckCircle2, XCircle, Share2, FileText } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useGamificationStore } from "../../src/stores/gamificationStore";
import { useJobStore } from "../../src/stores/jobStore";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { CAREER_PATHS } from "../../src/constants/careers";
import { getLevelInfo } from "../../src/constants/xp";
import { reportAdAction, useInterstitialMoment } from "../../src/hooks/useAds";

const STEPS = ["Review", "Assessment", "Resume", "Preview", "Submit"];

// Short final assessment (pass = 2/3).
const ASSESSMENT = [
  {
    q: "What is the most important habit of a successful remote AI worker?",
    options: ["Working without any tools", "Editing & verifying AI output before delivering", "Never communicating with clients", "Ignoring deadlines"],
    answer: "Editing & verifying AI output before delivering",
  },
  {
    q: "A client sends an urgent request outside your hours. Best response?",
    options: ["Ignore it", "Acknowledge promptly and set a clear timeline", "Reply rudely", "Cancel the contract"],
    answer: "Acknowledge promptly and set a clear timeline",
  },
  {
    q: "How should you use AI tools professionally?",
    options: ["Copy raw output blindly", "As an assistant to enhance your own judgement", "Never", "Only for spam"],
    answer: "As an assistant to enhance your own judgement",
  },
];

export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const { certificates, achievements, fetchCertificates, fetchAchievements } = useGamificationStore();
  const { getJobWithStatus, applyToJob } = useJobStore();
  const triggerInterstitial = useInterstitialMoment();

  // Fire an interstitial shortly after leaving the (protected) application
  // screen — honours the "after application submission" rule without
  // interrupting the form itself.
  const interstitialAfterLeaving = () =>
    setTimeout(() => triggerInterstitial("application_submitted"), 900);

  const job = getJobWithStatus(id as string);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [assessmentScored, setAssessmentScored] = useState(false);
  const [location, setLocation] = useState(profile?.country === "KE" ? "Kenya" : profile?.country === "QA" ? "Qatar" : profile?.country ?? "Remote");
  const [experience, setExperience] = useState("Completed hands-on AI training projects through AI Remote Jobs, including lessons, quizzes, and real-world challenges.");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      if (certificates.length === 0) fetchCertificates(user.id);
      if (achievements.length === 0) fetchAchievements(user.id);
    }
  }, [user]);

  if (!job || !profile) return <LoadingSpinner fullScreen message="Loading application..." />;

  const careerPath = CAREER_PATHS.find((p) => p.id === profile.career_path_id);
  const levelInfo = getLevelInfo(profile.xp);
  const earnedAchievements = achievements.filter((a) => a.isEarned);

  const correctCount = ASSESSMENT.filter((a, i) => answers[i] === a.answer).length;
  const assessmentPassed = correctCount >= 2;

  const resumeData = {
    fullName: profile.full_name ?? "AI Professional",
    location,
    careerPath: careerPath?.title ?? "AI Specialist",
    skills: careerPath?.skills ?? [],
    experience,
    achievements: earnedAchievements.map((a) => a.title),
    certificatesCount: certificates.length,
    level: profile.level,
    xp: profile.xp,
  };

  const resumeText = `${resumeData.fullName}
${resumeData.location} · ${resumeData.careerPath}

SUMMARY
${experience}

SKILLS
${resumeData.skills.join(", ")}

ACHIEVEMENTS
${resumeData.achievements.length ? resumeData.achievements.map((a) => `- ${a}`).join("\n") : "- Active learner on AI Remote Jobs"}

CREDENTIALS
- Level ${resumeData.level} (${resumeData.xp.toLocaleString()} XP)
- ${resumeData.certificatesCount} certificate(s) earned

Generated with AI Remote Jobs`;

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await applyToJob(user.id, job, job.eligibility.matchScore, resumeText);
    setSubmitting(false);
    if (error) {
      Alert.alert("Could not submit", error);
      return;
    }
    reportAdAction("application_submitted"); // counts now; interstitial fires after leaving this screen
    setShowSuccess(true);
    successScale.setValue(0);
    Animated.spring(successScale, { toValue: 1, damping: 9, useNativeDriver: true }).start();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center gap-3 mb-3">
            <TouchableOpacity
              onPress={back}
              className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
            >
              <ChevronLeft size={20} color="#374151" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                Apply · {job.title}
              </Text>
              <Text className="text-xs text-gray-500">
                Step {step + 1} of {STEPS.length}: {STEPS[step]}
              </Text>
            </View>
          </View>
          <ProgressBar progress={((step + 1) / STEPS.length) * 100} height={6} color="#2563EB" />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1 — Review */}
          {step === 0 && (
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Review the role
              </Text>
              <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</Text>
                <Text className="text-sm text-gray-500 mb-2">
                  {job.company} · {job.countryFlag} {job.country}
                </Text>
                <Text className="text-base font-bold text-green-600">
                  ${job.salaryMin.toLocaleString()}–${job.salaryMax.toLocaleString()}/mo
                </Text>
              </View>
              <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Your application checklist
              </Text>
              {[
                { label: "Required courses completed", met: true },
                { label: `Level ${profile.level} reached`, met: true },
                { label: `${profile.xp.toLocaleString()} XP earned`, met: true },
                { label: `${profile.streak_days}-day streak`, met: profile.streak_days >= 1 },
              ].map((c) => (
                <View key={c.label} className="flex-row items-center gap-2 mb-2">
                  <CheckCircle2 size={18} color="#22C55E" />
                  <Text className="text-sm text-gray-700 dark:text-gray-300">{c.label}</Text>
                </View>
              ))}
              <Button label="Start Assessment →" onPress={next} fullWidth size="lg" className="mt-4" />
            </View>
          )}

          {/* STEP 2 — Assessment */}
          {step === 1 && (
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Final Assessment
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Answer at least 2 of 3 correctly to proceed.
              </Text>
              {ASSESSMENT.map((item, qi) => (
                <View key={qi} className="mb-5">
                  <Text className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {qi + 1}. {item.q}
                  </Text>
                  {item.options.map((opt) => {
                    const selected = answers[qi] === opt;
                    const showResult = assessmentScored;
                    const isCorrect = opt === item.answer;
                    let cls = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
                    if (showResult && isCorrect) cls = "bg-green-50 dark:bg-green-900/20 border-green-500";
                    else if (showResult && selected && !isCorrect) cls = "bg-red-50 dark:bg-red-900/20 border-red-500";
                    else if (selected) cls = "bg-primary-50 dark:bg-primary-900/20 border-primary";
                    return (
                      <TouchableOpacity
                        key={opt}
                        disabled={assessmentScored}
                        onPress={() => setAnswers((a) => ({ ...a, [qi]: opt }))}
                        className={`flex-row items-center justify-between p-3 rounded-xl border-2 mb-2 ${cls}`}
                      >
                        <Text className="text-sm text-gray-700 dark:text-gray-300 flex-1">{opt}</Text>
                        {showResult && isCorrect && <CheckCircle2 size={16} color="#22C55E" />}
                        {showResult && selected && !isCorrect && <XCircle size={16} color="#EF4444" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {!assessmentScored ? (
                <Button
                  label="Submit Answers"
                  onPress={() => setAssessmentScored(true)}
                  disabled={Object.keys(answers).length < ASSESSMENT.length}
                  fullWidth
                  size="lg"
                />
              ) : assessmentPassed ? (
                <View>
                  <View className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3 mb-3 items-center">
                    <Text className="font-bold text-green-600 dark:text-green-400">
                      Passed! {correctCount}/3 correct 🎉
                    </Text>
                  </View>
                  <Button label="Continue to Resume →" onPress={next} fullWidth size="lg" />
                </View>
              ) : (
                <View>
                  <View className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-3 mb-3 items-center">
                    <Text className="font-bold text-red-500">
                      {correctCount}/3 — you need 2. Try again.
                    </Text>
                  </View>
                  <Button
                    label="Retry Assessment"
                    onPress={() => {
                      setAnswers({});
                      setAssessmentScored(false);
                    }}
                    variant="outline"
                    fullWidth
                    size="lg"
                  />
                </View>
              )}
            </View>
          )}

          {/* STEP 3 — Resume */}
          {step === 2 && (
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                AI Resume Builder
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                We pre-filled your resume from your profile. Edit anything below.
              </Text>

              <Input label="Location" value={location} onChangeText={setLocation} />
              <Input
                label="Experience Summary"
                value={experience}
                onChangeText={setExperience}
                multiline
                numberOfLines={4}
                style={{ minHeight: 90, textAlignVertical: "top" }}
              />

              {/* Live resume preview */}
              <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mt-2">
                <View className="flex-row items-center gap-2 mb-2">
                  <FileText size={16} color="#2563EB" />
                  <Text className="text-sm font-bold text-gray-900 dark:text-white">
                    Resume Preview
                  </Text>
                </View>
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {resumeData.fullName}
                </Text>
                <Text className="text-sm text-gray-500 mb-2">
                  {resumeData.location} · {resumeData.careerPath}
                </Text>
                <ResumeBlock title="Summary">
                  <Text className="text-xs text-gray-600 dark:text-gray-400 leading-5">{experience}</Text>
                </ResumeBlock>
                <ResumeBlock title="Skills">
                  <Text className="text-xs text-gray-600 dark:text-gray-400">
                    {resumeData.skills.join(" · ")}
                  </Text>
                </ResumeBlock>
                <ResumeBlock title="Credentials">
                  <Text className="text-xs text-gray-600 dark:text-gray-400">
                    Level {resumeData.level} · {resumeData.xp.toLocaleString()} XP ·{" "}
                    {resumeData.certificatesCount} certificate(s) · {resumeData.achievements.length} achievement(s)
                  </Text>
                </ResumeBlock>
              </View>

              <TouchableOpacity
                onPress={() => Share.share({ message: resumeText })}
                className="flex-row items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl py-3 mt-3"
              >
                <Share2 size={16} color="#374151" />
                <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">Share Resume</Text>
              </TouchableOpacity>

              <Button label="Continue to Preview →" onPress={next} fullWidth size="lg" className="mt-3" />
            </View>
          )}

          {/* STEP 4 — Preview */}
          {step === 3 && (
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Preview your application
              </Text>
              <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-3">
                <Text className="text-xs text-gray-500 mb-1">APPLYING FOR</Text>
                <Text className="text-base font-bold text-gray-900 dark:text-white">{job.title}</Text>
                <Text className="text-sm text-gray-500">{job.company}</Text>
              </View>
              <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-3">
                <Text className="text-xs text-gray-500 mb-1">MATCH SCORE</Text>
                <Text className="text-2xl font-bold text-green-600">{job.eligibility.matchScore}%</Text>
              </View>
              <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-3">
                <Text className="text-xs text-gray-500 mb-1">ASSESSMENT</Text>
                <Text className="text-sm font-bold text-gray-900 dark:text-white">
                  Passed ({correctCount}/3)
                </Text>
              </View>
              <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
                <Text className="text-xs text-gray-500 mb-1">RESUME</Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400" numberOfLines={3}>
                  {resumeText}
                </Text>
              </View>
              <Button label="Submit Application →" onPress={next} fullWidth size="lg" />
            </View>
          )}

          {/* STEP 5 — Submit */}
          {step === 4 && (
            <View className="items-center pt-8">
              <Text className="text-5xl mb-4">📨</Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Ready to submit?
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Your application and AI-generated resume will be sent to {job.company}.
              </Text>
              <Button
                label="Submit Now 🚀"
                onPress={submit}
                loading={submitting}
                fullWidth
                size="lg"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-8">
          <Animated.View
            style={{ transform: [{ scale: successScale }] }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 items-center w-full max-w-sm"
          >
            <Text className="text-6xl mb-3">🎉</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
              Application Submitted!
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
              You applied to {job.title} at {job.company}.
            </Text>
            <View className="bg-amber-100 dark:bg-amber-900/30 rounded-xl px-3 py-2 flex-row items-center gap-1 mb-4">
              <Text className="text-base">⚡</Text>
              <Text className="font-bold text-amber-600 dark:text-amber-400">+50 XP earned</Text>
            </View>
            <Button
              label="View My Applications"
              onPress={() => {
                setShowSuccess(false);
                router.replace("/applications");
                interstitialAfterLeaving();
              }}
              fullWidth
              size="lg"
            />
            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false);
                router.replace("/(tabs)/tasks" as any);
                interstitialAfterLeaving();
              }}
              className="mt-3"
            >
              <Text className="text-sm text-gray-500">Back to Jobs</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ResumeBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-2">
      <Text className="text-xs font-bold text-gray-400 uppercase mb-0.5">{title}</Text>
      {children}
    </View>
  );
}
