import { ExpoConfig, ConfigContext } from "expo/config";

// AI Remote Jobs — real AdMob App ID (Android). iOS has no app yet, so it keeps
// Google's sample App ID so the SDK never crashes on a missing/invalid id.
const ANDROID_APP_ID = "ca-app-pub-4958259042282217~4182404694";
const TEST_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";

// Only accept a REAL App ID (digits, not the "xxxx" placeholders in .env).
function realAppId(id: string | undefined, fallback: string): string {
  return id && /^ca-app-pub-\d{10,}~\d{5,}$/.test(id) ? id : fallback;
}

const ANDROID_ADMOB_APP_ID = realAppId(process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID, ANDROID_APP_ID);
const IOS_ADMOB_APP_ID = realAppId(process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID, TEST_IOS_APP_ID);

// Reversed iOS Google OAuth client ID → the URL scheme the Google Sign-In
// plugin needs for iOS. Derived from the env client ID; a harmless placeholder
// is used when none is set (Android builds don't rely on it).
const IOS_GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;
const GOOGLE_IOS_URL_SCHEME = IOS_GOOGLE_CLIENT_ID
  ? `com.googleusercontent.apps.${IOS_GOOGLE_CLIENT_ID.replace(".apps.googleusercontent.com", "")}`
  : "com.googleusercontent.apps.placeholder";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "AI Remote Jobs",
  slug: "ai-home-jobs",
  owner: "shaun-2",
  version: "1.0.9",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "aihustleacademy",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0B2E78",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.aihustleacademy.app",
    infoPlist: {
      NSCameraUsageDescription: "Used for profile photo",
      NSPhotoLibraryUsageDescription: "Used for profile photo",
    },
  },
  android: {
    versionCode: 19,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#2563EB",
    },
    package: "com.aihustleacademy.app",
    permissions: [
      "POST_NOTIFICATIONS",
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#2563EB",
        sounds: [],
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0B2E78",
        image: "./assets/images/splash.png",
        imageWidth: 200,
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        // A VALID App ID is mandatory — an invalid one crashes the app on launch.
        // Real IDs slot in via env (validated); otherwise Google's sample App ID.
        androidAppId: ANDROID_ADMOB_APP_ID,
        iosAppId: IOS_ADMOB_APP_ID,
      },
    ],
    [
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: GOOGLE_IOS_URL_SCHEME },
    ],
    // Meta Audience Network mediation adapter — only added when opted in via
    // EXPO_PUBLIC_ENABLE_META_MEDIATION=true (keeps default builds untouched).
    ...(process.env.EXPO_PUBLIC_ENABLE_META_MEDIATION === "true"
      ? [["./plugins/withMetaMediation", { adapterVersion: process.env.EXPO_PUBLIC_META_ADAPTER_VERSION ?? "6.20.0.0" }] as [string, any]]
      : []),
    // Facebook (Meta) App Events + ads attribution — only added when BOTH the
    // App ID and Client Token are configured (keeps default builds untouched).
    // Writes the SDK metadata into AndroidManifest; runtime init lives in
    // src/lib/facebook.ts. No Login UI (no `scheme` override needed for events).
    ...(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID && process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN
      ? [[
          "react-native-fbsdk-next",
          {
            appID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
            clientToken: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN,
            displayName: "AI Remote Jobs",
            isAutoInitEnabled: true,
            autoLogAppEventsEnabled: true,
            advertiserIDCollectionEnabled: true,
          },
        ] as [string, any]]
      : []),
    // @sentry/react-native add back for `eas build` with proper DSN configured
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    googleClientIdAndroid: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    googleClientIdIos: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    googleClientIdWeb: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    eas: {
      projectId: process.env.EXPO_EAS_PROJECT_ID ?? "af2eb44f-5540-4eab-af70-05e45a8880a1",
    },
  },
});
