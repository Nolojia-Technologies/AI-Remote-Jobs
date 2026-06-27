import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Sun, Moon, SmartphoneNfc, Check, ShieldCheck, ChevronRight } from "lucide-react-native";
import { useTheme } from "../../src/theme";
import type { ThemeMode } from "../../src/theme";

type Option = {
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof Sun;
};

const OPTIONS: Option[] = [
  { value: "light", label: "Light", description: "Always use the light theme", icon: Sun },
  { value: "dark", label: "Dark", description: "Always use the dark theme", icon: Moon },
  { value: "system", label: "System Default", description: "Match your device appearance", icon: SmartphoneNfc },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header */}
      <View
        style={{ borderBottomColor: colors.border }}
        className="px-4 py-3 flex-row items-center gap-3 border-b"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ backgroundColor: colors.surface }}
          className="w-10 h-10 items-center justify-center rounded-xl"
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary }} className="text-base font-bold">
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* ── Appearance ─────────────────────────────────────────────── */}
        <Text
          style={{ color: colors.textSecondary }}
          className="text-xs font-bold uppercase tracking-wide mb-2"
        >
          Appearance
        </Text>

        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="rounded-2xl border overflow-hidden"
        >
          <Text style={{ color: colors.textSecondary }} className="px-4 pt-4 pb-1 text-xs">
            Theme
          </Text>

          {OPTIONS.map((opt, i) => {
            const selected = mode === opt.value;
            const Icon = opt.icon;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setMode(opt.value)}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${opt.label}. ${opt.description}`}
                style={{ borderTopColor: colors.border, borderTopWidth: i === 0 ? 0 : 1 }}
                className="flex-row items-center px-4 py-4"
              >
                <View
                  style={{ backgroundColor: selected ? colors.primary + "1A" : colors.surface }}
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                >
                  <Icon size={18} color={selected ? colors.primary : colors.textSecondary} />
                </View>

                <View className="flex-1">
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                    {opt.label}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs mt-0.5">
                    {opt.description}
                  </Text>
                </View>

                {/* Radio */}
                <View
                  style={{
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : "transparent",
                  }}
                  className="w-6 h-6 rounded-full border-2 items-center justify-center"
                >
                  {selected && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ color: colors.textSecondary }} className="text-xs mt-3 px-1">
          Your choice is saved and applied across the whole app.
        </Text>

        {/* ── Legal ──────────────────────────────────────────────────── */}
        <Text
          style={{ color: colors.textSecondary }}
          className="text-xs font-bold uppercase tracking-wide mb-2 mt-7"
        >
          Legal
        </Text>

        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="rounded-2xl border overflow-hidden"
        >
          <TouchableOpacity
            onPress={() => router.push("/privacy" as any)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
            className="flex-row items-center px-4 py-4"
          >
            <View
              style={{ backgroundColor: colors.primary + "1A" }}
              className="w-9 h-9 rounded-xl items-center justify-center mr-3"
            >
              <ShieldCheck size={18} color={colors.primary} />
            </View>
            <Text style={{ color: colors.textPrimary }} className="flex-1 text-sm font-semibold">
              Privacy Policy
            </Text>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
