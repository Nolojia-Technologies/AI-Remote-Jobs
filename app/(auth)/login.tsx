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
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock } from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { GoogleAuthButton } from "../../src/components/auth/GoogleAuthButton";
import { useAuthStore } from "../../src/stores/authStore";
import { logEvent, AnalyticsEvents } from "../../src/lib/analytics";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const { error } = await signInWithEmail(data.email, data.password);
    if (error) {
      Alert.alert("Login Failed", error);
    } else {
      logEvent(AnalyticsEvents.LOGIN, { method: "email" });
    }
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
          {/* Header */}
          <LinearGradient
            colors={["#2563EB", "#0EA5E9"]}
            className="px-6 pt-8 pb-10 items-center"
          >
            <Text className="text-4xl mb-2">🤖</Text>
            <Text className="text-3xl font-bold text-white mb-1">AI Remote Jobs</Text>
            <Text className="text-white/70 text-base">Learn AI Skills. Unlock Opportunities.</Text>
          </LinearGradient>

          {/* Form */}
          <View className="flex-1 px-6 pt-8">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back 👋
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mb-8">
              Sign in to continue your AI journey
            </Text>

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
                  placeholder="Enter your password"
                  isPassword
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color="#9CA3AF" />}
                />
              )}
            />

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              className="self-end mb-6 -mt-2"
            >
              <Text className="text-primary font-semibold text-sm">Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              size="lg"
            />

            <GoogleAuthButton mode="login" />

            <View className="flex-row justify-center mt-8 mb-4">
              <Text className="text-gray-500 dark:text-gray-400">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text className="text-primary font-bold">Sign Up Free</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
