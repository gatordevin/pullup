import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { supabase } from "@/lib/supabase";
import { copyGameLink } from "@/lib/clipboard";
import {
  Colors,
  FontSize,
  Spacing,
  SPORTS,
  SKILL_LEVELS,
  UF_LOCATIONS,
  Sport,
  SkillLevel,
} from "@/lib/constants";

export default function CreateGameScreen() {
  const { user } = useAuth();
  const [sport, setSport] = useState<Sport>("pickleball");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("any");
  const [locationId, setLocationId] = useState<string>("");
  const [startsAt, setStartsAt] = useState(new Date(Date.now() + 3600000));
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleCreate = async () => {
    if (!user || !locationId) return;

    const max = parseInt(maxPlayers, 10);
    if (isNaN(max) || max < 2 || max > 20) {
      Alert.alert("Error", "Max players must be between 2 and 20");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("games")
      .insert({
        host_id: user.id,
        sport,
        skill_level: skillLevel,
        location_id: locationId,
        starts_at: startsAt.toISOString(),
        max_players: max,
        notes: notes.trim() || null,
      })
      .select("id")
      .single();

    type GameRow = { id: string };

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    const row = data as GameRow | null;
    if (row) {
      await supabase
        .from("game_participants")
        .insert({ game_id: row.id, user_id: user.id, status: "joined" as const });

      await copyGameLink(row.id);
      Alert.alert(
        "Game created!",
        "Link copied to clipboard — share it on GroupMe!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Sport</Text>
      <View style={styles.chipRow}>
        {SPORTS.map((s) => (
          <Chip
            key={s.value}
            label={`${s.emoji} ${s.label}`}
            selected={sport === s.value}
            onPress={() => setSport(s.value)}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Skill Level</Text>
      <View style={styles.chipRow}>
        {SKILL_LEVELS.map((s) => (
          <Chip
            key={s.value}
            label={s.label}
            selected={skillLevel === s.value}
            onPress={() => setSkillLevel(s.value)}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Location</Text>
      <View style={styles.chipRow}>
        {UF_LOCATIONS.map((loc) => (
          <Chip
            key={loc.id}
            label={loc.name}
            selected={locationId === loc.id}
            onPress={() => setLocationId(loc.id)}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Date & Time</Text>
      <View style={styles.dateRow}>
        <Button
          title={startsAt.toLocaleDateString()}
          onPress={() => setShowDatePicker(true)}
          variant="outline"
          size="sm"
        />
        <Button
          title={startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          onPress={() => setShowTimePicker(true)}
          variant="outline"
          size="sm"
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={startsAt}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, date) => {
            setShowDatePicker(Platform.OS === "ios");
            if (date) {
              const updated = new Date(startsAt);
              updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
              setStartsAt(updated);
            }
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={startsAt}
          mode="time"
          onChange={(_, date) => {
            setShowTimePicker(Platform.OS === "ios");
            if (date) {
              const updated = new Date(startsAt);
              updated.setHours(date.getHours(), date.getMinutes());
              setStartsAt(updated);
            }
          }}
        />
      )}

      <Input
        label="Max Players"
        value={maxPlayers}
        onChangeText={setMaxPlayers}
        keyboardType="number-pad"
        placeholder="4"
      />

      <Input
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Bringing extra paddles!"
        maxLength={200}
        multiline
      />

      <Button
        title="Create Game"
        onPress={handleCreate}
        size="lg"
        loading={loading}
        disabled={!locationId}
        style={styles.createBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  content: {
    padding: Spacing.xxl,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  createBtn: {
    marginTop: Spacing.xxl,
  },
});
