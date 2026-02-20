import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, BorderRadius, FontSize, Spacing } from "@/lib/constants";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        placeholderTextColor={Colors.textMuted}
        maxLength={500}
        multiline
        editable={!disabled}
      />
      <TouchableOpacity
        style={[styles.sendBtn, !text.trim() && styles.sendDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || disabled}
      >
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.darkTertiary,
    backgroundColor: Colors.dark,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.darkElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.3,
  },
  sendText: {
    color: Colors.dark,
    fontWeight: "700",
    fontSize: FontSize.sm,
  },
});
