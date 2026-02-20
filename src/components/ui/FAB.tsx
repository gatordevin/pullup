import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradient, Spacing } from "@/lib/constants";

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={[...Gradient.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fab}
      >
        <Text style={styles.icon}>+</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: Spacing.xxl,
    right: Spacing.xxl,
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  icon: {
    color: Colors.dark,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 30,
  },
});
