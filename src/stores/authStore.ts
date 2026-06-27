import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { signInWithGoogleNative, GoogleAuthResult } from "../lib/googleAuth";
import { AuthStatus } from "../types/app.types";

interface AuthState {
  user: User | null;
  session: Session | null;
  status: AuthStatus;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<GoogleAuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  status: "loading",

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        status: session ? "authenticated" : "unauthenticated",
      });

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          status: session ? "authenticated" : "unauthenticated",
        });
      });
    } catch {
      set({ status: "unauthenticated" });
    }
  },

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  },

  signUpWithEmail: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // The DB trigger handle_new_user() reads full_name from this metadata
        // and creates the profiles row. No manual insert needed (and a manual
        // insert would fail RLS before email confirmation).
        data: { full_name: fullName },
      },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    // If no session is returned, the project requires email confirmation.
    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  },

  signInWithGoogle: async () => {
    // Native Google Sign-In → Supabase session (see src/lib/googleAuth.ts).
    // The onAuthStateChange listener set up in initialize() updates this store
    // automatically once Supabase has the new session.
    return signInWithGoogleNative();
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, status: "unauthenticated" });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "aihustleacademy://reset-password",
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      status: session ? "authenticated" : "unauthenticated",
    });
  },
}));
