import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/providers/AuthProvider";
import { useGame } from "@/hooks/useGame";
import { useGameChat } from "@/hooks/useGameChat";
import { JoinButton } from "@/components/game/JoinButton";
import { RosterList } from "@/components/game/RosterList";
import { ChatMessage } from "@/components/game/ChatMessage";
import { ChatInput } from "@/components/game/ChatInput";
import { copyGameLink } from "@/lib/clipboard";
import { formatGameTime, formatRelative } from "@/lib/datetime";
import { supabase } from "@/lib/supabase";
import { Colors, Gradient, FontSize, Spacing, BorderRadius, sportInfo, equipmentLabel as getEquipLabel } from "@/lib/constants";

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { game, participants, loading, refresh } = useGame(id!);
  const { messages, sendMessage } = useGameChat(id!);
  const [showChat, setShowChat] = useState(false);

  if (loading || !game) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const isHost = game.host_id === user?.id;
  const hasJoined = participants.some((p) => p.user_id === user?.id);
  const isFull = game.current_players >= game.max_players;
  const spotsLeft = game.max_players - game.current_players;
  const progress =
    game.max_players > 0 ? game.current_players / game.max_players : 0;

  const si = sportInfo(game.sport);

  const handleCancel = () => {
    if (Platform.OS === "web") {
      if ((window as any).confirm("Cancel Game\nAre you sure you want to cancel this game?")) {
        supabase.from("games").update({ status: "cancelled" as const }).eq("id", game.id).then(() => router.back());
      }
    } else {
      Alert.alert("Cancel Game", "Are you sure you want to cancel this game?", [
        { text: "No" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            await supabase.from("games").update({ status: "cancelled" as const }).eq("id", game.id);
            router.back();
          },
        },
      ]);
    }
  };

  const handleShare = async () => {
    await copyGameLink(game.id);
    if (Platform.OS === "web") {
      (window as any).alert("Link copied to clipboard!");
    } else {
      Alert.alert("Copied!", "Game link copied to clipboard");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {!showChat ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            {/* Hero */}
            <View style={styles.hero}>
              <LinearGradient
                colors={[...Gradient.brandSubtle]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.heroEmoji}>{si.emoji}</Text>
              <Text style={styles.heroTitle}>{si.label}</Text>
              <Text style={styles.heroTime}>
                {formatRelative(game.starts_at)}
              </Text>

              {/* Player count */}
              <View style={styles.countRow}>
                <Text style={styles.countNum}>{game.current_players}</Text>
                <Text style={styles.countSlash}>/</Text>
                <Text style={styles.countMax}>{game.max_players}</Text>
              </View>
              <Text style={styles.countHint}>
                {isFull
                  ? "Game is full"
                  : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
              </Text>

              {/* Progress */}
              <View style={styles.progressBg}>
                <LinearGradient
                  colors={
                    isFull ? ["#FF453A", "#FF6961"] : [...Gradient.brand]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(progress * 100, 100)}%` as any,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Detail card */}
            <View style={styles.detailCard}>
              {game.sport === "running" && (game.distance_miles || game.pace) && (
                <DetailRow
                  label="Run"
                  value={[
                    game.distance_miles ? `${game.distance_miles} mi` : null,
                    game.pace ? `${game.pace} pace` : null,
                  ].filter(Boolean).join(" · ")}
                />
              )}
              <DetailRow label="Where" value={game.locations?.name ?? "Any court"} />
              <DetailRow
                label="When"
                value={formatGameTime(game.starts_at)}
                badge={game.time_flexible ? "Flexible" : undefined}
              />
              <DetailRow
                label="Level"
                value={
                  game.skill_level === "any"
                    ? "All levels welcome"
                    : game.skill_level
                }
              />
              {(game.has_equipment || game.extra_equipment) && (
                <DetailRow
                  label="Gear"
                  value={[
                    game.has_equipment
                      ? `${si.emoji} Has ${getEquipLabel(game.sport)}`
                      : null,
                    game.extra_equipment ? "🎁 Extras to share" : null,
                  ]
                    .filter(Boolean)
                    .join("  ·  ")}
                  last
                />
              )}
            </View>

            {game.notes && (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{game.notes}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <JoinButton
                gameId={game.id}
                userId={user?.id ?? ""}
                hasJoined={hasJoined}
                isFull={isFull}
                isHost={isHost}
                onToggle={refresh}
              />
            </View>

            <View style={styles.secondaryRow}>
              <ActionChip label="💬 Chat" onPress={() => setShowChat(true)} />
              <ActionChip label="🔗 Share" onPress={handleShare} />
              {isHost && (
                <ActionChip label="Cancel" onPress={handleCancel} danger />
              )}
            </View>

            <RosterList participants={participants} hostId={game.host_id} />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Pressable
              onPress={() => setShowChat(false)}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.chatBack}>← Back to details</Text>
            </Pressable>
          </View>
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <ChatMessage
                content={item.content}
                displayName={item.profiles?.display_name ?? null}
                createdAt={item.created_at}
                isOwn={item.user_id === user?.id}
              />
            )}
            contentContainerStyle={styles.chatList}
          />
          <ChatInput
            onSend={(content) => {
              if (user) sendMessage(user.id, content);
            }}
            disabled={!hasJoined && !isHost}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/* Small helper components */
function DetailRow({
  label,
  value,
  badge,
  last,
}: {
  label: string;
  value: string;
  badge?: string;
  last?: boolean;
}) {
  return (
    <View style={[detailStyles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={detailStyles.label}>{label}</Text>
      <View style={detailStyles.valueWrap}>
        <Text style={[detailStyles.value, label === "Level" && { textTransform: "capitalize" }]}>
          {value}
        </Text>
        {badge && (
          <View style={detailStyles.badge}>
            <Text style={detailStyles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ActionChip({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        actionStyles.chip,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[actionStyles.text, danger && { color: Colors.error }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "40",
  },
  label: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: "500" },
  valueWrap: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flex: 1, justifyContent: "flex-end" },
  value: { fontSize: FontSize.sm, color: Colors.text, fontWeight: "600", textAlign: "right" },
  badge: {
    backgroundColor: Colors.accent + "15",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: { fontSize: 11, color: Colors.accent, fontWeight: "600" },
});

const actionStyles = StyleSheet.create({
  chip: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: { fontSize: FontSize.sm, color: Colors.text, fontWeight: "500" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark,
  },
  scroll: { paddingBottom: 40 },
  inner: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    padding: Spacing.xl,
  },

  /* Hero */
  hero: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  heroTime: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  countNum: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  countSlash: {
    fontSize: 28,
    color: Colors.textMuted,
    marginHorizontal: 2,
    fontWeight: "300",
  },
  countMax: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  countHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  progressBg: {
    width: "70%",
    height: 6,
    backgroundColor: Colors.darkTertiary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  /* Detail card */
  detailCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* Notes */
  notesCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  notesText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  /* Actions */
  actions: { marginBottom: Spacing.lg },
  secondaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    flexWrap: "wrap",
  },

  /* Chat */
  chatContainer: { flex: 1 },
  chatHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: Spacing.md,
  },
  chatBack: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  chatList: { flexGrow: 1, paddingVertical: Spacing.md },
});
