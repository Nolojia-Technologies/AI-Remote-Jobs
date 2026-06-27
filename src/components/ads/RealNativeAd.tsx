import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";
import { NativeAdManager } from "../../ads/NativeAdManager";
import { MediationManager } from "../../ads/MediationManager";

/**
 * Real native ad — only required (and only renders) in production once a Native
 * ad unit id is configured. Loads its own ad, renders a medium card that blends
 * with content, and destroys the ad on unmount. Renders null until an ad loads.
 */
export function RealNativeAd() {
  const [ad, setAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    let mounted = true;
    let current: NativeAd | null = null;
    NativeAdManager.createAd().then((a: NativeAd | null) => {
      if (!a) return;
      if (mounted) {
        current = a;
        setAd(a);
        MediationManager.recordFill("native");
        MediationManager.recordImpression("native", MediationManager.adapterClassOf(a));
      } else {
        a.destroy();
      }
    });
    return () => {
      mounted = false;
      current?.destroy();
    };
  }, []);

  if (!ad) return null;

  return (
    <NativeAdView nativeAd={ad} style={styles.card}>
      <View style={styles.row}>
        {ad.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{ uri: ad.icon.url }} style={styles.icon} />
          </NativeAsset>
        ) : null}
        <View style={styles.headerText}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.headline} numberOfLines={1}>
              {ad.headline}
            </Text>
          </NativeAsset>
          <Text style={styles.sponsored}>Sponsored</Text>
        </View>
      </View>

      {ad.body ? (
        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text style={styles.body} numberOfLines={2}>
            {ad.body}
          </Text>
        </NativeAsset>
      ) : null}

      <NativeMediaView style={styles.media} resizeMode="cover" />

      {ad.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{ad.callToAction}</Text>
          </View>
        </NativeAsset>
      ) : null}
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  icon: { width: 40, height: 40, borderRadius: 8, marginRight: 10 },
  headerText: { flex: 1 },
  headline: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sponsored: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  body: { fontSize: 13, color: "#4B5563", marginBottom: 10 },
  media: { width: "100%", height: 140, borderRadius: 10, marginBottom: 10 },
  cta: { backgroundColor: "#2563EB", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
