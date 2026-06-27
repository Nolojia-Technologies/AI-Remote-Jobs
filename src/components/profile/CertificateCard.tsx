import React from "react";
import { View, Text, TouchableOpacity, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Share2, Download, Award } from "lucide-react-native";
import { CertificateWithPath } from "../../types/app.types";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";

interface CertificateCardProps {
  certificate: CertificateWithPath;
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({
      message: `I just earned an AI Remote Jobs certificate in ${certificate.careerPath?.title}! 🎓\nCertificate ID: ${certificate.certificate_id}\n\nJoin AI Remote Jobs to learn AI skills for remote work.`,
    });
  };

  return (
    <LinearGradient
      colors={["#2563EB", "#0EA5E9"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-2xl p-5 mb-4"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-3">
            <Award size={20} color="rgba(255,255,255,0.8)" />
            <Text className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              AI Remote Jobs
            </Text>
          </View>
          <Text className="text-white text-sm font-medium mb-1">
            Certificate of Completion
          </Text>
          <Text className="text-white text-xl font-bold mb-3" numberOfLines={2}>
            {certificate.careerPath?.title ?? "Career Path"}
          </Text>
          <Text className="text-white/60 text-xs">
            Issued: {format(new Date(certificate.issued_at), "MMMM d, yyyy")}
          </Text>
          <Text className="text-white/60 text-xs mt-0.5">
            ID: {certificate.certificate_id}
          </Text>
        </View>
        <View className="ml-3 items-center">
          <Text className="text-5xl">🎓</Text>
        </View>
      </View>

      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          onPress={handleShare}
          className="flex-1 flex-row items-center justify-center gap-2 bg-white/20 rounded-xl py-2.5"
          activeOpacity={0.8}
        >
          <Share2 size={16} color="white" />
          <Text className="text-white font-semibold text-sm">Share</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
