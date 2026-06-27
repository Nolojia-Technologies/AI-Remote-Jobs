import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from "react-native";
import { Eye, EyeOff, AlertCircle } from "lucide-react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerClassName = "",
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? "border-red-500"
    : isFocused
    ? "border-primary"
    : "border-gray-200 dark:border-gray-700";

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 ${borderColor} px-4`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          className="flex-1 py-4 text-base text-gray-900 dark:text-white"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-3 p-1"
          >
            {showPassword ? (
              <EyeOff size={20} color="#9CA3AF" />
            ) : (
              <Eye size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        ) : (
          rightIcon && <View className="ml-3">{rightIcon}</View>
        )}
      </View>

      {error && (
        <View className="flex-row items-center mt-2 gap-1">
          <AlertCircle size={14} color="#EF4444" />
          <Text className="text-sm text-red-500">{error}</Text>
        </View>
      )}

      {hint && !error && (
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</Text>
      )}
    </View>
  );
}
