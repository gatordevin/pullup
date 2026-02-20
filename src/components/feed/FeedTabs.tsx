import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "@/lib/constants";

interface FeedTabsProps {
  active: "upcoming" | "my";
  onChange: (tab: "upcoming" | "my") => void;
}

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <View style={styles.container}>
      {(["upcoming", "my"] as const).map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, active === tab && styles.activeTab]}
          onPress={() => onChange(tab)}
        >
          <Text style={[styles.text, active === tab && styles.activeText]}>
            {tab === "upcoming" ? "Upcoming" : "My Games"}
          </Text>
          {active === tab && <View style={styles.indicator} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    paddingBottom: Spacing.md,
    position: "relative",
  },
  activeTab: {},
  text: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  activeText: {
    color: Colors.text,
  },
  indicator: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
  },
});
