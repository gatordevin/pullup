import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradient, BorderRadius, FontSize, Spacing } from "@/lib/constants";
import { formatGameTime } from "@/lib/datetime";
import { SportIcon } from "./SportIcon";
import type { GameWithLocation } from "@/types/database";

interface GameCardProps {
  game: GameWithLocation;
}

export function GameCard({ game }: GameCardProps) {
  const spotsLeft = game.max_players - game.current_players;
  const isFull = spotsLeft <= 0;
  const fillPct = Math.min((game.current_players / game.max_players) * 100, 100);

  return (
    <Pressable
      onPress={() => router.push(`/game/${game.id}`)}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Subtle gradient shine on top edge */}
      <LinearGradient
        colors={[...Gradient.cardShine]}
        style={styles.shine}
      />

      <View style={styles.header}>
        <SportIcon sport={game.sport} />
        <View style={styles.headerText}>
          <Text style={styles.sport}>
            {game.sport === "pickleball" ? "Pickleball" : "Spikeball"}
          </Text>
          <Text style={styles.skill}>{game.skill_level}</Text>
        </View>
        <View style={[styles.badge, isFull && styles.badgeFull]}>
          <Text style={[styles.badgeText, isFull && styles.badgeFullText]}>
            {isFull ? "FULL" : `${spotsLeft} left`}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍</Text>
          <Text style={styles.detailValue}>{game.locations?.name ?? "TBD"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🕐</Text>
          <Text style={styles.detailValue}>{formatGameTime(game.starts_at)}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={isFull ? [Colors.error, Colors.error] : [...Gradient.brand]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${fillPct}%` }]}
          />
        </View>
        <Text style={styles.playerCount}>
          {game.current_players}/{game.max_players}
        </Text>
      </View>

      {game.notes ? (
        <Text style={styles.notes} numberOfLines={1}>
          "{game.notes}"
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg + 2,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sport: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  skill: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: "capitalize",
    marginTop: 1,
  },
  badge: {
    backgroundColor: Colors.accent + "18",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.full,
  },
  badgeFull: {
    backgroundColor: Colors.error + "18",
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.accent,
  },
  badgeFullText: {
    color: Colors.error,
  },
  details: {
    marginBottom: Spacing.md,
    gap: Spacing.xs + 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    width: 20,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.darkTertiary,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  playerCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 30,
    textAlign: "right",
  },
  notes: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm + 2,
    fontStyle: "italic",
  },
});
