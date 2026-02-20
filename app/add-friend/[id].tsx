import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useFriends } from "@/hooks/useFriends";
import { Avatar } from "@/components/ui/Avatar";
import {
  Colors,
  Gradient,
  FontSize,
  Spacing,
  BorderRadius,
} from "@/lib/constants";
import type { Profile } from "@/types/database";

export default function AddFriendScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isGuest } = useAuth();
  const { sendRequestById } = useFriends(user?.id);

  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error" | "already"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [autoSent, setAutoSent] = useState(false);

  // Load the profile of the person who shared the link
  useEffect(() => {
    if (!id) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setTargetProfile(data as Profile | null);
        setLoadingProfile(false);
      });
  }, [id]);

  // Auto-send friend request once we have the profile and the user is logged in
  useEffect(() => {
    if (autoSent || !targetProfile || !user || isGuest || loadingProfile) return;
    if (user.id === id) return; // own link
    setAutoSent(true);
    setStatus("sending");
    sendRequestById(id).then((result) => {
      if (!result.error) {
        setStatus("success");
      } else if (
        result.error === "Already friends" ||
        result.error === "Request already pending"
      ) {
        setStatus("already");
        setErrorMsg(result.error);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Something went wrong");
      }
    });
  }, [targetProfile, user, isGuest, loadingProfile, autoSent]);

  if (loadingProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!targetProfile) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>Link not found</Text>
        <Text style={styles.sub}>This invite link is invalid or expired.</Text>
        <Pressable
          onPress={() => router.replace("/")}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  const name = targetProfile.display_name ?? "Someone";
  const isOwnLink = user?.id === id;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...Gradient.brandSubtle]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.card}>
        <Avatar
          name={targetProfile.display_name}
          imageUrl={targetProfile.avatar_url}
          size={80}
        />
        <Text style={styles.heading}>{name}</Text>
        <Text style={styles.sub}>wants to be friends on PullUp</Text>

        {/* Own link */}
        {isOwnLink && (
          <>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>This is your invite link</Text>
            </View>
            <Text style={styles.hint}>
              Share this link with friends — when they open it, a friend request
              is sent to you automatically.
            </Text>
            <Pressable
              onPress={() => router.replace("/(tabs)/profile")}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={[...Gradient.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
              />
              <Text style={styles.primaryBtnText}>Go to Profile</Text>
            </Pressable>
          </>
        )}

        {/* Not logged in */}
        {!isOwnLink && (!user || isGuest) && (
          <>
            <Text style={styles.hint}>
              Sign up or log in to add {name} as a friend.
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(auth)/login",
                  params: { redirect: `/add-friend/${id}` },
                })
              }
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={[...Gradient.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
              />
              <Text style={styles.primaryBtnText}>Sign Up / Log In</Text>
            </Pressable>
          </>
        )}

        {/* Sending */}
        {!isOwnLink && user && !isGuest && status === "sending" && (
          <>
            <ActivityIndicator
              color={Colors.accent}
              style={{ marginTop: Spacing.xxl }}
            />
            <Text style={styles.hint}>Sending friend request...</Text>
          </>
        )}

        {/* Success */}
        {!isOwnLink && status === "success" && (
          <>
            <View style={[styles.badge, { backgroundColor: Colors.success + "22" }]}>
              <Text style={[styles.badgeText, { color: Colors.success }]}>
                ✓ Friend request sent!
              </Text>
            </View>
            <Text style={styles.hint}>
              {name} will see your request and can accept it from their profile.
            </Text>
            <Pressable
              onPress={() => router.replace("/(tabs)/profile")}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={[...Gradient.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
              />
              <Text style={styles.primaryBtnText}>View Your Friends</Text>
            </Pressable>
          </>
        )}

        {/* Already friends / pending */}
        {!isOwnLink && status === "already" && (
          <>
            <View style={[styles.badge, { backgroundColor: Colors.accent + "22" }]}>
              <Text style={[styles.badgeText, { color: Colors.accent }]}>
                {errorMsg}
              </Text>
            </View>
            <Pressable
              onPress={() => router.replace("/(tabs)/profile")}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={[...Gradient.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
              />
              <Text style={styles.primaryBtnText}>Go to Profile</Text>
            </Pressable>
          </>
        )}

        {/* Error */}
        {!isOwnLink && status === "error" && (
          <>
            <View style={[styles.badge, { backgroundColor: Colors.error + "22" }]}>
              <Text style={[styles.badgeText, { color: Colors.error }]}>
                {errorMsg}
              </Text>
            </View>
            <Pressable
              onPress={() => router.replace("/(tabs)/profile")}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={[...Gradient.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
              />
              <Text style={styles.primaryBtnText}>Go Home</Text>
            </Pressable>
          </>
        )}
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
    padding: Spacing.xxl,
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
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    marginTop: Spacing.lg,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  sub: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  badge: {
    marginTop: Spacing.xxl,
    backgroundColor: Colors.darkTertiary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  primaryBtn: {
    marginTop: Spacing.xxl,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xxxl,
    alignItems: "center",
    width: "100%",
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.dark,
  },
});
