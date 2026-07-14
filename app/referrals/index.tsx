import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Share,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { NativeAdCard } from "../../src/components/ads/NativeAdCard";
import { ChevronLeft, Copy, Share2, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "../../src/stores/authStore";
import { useUserStore } from "../../src/stores/userStore";
import { useEarnStore } from "../../src/stores/earnStore";
import { formatCents } from "../../src/constants/taskEconomy";

const STORE_URL = "https://play.google.com/store/apps/details?id=com.aihustleacademy.app";

export default function ReferralCenterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const earn = useEarnStore();

  const [copied, setCopied] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [applyMsg, setApplyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user) earn.loadHub(user.id);
  }, [user]);

  // Server-generated code (migration 022). Fallback: stable slice of the user id
  // so the screen is never empty before the migration runs.
  const code =
    ((profile as any)?.referral_code as string | undefined) ??
    (user?.id ? user.id.replace(/-/g, "").slice(0, 8).toUpperCase() : "--------");
  const link = `${STORE_URL}&referrer=${code}`;

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    try {
      await Share.share({
        message: `I'm earning money doing AI tasks on AI Hustle Academy! 💰 Join with my code ${code} and we both get a bonus: ${link}`,
      });
    } catch {}
  };

  const applyCode = async () => {
    if (!codeInput.trim() || applying) return;
    setApplying(true);
    const res = await earn.applyReferralCode(codeInput);
    setApplying(false);
    setApplyMsg({
      ok: res.ok,
      text: res.ok ? "Code applied! Complete 5 tasks to unlock your bonus. 🎉" : res.error ?? "Invalid code",
    });
  };

  const { referrals } = earn.summary;
  const stats = [
    { label: "Friends invited", value: String(referrals.total) },
    { label: "Successful", value: String(referrals.qualified) },
    { label: "Pending", value: String(referrals.pending) },
    { label: "Referral earnings", value: formatCents(earn.summary.wallet.referralCents) },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
          >
            <ChevronLeft size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            🎁 Referral Center
          </Text>
        </View>

        {/* Hero */}
        <View className="mx-5 mt-3 bg-emerald-600 rounded-3xl p-6 items-center">
          <Text className="text-white text-lg font-bold text-center">
            Invite friends, earn {formatCents(200)} each
          </Text>
          <Text className="text-emerald-100 text-xs text-center mt-1 px-4">
            You earn when your friend joins, completes 5 AI tasks and stays active for 3
            days. They get a {formatCents(50)} welcome bonus too.
          </Text>

          {/* Code */}
          <View className="bg-white/15 rounded-2xl px-8 py-3 mt-4">
            <Text className="text-white text-3xl font-bold tracking-[6px]">{code}</Text>
          </View>

          {/* QR */}
          <View className="bg-white p-3 rounded-2xl mt-4">
            <QRCode value={link} size={120} />
          </View>

          <View className="flex-row gap-3 mt-5 w-full">
            <TouchableOpacity
              onPress={copy}
              className="flex-1 bg-white/20 rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
              activeOpacity={0.85}
            >
              {copied ? <Check size={16} color="#fff" /> : <Copy size={16} color="#fff" />}
              <Text className="text-white font-bold">{copied ? "Copied!" : "Copy Code"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={share}
              className="flex-1 bg-white rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
              activeOpacity={0.85}
            >
              <Share2 size={16} color="#059669" />
              <Text className="text-emerald-700 font-bold">Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="mx-5 mt-4 flex-row flex-wrap gap-3">
          {stats.map((s) => (
            <View
              key={s.label}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4"
              style={{ width: "47.5%" }}
            >
              <Text className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* How it works */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white px-5 mt-6 mb-3">
          How it works
        </Text>
        <View className="mx-5 bg-white dark:bg-gray-800 rounded-3xl p-4 gap-3">
          {[
            ["1️⃣", "Share your code or link with friends"],
            ["2️⃣", "They install the app and enter your code"],
            ["3️⃣", "They complete 5 AI tasks and stay active 3 days"],
            ["4️⃣", `You earn ${formatCents(200)} — paid straight to your wallet`],
          ].map(([emoji, text]) => (
            <View key={text} className="flex-row items-center gap-3">
              <Text className="text-lg">{emoji}</Text>
              <Text className="flex-1 text-sm text-gray-700 dark:text-gray-200">{text}</Text>
            </View>
          ))}
          <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Rewards are verified automatically to keep the program fair. Self-referrals and
            duplicate accounts don't qualify.
          </Text>
        </View>

        {/* Enter a friend's code */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white px-5 mt-6 mb-3">
          Got a friend's code?
        </Text>
        <View className="mx-5 bg-white dark:bg-gray-800 rounded-3xl p-4">
          <View className="flex-row gap-2">
            <TextInput
              value={codeInput}
              onChangeText={(t) => {
                setCodeInput(t.toUpperCase());
                setApplyMsg(null);
              }}
              placeholder="ENTER CODE"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-3 font-bold tracking-widest text-gray-900 dark:text-white"
            />
            <TouchableOpacity
              onPress={applyCode}
              disabled={applying || codeInput.trim().length < 4}
              className={`rounded-2xl px-5 items-center justify-center ${
                codeInput.trim().length < 4 ? "bg-gray-300 dark:bg-gray-700" : "bg-primary-600"
              }`}
            >
              <Text className="text-white font-bold">{applying ? "..." : "Apply"}</Text>
            </TouchableOpacity>
          </View>
          {applyMsg && (
            <Text
              className={`text-xs font-semibold mt-2 ${
                applyMsg.ok ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {applyMsg.text}
            </Text>
          )}
        </View>

        {/* Native ad — bottom of referral center */}
        <View className="mx-5 mt-4">
          <NativeAdCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
