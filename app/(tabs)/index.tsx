import { useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { useGames } from "@/hooks/useGames";
import { GameCard } from "@/components/game/GameCard";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { SportFilterChips } from "@/components/feed/SportFilterChips";
import { FAB } from "@/components/ui/FAB";
import { Colors, FontSize, Spacing, Sport } from "@/lib/constants";

export default function HomeScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "my">("upcoming");
  const [sportFilter, setSportFilter] = useState<Sport | null>(null);

  const { games, loading, refreshing, refresh } = useGames({
    sportFilter,
    myOnly: tab === "my",
    userId: user?.id,
  });

  return (
    <View style={styles.container}>
      <FeedTabs active={tab} onChange={setTab} />
      <SportFilterChips selected={sportFilter} onSelect={setSportFilter} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GameCard game={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.accent}
            />
          }
          contentContainerStyle={games.length === 0 ? styles.center : styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏓</Text>
              <Text style={styles.emptyTitle}>No games yet</Text>
              <Text style={styles.emptyText}>
                Be the first to post a game!
              </Text>
            </View>
          }
        />
      )}

      <FAB onPress={() => router.push("/create-game")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  list: {
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
