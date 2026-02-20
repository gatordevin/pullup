import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "@/lib/constants";
import { formatChatTime } from "@/lib/datetime";

interface ChatMessageProps {
  content: string;
  displayName: string | null;
  createdAt: string;
  isOwn: boolean;
}

export function ChatMessage({ content, displayName, createdAt, isOwn }: ChatMessageProps) {
  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      {!isOwn && (
        <Text style={styles.name}>{displayName ?? "Anonymous"}</Text>
      )}
      <View style={[styles.bubble, isOwn && styles.ownBubble]}>
        <Text style={[styles.text, isOwn && styles.ownText]}>{content}</Text>
      </View>
      <Text style={[styles.time, isOwn && styles.ownTime]}>
        {formatChatTime(createdAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    alignItems: "flex-start",
    paddingHorizontal: Spacing.lg,
  },
  ownContainer: {
    alignItems: "flex-end",
  },
  name: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
    marginLeft: Spacing.xs,
  },
  bubble: {
    backgroundColor: Colors.darkTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxWidth: "80%",
  },
  ownBubble: {
    backgroundColor: Colors.accent,
  },
  text: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  ownText: {
    color: Colors.dark,
  },
  time: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    marginLeft: Spacing.xs,
  },
  ownTime: {
    marginRight: Spacing.xs,
    marginLeft: 0,
  },
});
