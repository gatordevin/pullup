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
import { ChatPreview } from "@/components/game/ChatPreview";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { SportFilterChips } from "@/components/feed/SportFilterChips";
import { FAB } from "@/components/ui/FAB";
import { Colors, FontSize, Spacing, Sport } from "@/lib/constants";
import type { GameWithLocation } from "@/types/database";

export default function HomeScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "my">("upcoming");
  const [sportFilter, setSportFilter] = useState<Sport | null>(null);

  const { games, loading, refreshing, refresh } = useGames({
    sportFilter,
    myOnly: tab === "my",
    userId: user?.id,
  });

  const renderItem = ({ item }: { item: GameWithLocation }) => (
    <View>
      <GameCard game={item} />
      <ChatPreview gameId={item.id} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.headerInner}>
          <FeedTabs active={tab} onChange={setTab} />
          <SportFilterChips selected={sportFilter} onSelect={setSportFilter} />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.accent}
            />
          }
          style={styles.listWrap}
          contentContainerStyle={
            games.length === 0 ? styles.centerList : styles.list
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No games yet</Text>
              <Text style={styles.emptyText}>
                Tap + to post the first game
              </Text>
            </View>
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
});
