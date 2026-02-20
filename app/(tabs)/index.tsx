import { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { useGames } from "@/hooks/useGames";
import { useFriends } from "@/hooks/useFriends";
import { useFriendGames } from "@/hooks/useFriendGames";
import { GameCard } from "@/components/game/GameCard";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { SportFilterChips } from "@/components/feed/SportFilterChips";
import { FAB } from "@/components/ui/FAB";
import { supabase } from "@/lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, Sport, sportInfo } from "@/lib/constants";
import type { GameWithLocation } from "@/types/database";

export default function HomeScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "my">("upcoming");
  const [sportFilter, setSportFilter] = useState<Sport | null>(null);

  const [playerCount, setPlayerCount] = useState<number | null>(null);

  const { friends, fetchFriends } = useFriends(user?.id);
  const friendIds = friends.map((f) => f.profile.id);
  const { friendGames, fetchFriendGames } = useFriendGames(user?.id, friendIds);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => setPlayerCount(count ?? null));
    if (user?.id) {
      fetchFriends();
    }
  }, [user?.id]);

  // Fetch friend games once we have friend IDs
  useEffect(() => {
    if (friendIds.length > 0) {
      fetchFriendGames();
    }
  }, [friendIds.length]);

  const { games, loading, refreshing, refresh } = useGames({
    sportFilter,
    myOnly: tab === "my",
    userId: user?.id,
  });

  const renderItem = ({ item }: { item: GameWithLocation }) => (
    <GameCard game={item} />
  );

  const FriendGamesHeader = () => {
    if (friendGames.length === 0) return null;
    return (
      <View style={styles.friendGamesSection}>
        <Text style={styles.friendGamesSectionTitle}>Friends Playing</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.friendGamesScroll}
        >
          {friendGames.map((game) => {
            const sport = sportInfo(game.sport);
            const isLive = game.status === "started";
            return (
              <Pressable
                key={game.id}
                style={[
                  styles.friendGameCard,
                  game.invited && styles.friendGameCardInvited,
                ]}
                onPress={() => router.push(`/game/${game.id}`)}
              >
                {game.invited && (
                  <View style={styles.invitedBadge}>
                    <Text style={styles.invitedBadgeText}>Invited</Text>
                  </View>
                )}
                {isLive && (
                  <View style={styles.liveGameBadge}>
                    <Text style={styles.liveGameBadgeText}>LIVE</Text>
                  </View>
                )}
                <Text style={styles.friendGameEmoji}>{sport.emoji}</Text>
                <Text style={styles.friendGameSport}>{sport.label}</Text>
                <Text style={styles.friendGameHost} numberOfLines={1}>
                  {game.host_display_name ?? "Friend"}
                </Text>
                <Text style={styles.friendGameLocation} numberOfLines={1}>
                  {game.location_name ?? "Campus"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.headerInner}>
          <FeedTabs active={tab} onChange={setTab} />
          <SportFilterChips selected={sportFilter} onSelect={setSportFilter} />
          {playerCount !== null && (
            <Text style={styles.playerCount}>
              {playerCount} player{playerCount !== 1 ? "s" : ""} on PullUp
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={<FriendGamesHeader />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                refresh();
                fetchFriendGames();
              }}
              tintColor={Colors.accent}
            />
          }
          style={styles.listWrap}
          contentContainerStyle={
            games.length === 0 && friendGames.length === 0
              ? styles.centerList
              : styles.list
          }
          ListEmptyComponent={
            friendGames.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyTitle}>No games yet</Text>
                <Text style={styles.emptyText}>
                  Tap + to post the first game
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB onPress={() => router.push("/create-game")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  headerArea: { paddingTop: Spacing.md },
  headerInner: {
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  playerCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
    paddingBottom: Spacing.sm,
  },
  listWrap: {
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  list: { paddingTop: Spacing.xs, paddingBottom: 100 },
  centerList: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Friends playing section
  friendGamesSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  friendGamesSectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  friendGamesScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  friendGameCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    width: 130,
    alignItems: "center",
    position: "relative",
  },
  friendGameCardInvited: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  invitedBadge: {
    position: "absolute",
    top: -8,
    right: 6,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  invitedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.dark,
  },
  liveGameBadge: {
    position: "absolute",
    top: -8,
    left: 6,
    backgroundColor: Colors.success + "22",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  liveGameBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.success,
  },
  friendGameEmoji: {
    fontSize: 28,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  friendGameSport: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  friendGameHost: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
    textAlign: "center",
  },
  friendGameLocation: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
