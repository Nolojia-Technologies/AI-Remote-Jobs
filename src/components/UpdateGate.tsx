import React, { useEffect, useRef, useState } from "react";
import { AppState, Linking, Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Updates from "expo-updates";
import { RefreshCw, Rocket } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { logEvent } from "../lib/analytics";

const PROMPT_KEY = "@aha/update-prompt-day";

interface VersionGate {
  latest_version_code: number;
  min_supported_version_code: number;
  message: string;
  store_url: string;
}

/** True native versionCode of the INSTALLED build (not the OTA bundle). */
function installedVersionCode(): number {
  const raw = Platform.OS === "android" ? Application.nativeBuildVersion : null;
  return Number(raw) || 0;
}

/**
 * Release delivery, mounted once at the root:
 *  1. OTA (expo-updates): on launch + each foreground, silently download the
 *     newest JS bundle; when one is ready, offer a one-tap restart.
 *  2. Store gate (app_settings.version_gate): if the installed BUILD is older
 *     than latest_version_code → daily dismissible "Update available" modal;
 *     older than min_supported_version_code → blocking, must update.
 */
export function UpdateGate() {
  const [gate, setGate] = useState<VersionGate | null>(null);
  const [showSoft, setShowSoft] = useState(false);
  const [otaReady, setOtaReady] = useState(false);
  const checking = useRef(false);

  const installed = installedVersionCode();
  const forced = !!gate && installed > 0 && installed < gate.min_supported_version_code;
  const outdated = !!gate && installed > 0 && installed < gate.latest_version_code;

  const checkOta = async () => {
    if (!Updates.isEnabled || __DEV__ || checking.current) return;
    checking.current = true;
    try {
      const res = await Updates.checkForUpdateAsync();
      if (res.isAvailable) {
        await Updates.fetchUpdateAsync();
        setOtaReady(true);
      }
    } catch {
      // network/dev — try again next foreground
    } finally {
      checking.current = false;
    }
  };

  const checkGate = async () => {
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "version_gate")
        .maybeSingle();
      const v = (data as any)?.value as VersionGate | undefined;
      if (!v) return;
      setGate(v);
      const code = installedVersionCode();
      if (code > 0 && code < v.latest_version_code && code >= v.min_supported_version_code) {
        // Soft prompt at most once per day.
        const today = new Date().toISOString().split("T")[0];
        const last = await AsyncStorage.getItem(PROMPT_KEY);
        if (last !== today) {
          setShowSoft(true);
          AsyncStorage.setItem(PROMPT_KEY, today).catch(() => {});
          logEvent("update_prompt_shown", { installed: code, latest: v.latest_version_code });
        }
      }
    } catch {
      // offline — retry next foreground
    }
  };

  useEffect(() => {
    checkGate();
    checkOta();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        checkGate();
        checkOta();
      }
    });
    return () => sub.remove();
  }, []);

  const openStore = () => {
    logEvent("update_prompt_store", {});
    Linking.openURL(gate?.store_url ?? "market://details?id=com.aihustleacademy.app").catch(() => {});
  };

  // ─── Blocking: build below the supported minimum ───────────
  if (forced && gate) {
    return (
      <Modal visible transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center p-8">
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-6 items-center w-full">
            <Text className="text-4xl mb-2">🚀</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
              Update required
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              This version is no longer supported. Please update to keep earning — your
              balance and progress are safe.
            </Text>
            <TouchableOpacity
              onPress={openStore}
              className="bg-primary-600 rounded-2xl py-4 px-6 w-full items-center mt-5"
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-base">Update on Google Play</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      {/* Soft update prompt — dismissible, once per day */}
      <Modal
        visible={showSoft && outdated && !forced}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSoft(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-8">
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-6 items-center w-full">
            <View className="w-14 h-14 rounded-2xl bg-primary-600 items-center justify-center mb-3">
              <Rocket size={26} color="#fff" />
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
              Update available
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              {gate?.message ?? "A new version is available."}
            </Text>
            <TouchableOpacity
              onPress={openStore}
              className="bg-primary-600 rounded-2xl py-4 px-6 w-full items-center mt-5"
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-base">Update now</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSoft(false)} className="mt-3 py-1.5">
              <Text className="text-gray-500 dark:text-gray-400 font-semibold">Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OTA update downloaded — centered restart card over a blurred app */}
      <Modal
        visible={otaReady}
        transparent
        animationType="fade"
        onRequestClose={() => setOtaReady(false)}
      >
        <BlurView
          intensity={45}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={{ flex: 1 }}
        >
          {/* Dark scrim doubles as fallback where the blur isn't supported */}
          <View className="flex-1 bg-black/45 items-center justify-center p-8">
            <View className="bg-white dark:bg-gray-900 rounded-3xl p-6 items-center w-full">
              <View className="w-14 h-14 rounded-2xl bg-primary-600 items-center justify-center mb-3">
                <RefreshCw size={26} color="#fff" />
              </View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
                Update ready
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                We've downloaded the latest improvements for you. Restart the app now to
                apply them — it only takes a second.
              </Text>
              <TouchableOpacity
                onPress={() => Updates.reloadAsync().catch(() => setOtaReady(false))}
                className="bg-primary-600 rounded-2xl py-4 px-6 w-full items-center mt-5"
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold text-base">Restart Now</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOtaReady(false)} className="mt-3 py-1.5">
                <Text className="text-gray-500 dark:text-gray-400 font-semibold">Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}
