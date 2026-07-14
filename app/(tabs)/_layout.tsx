import React from "react";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { Home, BookOpen, User, CircleDollarSign, LucideProps } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: React.ComponentType<LucideProps>;
  color: string;
  focused: boolean;
}) {
  return (
    <View
      className={`items-center justify-center rounded-2xl ${
        focused ? "bg-primary-100 dark:bg-primary-900/30 w-12 h-8" : "w-10 h-8"
      }`}
    >
      <Icon size={22} color={focused ? "#2563EB" : color} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: "transparent",
          position: "absolute",
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={95}
              tint="light"
              style={{ flex: 1 }}
            />
          ) : (
            <View className="flex-1 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800" />
          ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Courses",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={BookOpen} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "AI Tasks",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={CircleDollarSign} color={color} focused={focused} />
          ),
        }}
      />
      {/* Certification stays routable (home/learn link to it) but off the tab bar. */}
      <Tabs.Screen name="certification" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={User} color={color} focused={focused} />
          ),
        }}
      />
      </Tabs>
    </View>
  );
}
