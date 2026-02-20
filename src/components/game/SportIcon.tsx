import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/lib/constants";
import type { Sport } from "@/lib/constants";

interface SportIconProps {
  sport: Sport;
  size?: number;
}

const SPORT_CONFIG = {
  pickleball: { emoji: "🏓", bg: Colors.accent },
  spikeball: { emoji: "🔵", bg: Colors.secondary },
};

export function SportIcon({ sport, size = 36 }: SportIconProps) {
  const config = SPORT_CONFIG[sport];
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: config.bg + "20",
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{config.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
