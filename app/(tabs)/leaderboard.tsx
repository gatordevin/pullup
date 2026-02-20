import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui/Avatar";
import {
  Colors,
  Gradient,
  FontSize,
  Spacing,
  BorderRadius,
  SPORTS,
  sportInfo,
} from "@/lib/constants";
import type { Profile } from "@/types/database";

type SortBy = "elo" | "wins" | "winrate" | "matches";

interface LeaderboardEntry {
  user_id: string;
  sport: string;
  elo_rating: number;
  wins: number;
  losses: number;
  draws: number;
  matches_played: number;
  win_rate: number;
  profile?: Profile;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "elo", label: "ELO" },
  { value: "wins", label: "Wins" },
  { value: "winrate", label: "Win %" },
  { value: "matches", label: "Most Active" },
];

export default function LeaderboardScreen() {
  const [selectedSport, setSelectedSport] = useState<string>("pickleball");
  const [sortBy, setSortBy] = useState<SortBy>("elo");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    const { data: stats } = await supabase
      .from("player_stats")
      .select("*")
      .eq("sport", selectedSport)
      .gte("matches_played", 1)
      .order("elo_rating", { ascending: false })
      .limit(50);

    if (!stats || stats.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const userIds = stats
      .map((s: any) => s.user_id)
      .filter((id: string) => !id.startsWith("guest_"));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profileMap: Record<string, Profile> = {};
    for (const p of (profiles as Profile[]) ?? []) profileMap[p.id] = p;

    let result: LeaderboardEntry[] = (stats as any[])
      .filter((s) => !s.user_id.startsWith("guest_"))
      .map((s) => ({
        user_id: s.user_id,
        sport: s.sport,
        elo_rating: s.elo_rating,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        matches_played: s.matches_played,
        win_rate: s.matches_played > 0 ? (s.wins / s.matches_played) * 100 : 0,
        profile: profileMap[s.user_id],
      }));

    // Sort
    switch (sortBy) {
      case "elo":
        result.sort((a, b) => b.elo_rating - a.elo_rating);
        break;
      case "wins":
        result.sort((a, b) => b.wins - a.wins);
        break;
      case "winrate":
        result.sort(
          (a, b) =>
            b.win_rate - a.win_rate || b.matches_played - a.matches_played
        );
        break;
      case "matches":
        result.sort((a, b) => b.matches_played - a.matches_played);
        break;
    }

    setEntries(result);
    setLoading(false);
  }, [selectedSport, sortBy]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const sport = sportInfo(selectedSport);

  const renderEntry = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => {
    const rank = index + 1;
    const medalColors: Record<number, string> = {
      1: "#FFD700",
      2: "#C0C0C0",
      3: "#CD7F32",
    };
    const rankColor = medalColors[rank] ?? Colors.textMuted;

    return (
      <Pressable
        style={[styles.entryRow, rank <= 3 && styles.entryRowTop]}
        onPress={() => router.push(`/profile/${item.user_id}` as any)}
      >
        <Text style={[styles.rank, { color: rankColor }]}>
          {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `${rank}`}
        </Text>

        <Avatar
          name={item.profile?.display_name ?? null}
          imageUrl={item.profile?.avatar_url}
          size={40}
        />

        <View style={styles.entryInfo}>
          <Text style={styles.entryName} numberOfLines={1}>
            {item.profile?.display_name ?? "Player"}
          </Text>
          <Text style={styles.entryRecord}>
            {item.wins}W · {item.losses}L
            {item.matches_played > 0
              ? ` · ${Math.round(item.win_rate)}%`
              : ""}
          </Text>
        </View>

        <View style={styles.entryElo}>
          <Text style={styles.eloValue}>{item.elo_rating}</Text>
          <Text style={styles.eloLabel}>ELO</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[...Gradient.brandSubtle]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSub}>UF PullUp Rankings</Text>
      </View>

      {/* Sport selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sportTabsScroll}
        contentContainerStyle={styles.sportTabsContent}
      >
        {SPORTS.map((s) => (
          <Pressable
            key={s.value}
            style={[
              styles.sportTab,
              selectedSport === s.value && styles.sportTabActive,
            ]}
            onPress={() => setSelectedSport(s.value)}
          >
            <Text style={styles.sportTabEmoji}>{s.emoji}</Text>
            <Text
              style={[
                styles.sportTabLabel,
                selectedSport === s.value && styles.sportTabLabelActive,
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort options */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[
              styles.sortBtn,
              sortBy === opt.value && styles.sortBtnActive,
            ]}
            onPress={() => setSortBy(opt.value)}
          >
            <Text
              style={[
                styles.sortBtnText,
                sortBy === opt.value && styles.sortBtnTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>{sport.emoji}</Text>
          <Text style={styles.emptyTitle}>No rankings yet</Text>
          <Text style={styles.emptySub}>
            Be the first to record a {sport.label} match!
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.user_id}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sportTabsScroll: {
    flexGrow: 0,
  },
  sportTabsContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  sportTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sportTabActive: {
    backgroundColor: Colors.accent + "22",
    borderColor: Colors.accent,
  },
  sportTabEmoji: {
    fontSize: 16,
  },
  sportTabLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  sportTabLabelActive: {
    color: Colors.accent,
  },
  sortRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  sortBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkCard,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortBtnActive: {
    backgroundColor: Colors.darkTertiary,
    borderColor: Colors.accent + "66",
  },
  sortBtnText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  sortBtnTextActive: {
    color: Colors.accent,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  entryRowTop: {
    borderColor: Colors.accent + "44",
    backgroundColor: Colors.darkElevated,
  },
  rank: {
    fontSize: FontSize.md,
    fontWeight: "900",
    width: 32,
    textAlign: "center",
    color: Colors.textMuted,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  entryRecord: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  entryElo: {
    alignItems: "center",
  },
  eloValue: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: Colors.accent,
  },
  eloLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
