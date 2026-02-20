import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Colors, BorderRadius, FontSize, Spacing } from "@/lib/constants";
import { formatGameTime } from "@/lib/datetime";
import { SportIcon } from "./SportIcon";
import type { GameWithLocation } from "@/types/database";

interface GameCardProps {
  game: GameWithLocation;
}

export function GameCard({ game }: GameCardProps) {
  const spotsLeft = game.max_players - game.current_players;
  const isFull = spotsLeft <= 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/game/${game.id}`)}
      activeOpacity={0.7}
    >
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
            {isFull ? "FULL" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.location}>📍 {game.locations?.name ?? "TBD"}</Text>
        <Text style={styles.time}>🕐 {formatGameTime(game.starts_at)}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.players}>
          <Text style={styles.playerCount}>
            {game.current_players}/{game.max_players} players
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(game.current_players / game.max_players) * 100}%`,
                },
                isFull && styles.progressFull,
              ]}
            />
          </View>
        </View>
      </View>

      {game.notes ? (
        <Text style={styles.notes} numberOfLines={1}>
          {game.notes}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.darkTertiary,
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
  },
  skill: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  badge: {
    backgroundColor: Colors.accent + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeFull: {
    backgroundColor: Colors.error + "20",
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
  },
  location: {
    fontSize: FontSize.sm,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  time: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  players: {
    flex: 1,
  },
  playerCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.darkTertiary,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  progressFull: {
    backgroundColor: Colors.error,
  },
  notes: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
});
