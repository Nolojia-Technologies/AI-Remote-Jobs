import React, { useState } from "react";
import {
  View,
  Text,
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
import { ChevronLeft, Mail, CheckCircle } from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { useAuthStore } from "../../src/stores/authStore";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuthStore();
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const { error } = await resetPassword(data.email);
    if (error) {
      Alert.alert("Error", error);
    } else {
      setSent(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mb-8"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>

          {sent ? (
            <View className="flex-1 items-center justify-center">
              <View className="bg-green-100 dark:bg-green-900/30 rounded-full p-5 mb-6">
                <CheckCircle size={48} color="#22C55E" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                Check Your Email!
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center mb-2">
                We sent a password reset link to:
              </Text>
              <Text className="font-semibold text-primary text-center mb-8">
                {getValues("email")}
              </Text>
              <Button
                label="Back to Login"
                onPress={() => router.push("/(auth)/login")}
                variant="outline"
                fullWidth
              />
            </View>
          ) : (
            <>
              <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Reset Password 🔐
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 mb-8">
                Enter your email and we'll send you a reset link.
              </Text>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Email Address"
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                    leftIcon={<Mail size={18} color="#9CA3AF" />}
                  />
                )}
              />

              <Button
                label="Send Reset Link"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                fullWidth
                size="lg"
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
