import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/database";

const GUEST_KEY = "pullup_guest";

interface GuestData {
  id: string;
  displayName: string;
  email: string;
}

interface AuthContextType {
  isSignedIn: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  isGuest: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  guestLogin: (name: string, email: string) => Promise<void>;
  guestLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateGuestId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "guest_";
  for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

async function loadGuest(): Promise<GuestData | null> {
  try {
    if (Platform.OS === "web") {
      const raw = localStorage.getItem(GUEST_KEY);
      return raw ? JSON.parse(raw) : null;
    }
    const raw = await AsyncStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveGuest(data: GuestData): Promise<void> {
  const json = JSON.stringify(data);
  if (Platform.OS === "web") {
    localStorage.setItem(GUEST_KEY, json);
  } else {
    await AsyncStorage.setItem(GUEST_KEY, json);
  }
}

async function clearGuest(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(GUEST_KEY);
  } else {
    await AsyncStorage.removeItem(GUEST_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [guestLoaded, setGuestLoaded] = useState(false);

  const userId = clerkUser?.id ?? guest?.id ?? null;
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? guest?.email ?? null;

  // Load guest data on mount
  useEffect(() => {
    loadGuest().then((g) => {
      setGuest(g);
      setGuestLoaded(true);
    });
  }, []);

  // Migrate guest data when signing in with Clerk
  const migrateGuestData = useCallback(async (clerkId: string, clerkEmail: string) => {
    // Find guest profiles with the same email
    const { data: guestProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", clerkEmail.toLowerCase())
      .eq("is_guest", true);

    if (guestProfiles && guestProfiles.length > 0) {
      for (const gp of guestProfiles) {
        const guestId = gp.id;
        // Reassign game_participants
        await supabase
          .from("game_participants")
          .update({ user_id: clerkId })
          .eq("user_id", guestId);
        // Reassign messages
        await supabase
          .from("messages")
          .update({ user_id: clerkId })
          .eq("user_id", guestId);
        // Reassign hosted games
        await supabase
          .from("games")
          .update({ host_id: clerkId })
          .eq("host_id", guestId);
        // Delete guest profile
        await supabase
          .from("profiles")
          .delete()
          .eq("id", guestId);
      }
    }
    // Clear local guest data
    await clearGuest();
    setGuest(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    const activeId = clerkUser?.id ?? null;
    if (!activeId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", activeId)
      .single();

    if (existing) {
      const p = existing as Profile;
      const updates: Record<string, any> = {};

      if (!p.onboarded) {
        updates.onboarded = true;
        updates.display_name = p.display_name ??
          clerkUser?.firstName ??
          clerkUser?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
          "Player";
      }
      if (clerkUser?.imageUrl && p.avatar_url !== clerkUser.imageUrl) {
        updates.avatar_url = clerkUser.imageUrl;
      }
      const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress;
      if (clerkEmail && !p.email) {
        updates.email = clerkEmail.toLowerCase();
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", activeId);
        setProfile({ ...p, ...updates });
      } else {
        setProfile(p);
      }

      // Migrate any guest data with the same email
      if (clerkEmail) {
        await migrateGuestData(activeId, clerkEmail);
      }

      setProfileLoading(false);
      return;
    } else {
      const displayName =
        clerkUser?.firstName ??
        clerkUser?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
        null;
      const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress;

      // Migrate guest data before creating profile
      if (clerkEmail) {
        await migrateGuestData(activeId, clerkEmail);
      }

      const { data: created } = await supabase
        .from("profiles")
        .insert({
          id: activeId,
          display_name: displayName,
          avatar_url: clerkUser?.imageUrl ?? null,
          email: clerkEmail?.toLowerCase() ?? null,
          is_guest: false,
          onboarded: true,
        })
        .select("*")
        .single();

      setProfile(created as Profile | null);
    }
    setProfileLoading(false);
  }, [clerkUser?.id, clerkUser?.firstName, clerkUser?.primaryEmailAddress?.emailAddress, migrateGuestData]);

  // Fetch guest profile from Supabase
  const fetchGuestProfile = useCallback(async () => {
    if (!guest) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", guest.id)
      .single();

    if (data) {
      setProfile(data as Profile);
    } else {
      // Guest profile doesn't exist in DB anymore (maybe migrated), clear local
      await clearGuest();
      setGuest(null);
      setProfile(null);
    }
    setProfileLoading(false);
  }, [guest?.id]);

  useEffect(() => {
    if (!isLoaded || !guestLoaded) return;

    if (isSignedIn) {
      fetchProfile();
    } else if (guest) {
      fetchGuestProfile();
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [isLoaded, isSignedIn, guestLoaded, guest?.id, fetchProfile, fetchGuestProfile]);

  const signOut = async () => {
    await clerkSignOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (isSignedIn) {
      await fetchProfile();
    } else if (guest) {
      await fetchGuestProfile();
    }
  };

  const guestLogin = async (name: string, emailAddr: string) => {
    const normalizedEmail = emailAddr.toLowerCase().trim();

    // Check if a guest profile already exists with this email
    const { data: existingGuests } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("is_guest", true)
      .limit(1);

    let guestData: GuestData;

    if (existingGuests && existingGuests.length > 0) {
      // Reuse existing guest profile
      const existing = existingGuests[0] as Profile;
      guestData = { id: existing.id, displayName: name, email: normalizedEmail };
      // Update display name if changed
      if (existing.display_name !== name) {
        await supabase.from("profiles").update({ display_name: name }).eq("id", existing.id);
      }
    } else {
      // Create new guest profile
      const guestId = generateGuestId();
      await supabase.from("profiles").insert({
        id: guestId,
        display_name: name,
        email: normalizedEmail,
        is_guest: true,
        onboarded: true,
      });
      guestData = { id: guestId, displayName: name, email: normalizedEmail };
    }

    await saveGuest(guestData);
    setGuest(guestData);
  };

  const guestLogout = () => {
    clearGuest();
    setGuest(null);
    setProfile(null);
  };

  const effectiveSignedIn = (isSignedIn ?? false) || !!guest;

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: effectiveSignedIn,
        isLoading: !isLoaded || !guestLoaded || (effectiveSignedIn && profileLoading),
        userId,
        email,
        profile,
        isGuest: !!guest && !isSignedIn,
        signOut,
        refreshProfile,
        guestLogin,
        guestLogout,
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
    isGuest: ctx.isGuest,
    signOut: ctx.signOut,
    refreshProfile: ctx.refreshProfile,
    guestLogin: ctx.guestLogin,
    guestLogout: ctx.guestLogout,
  };
}
