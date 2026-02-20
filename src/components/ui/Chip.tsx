import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, BorderRadius, FontSize, Spacing } from "@/lib/constants";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkElevated,
    borderWidth: 1,
    borderColor: Colors.darkTertiary,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  selected: {
    backgroundColor: Colors.accent + "20",
    borderColor: Colors.accent,
  },
  text: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  selectedText: {
    color: Colors.accent,
    fontWeight: "600",
  },
});
