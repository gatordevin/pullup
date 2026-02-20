import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";

interface Participant {
  user_id: string;
  profiles: { display_name: string | null } | null;
}

interface RosterListProps {
  participants: Participant[];
  hostId: string;
}

export function RosterList({ participants, hostId }: RosterListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Players ({participants.length})
      </Text>
      {participants.map((p) => (
        <View key={p.user_id} style={styles.row}>
          <Avatar name={p.profiles?.display_name ?? null} size={32} />
          <Text style={styles.name}>
            {p.profiles?.display_name ?? "Anonymous"}
          </Text>
          {p.user_id === hostId && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostText}>HOST</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkTertiary,
  },
  name: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  hostBadge: {
    backgroundColor: Colors.accent + "25",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.accent,
  },
});
