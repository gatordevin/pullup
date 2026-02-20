import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { GameCard } from "@/components/game/GameCard";
import { supabase } from "@/lib/supabase";
import {
  Colors,
  Gradient,
  FontSize,
  Spacing,
  BorderRadius,
  SPORTS,
  SKILL_LEVELS,
  UF_LOCATIONS,
} from "@/lib/constants";
import type { GameWithLocation } from "@/types/database";

export default function ProfileScreen() {
  const { user, signOut, refreshProfile, isGuest, guestLogout } = useAuth();
  const { profile, loading, fetchProfile } = useProfile(user?.id);
  const [myGames, setMyGames] = useState<GameWithLocation[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyGames();
    } else {
      setGamesLoading(false);
    }
  }, [user?.id]);

  const fetchMyGames = async () => {
    if (!user) return;

    const { data: hosted } = await supabase
      .from("games")
      .select("*, locations(*)")
      .eq("host_id", user.id)
      .order("starts_at", { ascending: false })
      .limit(10);

    const { data: participantRows } = await supabase
      .from("game_participants")
      .select("game_id")
      .eq("user_id", user.id)
      .eq("status", "joined");

    const participantGameIds =
      participantRows?.map((p: any) => p.game_id) ?? [];
    let joined: GameWithLocation[] = [];

    if (participantGameIds.length > 0) {
      const { data } = await supabase
        .from("games")
        .select("*, locations(*)")
        .in("id", participantGameIds)
        .neq("host_id", user.id)
        .order("starts_at", { ascending: false })
        .limit(10);
      joined = (data as GameWithLocation[]) ?? [];
    }

    setMyGames([...((hosted as GameWithLocation[]) ?? []), ...joined]);
    setGamesLoading(false);
  };

  const handleSignOut = () => {
    if (isGuest) {
      guestLogout();
      return;
    }
    if (Platform.OS === "web") {
      if ((window as any).confirm("Sign Out\nAre you sure?")) {
        signOut().then(() => router.replace("/(auth)/login"));
      }
    } else {
      Alert.alert("Sign Out", "Are you sure?", [
        { text: "Cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/login");
          },
        },
      ]);
    }
  };

  // Not logged in at all
  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.notLoggedTitle}>Welcome to PullUp</Text>
        <Text style={styles.notLoggedSub}>
          Sign in to track your games and manage your profile
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={({ pressed }) => [
            styles.loginBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <LinearGradient
            colors={[...Gradient.brand]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
          />
          <Text style={styles.loginBtnText}>Log In / Sign Up</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const sportLabel = SPORTS.find((s) => s.value === profile?.preferred_sport);
  const skillLabel = SKILL_LEVELS.find(
    (s) => s.value === profile?.skill_level
  );
  const locationLabel = UF_LOCATIONS.find(
    (l) => l.id === profile?.favorite_location_id
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* Guest banner */}
        {isGuest && (
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={styles.guestBanner}
          >
            <Text style={styles.guestBannerText}>
              You're browsing as a guest.{" "}
              <Text style={styles.guestBannerLink}>Create an account</Text> to keep your data.
            </Text>
          </Pressable>
        )}

        {/* Profile header */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[...Gradient.brandSubtle]}
            style={styles.profileGlow}
          />
          <Avatar name={profile?.display_name ?? null} imageUrl={profile?.avatar_url} size={80} />
          {editingName ? (
            <View style={styles.editNameRow}>
              <TextInput
                style={styles.editNameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                maxLength={30}
              />
              <Pressable
                onPress={async () => {
                  if (newName.trim().length >= 2 && user) {
                    await supabase.from("profiles").update({ display_name: newName.trim() }).eq("id", user.id);
                    await refreshProfile();
                    fetchProfile();
                  }
                  setEditingName(false);
                }}
                style={styles.editNameSave}
              >
                <Text style={styles.editNameSaveText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => { setNewName(profile?.display_name ?? ""); setEditingName(true); }}>
              <Text style={styles.name}>
                {profile?.display_name ?? "Player"} ✏️
              </Text>
            </Pressable>
          )}
          <Text style={styles.email}>
            {user?.email}
            {isGuest && " (Guest)"}
          </Text>

          <View style={styles.tags}>
            {sportLabel && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {sportLabel.emoji} {sportLabel.label}
                </Text>
              </View>
            )}
            {skillLabel && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{skillLabel.label}</Text>
              </View>
            )}
            {locationLabel && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>📍 {locationLabel.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* My Games */}
        <Text style={styles.sectionTitle}>My Games</Text>
        {gamesLoading ? (
          <ActivityIndicator
            color={Colors.accent}
            style={{ marginTop: Spacing.xxl }}
          />
        ) : myGames.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No games yet</Text>
            <Text style={styles.emptyHint}>
              Create or join a game to see it here
            </Text>
          </View>
        ) : (
          myGames.map((game) => <GameCard key={game.id} game={game} />)
        )}

        {/* Sign Out / Upgrade */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.signOutText}>
            {isGuest ? "Clear Guest Data" : "Sign Out"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  content: { paddingBottom: 60 },
  inner: {
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark,
    paddingHorizontal: Spacing.xxl,
  },

  notLoggedTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  notLoggedSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  loginBtn: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xxxxl,
    alignItems: "center",
  },
  loginBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.dark,
  },

  guestBanner: {
    backgroundColor: Colors.accent + "15",
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent + "30",
    padding: Spacing.md,
    alignItems: "center",
  },
  guestBannerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  guestBannerLink: {
    color: Colors.accent,
    fontWeight: "600",
  },

  profileCard: {
    alignItems: "center",
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
    position: "relative",
    overflow: "hidden",
  },
  profileGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    marginTop: Spacing.lg,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  tag: {
    backgroundColor: Colors.darkCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },
  emptyBox: { alignItems: "center", paddingVertical: Spacing.xxxl },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  editNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  editNameInput: {
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: "700",
    minWidth: 180,
    textAlign: "center",
  },
  editNameSave: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  editNameSaveText: {
    color: Colors.dark,
    fontWeight: "700",
    fontSize: FontSize.sm,
  },
  signOutBtn: {
    marginTop: Spacing.xxxxl,
    alignSelf: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  signOutText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
});
