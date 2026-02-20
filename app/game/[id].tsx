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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { useGame } from "@/hooks/useGame";
import { useGameChat } from "@/hooks/useGameChat";
import { JoinButton } from "@/components/game/JoinButton";
import { RosterList } from "@/components/game/RosterList";
import { ChatMessage } from "@/components/game/ChatMessage";
import { ChatInput } from "@/components/game/ChatInput";
import { SportIcon } from "@/components/game/SportIcon";
import { Button } from "@/components/ui/Button";
import { copyGameLink } from "@/lib/clipboard";
import { formatGameTime } from "@/lib/datetime";
import { supabase } from "@/lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius } from "@/lib/constants";

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

  const handleCancel = () => {
    Alert.alert("Cancel Game", "Are you sure?", [
      { text: "No" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("games")
            .update({ status: "cancelled" as const })
            .eq("id", game.id);
          router.back();
        },
      },
    ]);
  };

  const handleShare = async () => {
    await copyGameLink(game.id);
    Alert.alert("Copied!", "Game link copied to clipboard");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {!showChat ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <SportIcon sport={game.sport} size={48} />
            <View style={styles.headerInfo}>
              <Text style={styles.sportName}>
                {game.sport === "pickleball" ? "Pickleball" : "Spikeball"}
              </Text>
              <Text style={styles.skillBadge}>{game.skill_level}</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countNumber}>
                {game.current_players}/{game.max_players}
              </Text>
              <Text style={styles.countLabel}>players</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{game.locations?.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🕐</Text>
              <Text style={styles.detailText}>{formatGameTime(game.starts_at)}</Text>
            </View>
            {game.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📝</Text>
                <Text style={styles.detailText}>{game.notes}</Text>
              </View>
            )}
          </View>

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

          <View style={styles.secondaryActions}>
            <Button
              title="💬 Chat"
              onPress={() => setShowChat(true)}
              variant="secondary"
              size="sm"
            />
            <Button
              title="🔗 Share"
              onPress={handleShare}
              variant="secondary"
              size="sm"
            />
            {isHost && (
              <Button
                title="Cancel Game"
                onPress={handleCancel}
                variant="ghost"
                size="sm"
                textStyle={{ color: Colors.error }}
              />
            )}
          </View>

          {/* Roster */}
          <RosterList participants={participants} hostId={game.host_id} />
        </ScrollView>
      ) : (
        /* Chat View */
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Button
              title="← Back to details"
              onPress={() => setShowChat(false)}
              variant="ghost"
              size="sm"
            />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark,
  },
  scroll: {
    padding: Spacing.xxl,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  sportName: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.text,
  },
  skillBadge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  countBox: {
    alignItems: "center",
    backgroundColor: Colors.accent + "15",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  countNumber: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.accent,
  },
  countLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  detailCard: {
    backgroundColor: Colors.darkElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.darkTertiary,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: Spacing.md,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  actions: {
    marginBottom: Spacing.lg,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: "wrap",
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkTertiary,
    padding: Spacing.sm,
  },
  chatList: {
    flexGrow: 1,
    paddingVertical: Spacing.md,
  },
});
