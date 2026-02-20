import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import {
  Colors,
  Gradient,
  FontSize,
  Spacing,
  BorderRadius,
} from "@/lib/constants";
import type { Profile } from "@/types/database";

export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { user, isGuest } = useAuth();
  const [referrerProfile, setReferrerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!code) return;
    // Look up referral code → referrer profile
    supabase
      .from("referral_codes")
      .select("user_id")
      .eq("code", code.toUpperCase())
      .single()
      .then(async ({ data }) => {
        if (data?.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user_id)
            .single();
          setReferrerProfile(profile as Profile | null);
        }
        setLoading(false);
      });
  }, [code]);

  // Auto-register referral if user is logged in
  useEffect(() => {
    if (!user || isGuest || !code || registered) return;
    setRegistered(true);
    supabase.rpc("register_referral", {
      p_referee_id: user.id,
      p_referral_code: code.toUpperCase(),
      p_used_google: true, // Clerk handles this; we assume Google for now
    });
  }, [user, isGuest, code, registered]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const referrerName = referrerProfile?.display_name ?? "A friend";

  return (
    <View style={styles.container}>
      <LinearGradient colors={[...Gradient.brandSubtle]} style={StyleSheet.absoluteFill} />
      <View style={styles.card}>
        <Text style={styles.emoji}>🎟️</Text>
        <Text style={styles.heading}>{referrerName} invited you!</Text>
        <Text style={styles.sub}>
          Sign up for PullUp — the app for pickup sports at UF.
        </Text>

        <View style={styles.perksBox}>
          <Text style={styles.perkItem}>🏓 Find pickup games near you</Text>
          <Text style={styles.perkItem}>📊 Track your ELO & match history</Text>
          <Text style={styles.perkItem}>👥 Play with friends</Text>
          <Text style={styles.perkItem}>🏆 Compete on the leaderboard</Text>
        </View>

        <Text style={styles.raffleNote}>
          Join an event and {referrerName} earns a raffle ticket for a chance to win a pickleball paddle! 🏓
        </Text>

        {user && !isGuest ? (
          <Pressable style={styles.primaryBtn} onPress={() => router.replace("/")}>
            <LinearGradient
              colors={[...Gradient.brand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
            />
            <Text style={styles.primaryBtnText}>Find a Game 🎮</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.primaryBtn}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { redirect: `/join/${code}`, referralCode: code },
              })
            }
          >
            <LinearGradient
              colors={[...Gradient.brand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
            />
            <Text style={styles.primaryBtnText}>Sign Up with Google 🚀</Text>
          </Pressable>
        )}

        <Text style={styles.googleNote}>
          * Google sign-in required to qualify for referral rewards
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxxl,
    alignItems: "center",
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  sub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  perksBox: {
    width: "100%",
    backgroundColor: Colors.darkTertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  perkItem: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  raffleNote: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    fontWeight: "600",
  },
  primaryBtn: {
    width: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.dark,
  },
  googleNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
