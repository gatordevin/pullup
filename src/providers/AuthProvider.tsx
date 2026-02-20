import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/database";

interface AuthContextType {
  isSignedIn: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, signOut: clerkSignOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const userId = clerkUser?.id ?? null;
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    // Ensure profile exists in Supabase (upsert on first login)
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (existing) {
      setProfile(existing as Profile);
    } else {
      // Create profile for new Clerk user
      const { data: created } = await supabase
        .from("profiles")
        .upsert({ id: userId, display_name: clerkUser?.firstName ?? null } as any, {
          onConflict: "id",
        })
        .select("*")
        .single();
      setProfile(created as Profile | null);
    }
    setProfileLoading(false);
  }, [userId, clerkUser?.firstName]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProfile();
    } else if (isLoaded) {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchProfile]);

  const signOut = async () => {
    await clerkSignOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: isSignedIn ?? false,
        isLoading: !isLoaded || (isSignedIn === true && profileLoading),
        userId,
        email,
        profile,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  // Return a shape compatible with what screens expect
  return {
    session: ctx.isSignedIn ? {} : null,
    user: ctx.userId ? { id: ctx.userId, email: ctx.email } : null,
    profile: ctx.profile,
    isLoading: ctx.isLoading,
    signOut: ctx.signOut,
    refreshProfile: ctx.refreshProfile,
  };
}
