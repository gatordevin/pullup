import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/game/GameCard";
import { supabase } from "@/lib/supabase";
import {
  Colors,
  FontSize,
  Spacing,
  BorderRadius,
  SPORTS,
  SKILL_LEVELS,
  UF_LOCATIONS,
} from "@/lib/constants";
import type { GameWithLocation } from "@/types/database";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading, fetchProfile } = useProfile(user?.id);
  const [myGames, setMyGames] = useState<GameWithLocation[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchMyGames();
  }, []);

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

    const participantGameIds = participantRows?.map((p: any) => p.game_id) ?? [];
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

    setMyGames([...(hosted as GameWithLocation[] ?? []), ...joined]);
    setGamesLoading(false);
  };

  const handleSignOut = () => {
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
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const sportLabel = SPORTS.find((s) => s.value === profile?.preferred_sport);
  const skillLabel = SKILL_LEVELS.find((s) => s.value === profile?.skill_level);
  const locationLabel = UF_LOCATIONS.find((l) => l.id === profile?.favorite_location_id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Avatar name={profile?.display_name ?? null} size={72} />
        <Text style={styles.name}>{profile?.display_name ?? "Gator"}</Text>
        <Text style={styles.email}>{user?.email}</Text>

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
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.lg }} />
      ) : myGames.length === 0 ? (
        <Text style={styles.emptyText}>No games yet — create or join one!</Text>
      ) : (
        myGames.map((game) => <GameCard key={game.id} game={game} />)
      )}

      {/* Sign Out */}
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="ghost"
        style={styles.signOutBtn}
        textStyle={{ color: Colors.error }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark,
  },
  profileCard: {
    backgroundColor: Colors.darkElevated,
    alignItems: "center",
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkTertiary,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    marginTop: Spacing.md,
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
    marginTop: Spacing.lg,
  },
  tag: {
    backgroundColor: Colors.darkTertiary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
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
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: Spacing.xxl,
  },
  signOutBtn: {
    marginTop: Spacing.xxxl,
    alignSelf: "center",
  },
});
