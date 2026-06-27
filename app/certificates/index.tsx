import React, { useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Award } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useGamificationStore } from "../../src/stores/gamificationStore";
import { CertificateCard } from "../../src/components/profile/CertificateCard";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { EmptyState } from "../../src/components/ui/EmptyState";

export default function CertificatesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { certificates, fetchCertificates } = useGamificationStore();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (user) {
      fetchCertificates(user.id).then(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading certificates..." />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-950 px-5 pt-4 pb-4 flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
        >
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Certificates 🎓
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {certificates.length} earned
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {certificates.length === 0 ? (
          <EmptyState
            emoji="🎓"
            title="No Certificates Yet"
            description="Complete a full career path curriculum to earn your official AI Remote Jobs certificate."
            actionLabel="Start Learning"
            onAction={() => router.push("/(tabs)/learn")}
          />
        ) : (
          <>
            <View className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 mb-5">
              <View className="flex-row items-center gap-2 mb-1">
                <Award size={18} color="#2563EB" />
                <Text className="text-sm font-bold text-primary">
                  Official Certificates
                </Text>
              </View>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Each certificate is blockchain-verifiable with a unique ID. Share them on LinkedIn and with employers.
              </Text>
            </View>
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
