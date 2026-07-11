import React from "react";
import { ScrollView, View, Text, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ExternalLink, Mail } from "lucide-react-native";
import { useTheme } from "../../src/theme";
import {
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  PRIVACY_CONTACT,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_LAST_UPDATED,
  PRIVACY_POLICY_URL,
  type PolicyBlock,
} from "../../src/constants/privacyPolicy";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const Block = ({ block }: { block: PolicyBlock }) => {
    if (block.t === "sub") {
      return (
        <Text style={{ color: colors.textPrimary }} className="text-[15px] font-bold mt-3 mb-1">
          {block.text}
        </Text>
      );
    }
    if (block.t === "ul") {
      return (
        <View className="mb-1 mt-0.5">
          {block.items.map((item, i) => (
            <View key={i} className="flex-row pr-2 mb-1">
              <Text style={{ color: colors.primary }} className="text-[15px] leading-6 mr-2">
                {"•"}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="flex-1 text-[15px] leading-6">
                {item}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return (
      <Text style={{ color: colors.textSecondary }} className="text-[15px] leading-6 mb-2">
        {block.text}
      </Text>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header */}
      <View style={{ borderBottomColor: colors.border }} className="px-4 py-3 flex-row items-center gap-3 border-b">
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
          Privacy Policy
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={{ color: colors.textPrimary }} className="text-2xl font-extrabold mb-1">
          Privacy Policy
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mb-1">
          AI Remote Jobs
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-xs mb-5">
          Effective {PRIVACY_EFFECTIVE_DATE} · Last updated {PRIVACY_LAST_UPDATED}
        </Text>

        {/* Intro */}
        {PRIVACY_INTRO.map((p, i) => (
          <Text key={i} style={{ color: colors.textSecondary }} className="text-[15px] leading-6 mb-2">
            {p}
          </Text>
        ))}

        {/* Sections */}
        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.heading} className="mt-5">
            <Text style={{ color: colors.textPrimary }} className="text-[17px] font-bold mb-2">
              {section.heading}
            </Text>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </View>
        ))}

        {/* Contact card */}
        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="rounded-2xl border p-4 mt-4"
        >
          <Text style={{ color: colors.textPrimary }} className="text-sm font-bold mb-3">
            {PRIVACY_CONTACT.org}
          </Text>
          <ContactRow icon={Mail} label={PRIVACY_CONTACT.email} onPress={() => Linking.openURL(`mailto:${PRIVACY_CONTACT.email}`)} colors={colors} />
        </View>

        {/* View online */}
        <TouchableOpacity
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          activeOpacity={0.75}
          className="flex-row items-center justify-center gap-2 mt-5 py-3"
        >
          <ExternalLink size={16} color={colors.primary} />
          <Text style={{ color: colors.primary }} className="text-sm font-semibold">
            View online
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({
  icon: Icon,
  label,
  onPress,
  colors,
}: {
  icon: typeof Mail;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center py-1.5">
      <Icon size={16} color={colors.primary} />
      <Text style={{ color: colors.textSecondary }} className="ml-2.5 text-sm">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
