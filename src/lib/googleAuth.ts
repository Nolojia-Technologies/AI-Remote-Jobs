import { supabase } from "./supabase";

/**
 * Native Google Sign-In → Supabase session.
 *
 * Uses @react-native-google-signin to obtain a Google ID token, then exchanges
 * it for a Supabase session via signInWithIdToken (which creates the user on
 * first sign-in — so this powers both "Sign in" and "Sign up with Google").
 *
 * The native module only exists in dev/EAS builds (not Expo Go / web), so it's
 * loaded with a guarded require and fails gracefully with a clear message.
 *
 * Setup required outside the app (one-time):
 *  - Google Cloud: OAuth client IDs for Web, Android (package + SHA-1), iOS.
 *  - Supabase → Auth → Providers → Google: enable, add the Web client ID +
 *    secret, and list the Web/Android/iOS client IDs under "Authorized Client IDs".
 *  - .env: EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB / _ANDROID / _IOS.
 */

export interface GoogleAuthResult {
  error: string | null;
  /** True when the user dismissed the Google sheet (not a real error). */
  cancelled?: boolean;
}

let configured = false;

function loadGoogleSignin(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("@react-native-google-signin/google-signin");
  } catch {
    return null;
  }
}

export async function signInWithGoogleNative(): Promise<GoogleAuthResult> {
  const mod = loadGoogleSignin();
  if (!mod?.GoogleSignin) {
    return {
      error:
        "Google Sign-In isn't available in this build. Use a development or production build (not Expo Go).",
    };
  }

  const { GoogleSignin, statusCodes } = mod;

  try {
    if (!configured) {
      GoogleSignin.configure({
        // webClientId is what Google issues the ID token's audience for; it must
        // match the Web client ID configured in Supabase's Google provider.
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
        scopes: ["profile", "email"],
        offlineAccess: false,
      });
      configured = true;
    }

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const res = await GoogleSignin.signIn();

    // v13+ returns { type: "cancelled" | "success", data }; older returns the
    // success payload directly (and throws SIGN_IN_CANCELLED on cancel).
    if (res?.type === "cancelled") return { error: null, cancelled: true };

    const idToken: string | undefined = res?.data?.idToken ?? res?.idToken;
    if (!idToken) return { error: "Could not get a Google ID token. Please try again." };

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error) return { error: error.message };

    // Session is set on the supabase client; authStore's onAuthStateChange
    // listener picks it up and the AuthGuard routes the user onward.
    return { error: null };
  } catch (e: any) {
    if (statusCodes && e?.code === statusCodes.SIGN_IN_CANCELLED) {
      return { error: null, cancelled: true };
    }
    if (statusCodes && e?.code === statusCodes.IN_PROGRESS) {
      return { error: null, cancelled: true };
    }
    if (statusCodes && e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { error: "Google Play Services are required and not available on this device." };
    }
    return { error: e?.message ?? "Google Sign-In failed. Please try again." };
  }
}
