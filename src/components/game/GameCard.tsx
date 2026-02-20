import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Colors,
  Gradient,
  FontSize,
  Spacing,
  BorderRadius,
  sportInfo,
  equipmentLabel as getEquipLabel,
} from "@/lib/constants";
import { formatGameTime, formatRelative } from "@/lib/datetime";
import type { GameWithLocation } from "@/types/database";

interface GameCardProps {
  game: GameWithLocation;
}

export function GameCard({ game }: GameCardProps) {
  const progress =
    game.max_players > 0 ? game.current_players / game.max_players : 0;
  const isFull = game.current_players >= game.max_players;
  const spotsLeft = game.max_players - game.current_players;
  const si = sportInfo(game.sport);

  return (
    <Pressable
      onPress={() => router.push(`/game/${game.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Top: sport + relative time */}
      <View style={styles.topRow}>
        <View style={styles.sportBadge}>
          <Text style={styles.sportEmoji}>{si.emoji}</Text>
          <Text style={styles.sportName}>{si.label}</Text>
        </View>
        <Text style={styles.relTime}>{formatRelative(game.starts_at)}</Text>
      </View>

      {/* Sport-specific details */}
      {game.sport === "running" ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📏</Text>
          <Text style={styles.detailText}>
            {game.distance_miles ? `${game.distance_miles} mi` : "Distance TBD"}
            {game.pace ? ` · ${game.pace} pace` : ""}
          </Text>
        </View>
      ) : null}

      {/* Location + time */}
      <View style={styles.detailRow}>
        <Text style={styles.detailIcon}>📍</Text>
        <Text style={styles.detailText}>
          {game.locations?.name ?? "Any court"}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailIcon}>🕐</Text>
        <Text style={styles.detailText}>
          {game.time_flexible ? "Flexible" : formatGameTime(game.starts_at)}
        </Text>
      </View>

      {/* Tags */}
      <View style={styles.tagsRow}>
        {game.skill_level !== "any" && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{game.skill_level}</Text>
          </View>
        )}
        {game.sport !== "running" && game.has_equipment && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {si.emoji} Has {getEquipLabel(game.sport)}
            </Text>
          </View>
        )}
        {game.extra_equipment && (
          <View style={[styles.tag, styles.tagHighlight]}>
            <Text style={[styles.tagText, styles.tagHighlightText]}>
              🎁 Extras to share
            </Text>
          </View>
        )}
      </View>

      {/* Bottom: count + progress */}
      <View style={styles.bottomRow}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerCount}>
            {game.current_players}
            <Text style={styles.playerMax}>/{game.max_players}</Text>
          </Text>
          <Text style={styles.spotsText}>
            {isFull
              ? "Full"
              : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
          </Text>
        </View>
        <View style={styles.progressBg}>
          <LinearGradient
            colors={isFull ? ["#FF453A", "#FF6961"] : [...Gradient.brand]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              { width: `${Math.min(progress * 100, 100)}%` as any },
            ]}
          />
        </View>
      </View>

      {game.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {game.notes}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sportBadge: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  sportEmoji: { fontSize: 20 },
  sportName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  relTime: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: "600" },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: Spacing.sm,
  },
  detailIcon: { fontSize: 14, width: 20 },
  detailText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.darkTertiary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  tagHighlight: { backgroundColor: Colors.accent + "18" },
  tagHighlightText: { color: Colors.accent },

  bottomRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  playerInfo: { minWidth: 60 },
  playerCount: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  playerMax: { color: Colors.textMuted, fontWeight: "400" },
  spotsText: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },

  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.darkTertiary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  notes: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    fontStyle: "italic",
  },
});
