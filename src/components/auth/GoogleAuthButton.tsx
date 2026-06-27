import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { Button } from "../ui/Button";
import { useAuthStore } from "../../stores/authStore";
import { logEvent, AnalyticsEvents } from "../../lib/analytics";

interface GoogleAuthButtonProps {
  /** Affects only the analytics label — Supabase handles new vs. returning users. */
  mode: "login" | "signup";
  /** Render the "or continue with" divider above the button (default true). */
  showDivider?: boolean;
}

/**
 * "Continue with Google" button shared by the login and register screens.
 * Drives native Google Sign-In via the auth store; on success the AuthGuard in
 * the root layout routes the user onward (no manual navigation here).
 */
export function GoogleAuthButton({ mode, showDivider = true }: GoogleAuthButtonProps) {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    const { error, cancelled } = await signInWithGoogle();
    setLoading(false);

    if (cancelled) return; // user dismissed the sheet — stay quiet
    if (error) {
      Alert.alert("Google Sign-In", error);
      return;
    }
    logEvent(mode === "signup" ? AnalyticsEvents.SIGN_UP : AnalyticsEvents.LOGIN, { method: "google" });
  };

  return (
    <>
      {showDivider && (
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <Text className="mx-4 text-gray-400 text-sm">or continue with</Text>
          <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </View>
      )}
      <Button
        label="Continue with Google"
        onPress={handlePress}
        loading={loading}
        variant="outline"
        fullWidth
        size="lg"
        icon={<Text className="text-lg">G</Text>}
      />
    </>
  );
}
