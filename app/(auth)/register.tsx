import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, User, Mail, Lock } from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { GoogleAuthButton } from "../../src/components/auth/GoogleAuthButton";
import { useAuthStore } from "../../src/stores/authStore";
import { logEvent, AnalyticsEvents } from "../../src/lib/analytics";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { signUpWithEmail } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const { error, needsConfirmation } = await signUpWithEmail(
      data.email,
      data.password,
      data.fullName
    );
    if (error) {
      Alert.alert("Registration Failed", error);
      return;
    }

    logEvent(AnalyticsEvents.SIGN_UP, { method: "email" });

    if (needsConfirmation) {
      // Email confirmation is enabled — user must verify before logging in.
      Alert.alert(
        "Check Your Email",
        "We sent a verification link to your email. Please verify, then sign in.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    }
    // Otherwise a session already exists — the AuthGuard in _layout.tsx will
    // route the new user straight into onboarding. No manual navigation needed.
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mb-6"
            >
              <ChevronLeft size={20} color="#374151" />
            </TouchableOpacity>

            <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Account 🚀
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mb-8">
              Join thousands learning AI skills for remote work
            </Text>

            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  autoCapitalize="words"
                  onChangeText={onChange}
                  value={value}
                  error={errors.fullName?.message}
                  leftIcon={<User size={18} color="#9CA3AF" />}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                  leftIcon={<Mail size={18} color="#9CA3AF" />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="Min. 8 characters"
                  isPassword
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color="#9CA3AF" />}
                  hint="Use letters, numbers, and symbols"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  isPassword
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                  leftIcon={<Lock size={18} color="#9CA3AF" />}
                />
              )}
            />

            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-6">
              <Text className="text-sm text-blue-700 dark:text-blue-300 leading-5">
                By creating an account, you agree to our Terms of Service and Privacy Policy. Your data is safe and we never spam.
              </Text>
            </View>

            <Button
              label="Create My Account"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              size="lg"
            />

            <GoogleAuthButton mode="signup" />

            <View className="flex-row justify-center mt-6 mb-8">
              <Text className="text-gray-500 dark:text-gray-400">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text className="text-primary font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
