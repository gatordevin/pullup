import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Colors, FontSize, Spacing, BorderRadius } from "@/lib/constants";

interface Msg {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

export function ChatPreview({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("id, content, user_id, created_at, profiles(display_name)")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setMessages((data as unknown as Msg[]).reverse());
  }, [gameId]);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`preview-${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `game_id=eq.${gameId}` },
        () => fetchMessages()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [gameId, fetchMessages]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t || !user) return;
    setSending(true);
    setText("");
    await supabase.from("messages").insert({ game_id: gameId, user_id: user.id, content: t });
    setSending(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={styles.header}
      >
        <Text style={styles.headerText}>
          💬 {messages.length > 0 ? `${messages.length} message${messages.length === 1 ? "" : "s"}` : "Chat"}
        </Text>
        <Text style={styles.arrow}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          {messages.length === 0 && (
            <Text style={styles.empty}>No messages yet — be the first!</Text>
          )}
          {messages.map((m) => (
            <View key={m.id} style={styles.msgRow}>
              <Text style={styles.msgName}>
                {m.user_id === user?.id ? "You" : m.profiles?.display_name ?? "Anon"}
              </Text>
              <Text style={styles.msgText}>{m.content}</Text>
            </View>
          ))}

          {user && (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Say something..."
                placeholderTextColor={Colors.textMuted}
                maxLength={200}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <Pressable
                onPress={handleSend}
                disabled={!text.trim() || sending}
                style={({ pressed }) => [
                  styles.sendBtn,
                  (!text.trim() || sending) && { opacity: 0.3 },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.sendText}>↑</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.darkElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  headerText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: "600" },
  arrow: { fontSize: 10, color: Colors.textMuted },

  body: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  empty: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: "italic", marginBottom: Spacing.sm },

  msgRow: {
    flexDirection: "row",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  msgName: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: "700",
    marginRight: 6,
  },
  msgText: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: FontSize.xs,
    color: Colors.text,
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: Colors.dark, fontWeight: "800", fontSize: 14 },
});
