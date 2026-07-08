import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gift, Sparkles } from "lucide-react-native";
import { useAuthStore } from "../../stores/authStore";
import { useUserStore } from "../../stores/userStore";
import { useRewardedAd } from "../../hooks/useAds";

// Once-a-day opt-in rewarded: watch an ad → random bonus XP. Capped to one claim
// per day (persisted per user) so it drives daily return without inflating XP.
const REWARDS = [20, 25, 30, 40, 50];
const todayStr = () => new Date().toISOString().split("T")[0];
const key = (uid: string) => `@aha/dailySpin/${uid}`;

export function DailyXpSpin() {
  const { user } = useAuthStore();
  const { awardXP } = useUserStore();
  const showRewarded = useRewardedAd();
  const [claimedToday, setClaimedToday] = useState<boolean | null>(null); // null = loading
  const [busy, setBusy] = useState(false);
  const [justWon, setJustWon] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(key(user.id))
      .then((v) => setClaimedToday(v === todayStr()))
      .catch(() => setClaimedToday(false));
  }, [user?.id]);

  async function spin() {
    if (!user || busy) return;
    setBusy(true);
    const watched = await showRewarded("lucky_wheel");
    if (watched) {
      const amount = REWARDS[Math.floor(Math.random() * REWARDS.length)];
      await awardXP(user.id, amount, "daily_spin", "Daily XP spin");
      await AsyncStorage.setItem(key(user.id), todayStr()).catch(() => {});
      setJustWon(amount);
      setClaimedToday(true);
    }
    setBusy(false);
  }

  if (claimedToday === null) return null; // avoid a flash before we know the state

  return (
    <View className="rounded-2xl p-4 bg-purple-600">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
          <Gift size={22} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-base">Daily XP Spin</Text>
          <Text className="text-purple-100 text-xs">
            {claimedToday
              ? justWon != null
                ? `You won +${justWon} XP! Come back tomorrow.`
                : "Claimed today — come back tomorrow."
              : "Watch a short ad for a bonus XP reward."}
          </Text>
        </View>
        {claimedToday ? (
          <View className="rounded-xl bg-white/20 px-3 py-2">
            <Text className="text-white text-xs font-bold">✓ Done</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={spin}
            disabled={busy}
            activeOpacity={0.85}
            className="flex-row items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5"
          >
            <Sparkles size={15} color="#7C3AED" />
            <Text className="text-purple-700 text-xs font-bold">{busy ? "Loading…" : "Spin"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
