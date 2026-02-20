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
  const { isSignedIn, isLoaded, signOut: clerkSignOut } = useClerkAuth();
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

    // Check if profile exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (existing) {
      const p = existing as Profile;
      const updates: Record<string, any> = {};

      // Auto-onboard if needed
      if (!p.onboarded) {
        updates.onboarded = true;
        updates.display_name = p.display_name ??
          clerkUser?.firstName ??
          clerkUser?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
          "Player";
      }
      // Sync avatar from Clerk
      if (clerkUser?.imageUrl && p.avatar_url !== clerkUser.imageUrl) {
        updates.avatar_url = clerkUser.imageUrl;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", userId);
        setProfile({ ...p, ...updates });
      } else {
        setProfile(p);
      }
      setProfileLoading(false);
      return;
    } else {
      // Create profile for new Clerk user
      const displayName =
        clerkUser?.firstName ??
        clerkUser?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
        null;

      const { data: created } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          display_name: displayName,
          avatar_url: clerkUser?.imageUrl ?? null,
          onboarded: true,
        })
        .select("*")
        .single();

      setProfile(created as Profile | null);
    }
    setProfileLoading(false);
  }, [userId, clerkUser?.firstName, clerkUser?.primaryEmailAddress?.emailAddress]);

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

  return {
    session: ctx.isSignedIn ? {} : null,
    user: ctx.userId ? { id: ctx.userId, email: ctx.email } : null,
    profile: ctx.profile,
    isLoading: ctx.isLoading,
    signOut: ctx.signOut,
    refreshProfile: ctx.refreshProfile,
  };
}
