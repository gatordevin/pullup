import { useState, createElement } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Pressable,
  Switch,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { copyGameLink } from "@/lib/clipboard";
import {
  Colors,
  Gradient,
  FontSize,
  Spacing,
  BorderRadius,
  SPORTS,
  SKILL_LEVELS,
  UF_LOCATIONS,
  Sport,
  SkillLevel,
  equipmentLabel as getEquipLabel,
} from "@/lib/constants";

let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

const TIME_PRESETS = [
  { label: "Now", emoji: "🔥", minutes: 0 },
  { label: "30 min", emoji: "⏱", minutes: 30 },
  { label: "1 hour", emoji: "🕐", minutes: 60 },
  { label: "2 hours", emoji: "🕑", minutes: 120 },
];

function crossAlert(title: string, message: string, onOk?: () => void) {
  if (Platform.OS === "web") {
    (window as any).alert(`${title}\n${message}`);
    onOk?.();
  } else {
    Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
  }
}

function crossConfirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if ((window as any).confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel" },
      { text: "OK", style: "destructive", onPress: onConfirm },
    ]);
  }
}

export default function CreateGameScreen() {
  const { user } = useAuth();
  const [sport, setSport] = useState<Sport>("pickleball");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("any");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [startsAt, setStartsAt] = useState(new Date(Date.now() + 3600000));
  const [timePreset, setTimePreset] = useState<number | null>(60);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeFlexible, setTimeFlexible] = useState(false);
  const [courtFlexible, setCourtFlexible] = useState(false);
  const [hasEquipment, setHasEquipment] = useState(false);
  const [extraEquipment, setExtraEquipment] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selectTimePreset = (minutes: number) => {
    setTimePreset(minutes);
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    setStartsAt(now);
  };

  const showsEquipment = sport !== "running";

  const handleCreate = async () => {
    if (!user) return;

    if (!courtFlexible && !locationId) {
      crossAlert("Pick a spot", "Select a court or turn on 'Any court works'");
      return;
    }

    setLoading(true);

    type GameRow = { id: string };

    const { data, error } = await supabase
      .from("games")
      .insert({
        host_id: user.id,
        sport,
        skill_level: skillLevel,
        location_id: courtFlexible ? null : locationId,
        starts_at: startsAt.toISOString(),
        max_players: maxPlayers,
        has_equipment: hasEquipment,
        extra_equipment: extraEquipment,
        time_flexible: timeFlexible,
        notes: notes.trim() || null,
      })
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      crossAlert("Error", error.message);
      return;
    }

    const row = data as GameRow | null;
    if (row) {
      await supabase
        .from("game_participants")
        .insert({ game_id: row.id, user_id: user.id, status: "joined" as const });

      await copyGameLink(row.id);
      crossAlert("Game posted!", "Link copied — share it with your group!", () => {
        router.back();
      });
    }
  };

  const eqLabel = getEquipLabel(sport);

  // Web datetime-local input helper
  const toLocalDatetimeStr = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* ── Sport ─────────────────────────────── */}
        <Text style={styles.sectionLabel}>Sport</Text>
        <View style={styles.sportGrid}>
          {SPORTS.map((s) => {
            const sel = sport === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => {
                  setSport(s.value);
                  setHasEquipment(false);
                  setExtraEquipment(false);
                }}
                style={({ pressed }) => [
                  styles.sportCard,
                  sel && styles.sportCardSel,
                  pressed && { opacity: 0.8 },
                ]}
              >
                {sel && (
                  <LinearGradient
                    colors={[...Gradient.brandSubtle]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <Text style={styles.sportEmoji}>{s.emoji}</Text>
                <Text style={[styles.sportLabel, sel && styles.sportLabelSel]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Players ──────────────────────────── */}
        <Text style={styles.sectionLabel}>Players needed</Text>
        <View style={styles.stepperRow}>
          <Pressable
            onPress={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
            style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </Pressable>
          <View style={styles.stepperValue}>
            <Text style={styles.stepperNum}>{maxPlayers}</Text>
            <Text style={styles.stepperUnit}>players</Text>
          </View>
          <Pressable
            onPress={() => setMaxPlayers(Math.min(20, maxPlayers + 1))}
            style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </Pressable>
        </View>

        {/* ── Skill Level ──────────────────────── */}
        <Text style={styles.sectionLabel}>Looking for</Text>
        <View style={styles.chipRow}>
          {SKILL_LEVELS.map((s) => {
            const sel = skillLevel === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => setSkillLevel(s.value)}
                style={[styles.chip, sel && styles.chipSel]}
              >
                <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── When ─────────────────────────────── */}
        <Text style={styles.sectionLabel}>When</Text>
        <View style={styles.chipRow}>
          {TIME_PRESETS.map((p) => {
            const sel = timePreset === p.minutes;
            return (
              <Pressable
                key={p.minutes}
                onPress={() => selectTimePreset(p.minutes)}
                style={[styles.chip, sel && styles.chipSel]}
              >
                <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                  {p.emoji} {p.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              setTimePreset(null);
              if (Platform.OS !== "web") setShowDatePicker(true);
            }}
            style={[styles.chip, timePreset === null && styles.chipSel]}
          >
            <Text style={[styles.chipText, timePreset === null && styles.chipTextSel]}>
              📅 Pick time
            </Text>
          </Pressable>
        </View>

        {/* Web datetime picker */}
        {timePreset === null && Platform.OS === "web" && (
          <View style={styles.webDateRow}>
            {createElement("input", {
              type: "datetime-local",
              value: toLocalDatetimeStr(startsAt),
              min: toLocalDatetimeStr(new Date()),
              onChange: (e: any) => {
                const val = e.target.value;
                if (val) setStartsAt(new Date(val));
              },
              style: {
                backgroundColor: Colors.darkCard,
                color: Colors.text,
                border: `1px solid ${Colors.border}`,
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 16,
                width: "100%",
                outline: "none",
                fontFamily: "inherit",
              },
            })}
          </View>
        )}

        {/* Native date/time pickers */}
        {timePreset === null && Platform.OS !== "web" && (
          <View style={styles.dateRow}>
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePill}>
              <Text style={styles.datePillText}>
                {startsAt.toLocaleDateString(undefined, {
                  weekday: "short", month: "short", day: "numeric",
                })}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowTimePicker(true)} style={styles.datePill}>
              <Text style={styles.datePillText}>
                {startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </Pressable>
          </View>
        )}

        {showDatePicker && DateTimePicker && (
          <DateTimePicker
            value={startsAt}
            mode="date"
            minimumDate={new Date()}
            onChange={(_: any, date: Date | undefined) => {
              setShowDatePicker(Platform.OS === "ios");
              if (date) {
                const u = new Date(startsAt);
                u.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setStartsAt(u);
              }
            }}
          />
        )}
        {showTimePicker && DateTimePicker && (
          <DateTimePicker
            value={startsAt}
            mode="time"
            onChange={(_: any, date: Date | undefined) => {
              setShowTimePicker(Platform.OS === "ios");
              if (date) {
                const u = new Date(startsAt);
                u.setHours(date.getHours(), date.getMinutes());
                setStartsAt(u);
              }
            }}
          />
        )}

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Flexible on time</Text>
            <Text style={styles.toggleHint}>Let others know you're open</Text>
          </View>
          <Switch
            value={timeFlexible}
            onValueChange={setTimeFlexible}
            trackColor={{ false: Colors.darkTertiary, true: Colors.accent + "60" }}
            thumbColor={timeFlexible ? Colors.accent : "#636366"}
          />
        </View>

        {/* ── Where ────────────────────────────── */}
        <Text style={styles.sectionLabel}>Where</Text>
        {!courtFlexible && (
          <View style={styles.chipRow}>
            {UF_LOCATIONS.map((loc) => {
              const sel = locationId === loc.id;
              return (
                <Pressable
                  key={loc.id}
                  onPress={() => setLocationId(loc.id)}
                  style={[styles.chip, sel && styles.chipSel]}
                >
                  <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                    📍 {loc.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Any court works</Text>
            <Text style={styles.toggleHint}>You're flexible on location</Text>
          </View>
          <Switch
            value={courtFlexible}
            onValueChange={(v) => {
              setCourtFlexible(v);
              if (v) setLocationId(null);
            }}
            trackColor={{ false: Colors.darkTertiary, true: Colors.accent + "60" }}
            thumbColor={courtFlexible ? Colors.accent : "#636366"}
          />
        </View>

        {/* ── Equipment ────────────────────────── */}
        {showsEquipment && (
          <>
            <Text style={styles.sectionLabel}>Equipment</Text>
            <View style={styles.equipCard}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>I have {eqLabel}</Text>
                  <Text style={styles.toggleHint}>You'll bring your own gear</Text>
                </View>
                <Switch
                  value={hasEquipment}
                  onValueChange={setHasEquipment}
                  trackColor={{ false: Colors.darkTertiary, true: Colors.accent + "60" }}
                  thumbColor={hasEquipment ? Colors.accent : "#636366"}
                />
              </View>
              <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>I have extras to share</Text>
                  <Text style={styles.toggleHint}>Extra gear for others</Text>
                </View>
                <Switch
                  value={extraEquipment}
                  onValueChange={setExtraEquipment}
                  trackColor={{ false: Colors.darkTertiary, true: Colors.accent + "60" }}
                  thumbColor={extraEquipment ? Colors.accent : "#636366"}
                />
              </View>
            </View>
          </>
        )}

        {/* ── Notes ────────────────────────────── */}
        <Text style={styles.sectionLabel}>
          Notes <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything players should know..."
          placeholderTextColor={Colors.textMuted}
          maxLength={200}
          multiline
          numberOfLines={3}
        />

        {/* ── Submit ───────────────────────────── */}
        <View style={styles.submitArea}>
          <Button
            title="Post Game"
            onPress={handleCreate}
            size="lg"
            loading={loading}
            style={{ width: "100%" } as any}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  content: { paddingBottom: 60 },
  inner: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: Spacing.xl,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.xxl,
  },
  optional: { textTransform: "none", fontWeight: "400", letterSpacing: 0 },

  /* Sport 2x2 grid */
  sportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  sportCard: {
    flexBasis: "48%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.darkCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  sportCardSel: { borderColor: Colors.accent },
  sportEmoji: { fontSize: 32, marginBottom: Spacing.xs },
  sportLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  sportLabelSel: { color: Colors.text },

  /* Stepper */
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  stepperBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.darkCard,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  stepperBtnText: { fontSize: 28, color: Colors.text, fontWeight: "500", lineHeight: 30 },
  stepperValue: { alignItems: "center", minWidth: 80 },
  stepperNum: { fontSize: 40, fontWeight: "800", color: Colors.text, fontVariant: ["tabular-nums"] },
  stepperUnit: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  /* Chips */
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipSel: {
    backgroundColor: Colors.accent + "18",
    borderColor: Colors.accent + "80",
  },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: "500" },
  chipTextSel: { color: Colors.accent, fontWeight: "600" },

  /* Date row */
  dateRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md },
  datePill: {
    flex: 1, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkCard,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: "center",
  },
  datePillText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: "500" },
  webDateRow: { marginTop: Spacing.md },

  /* Toggles */
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "40",
  },
  toggleInfo: { flex: 1, marginRight: Spacing.md },
  toggleLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: "500" },
  toggleHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  equipCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },

  notesInput: {
    backgroundColor: Colors.darkCard,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 88,
    textAlignVertical: "top",
  },

  submitArea: { marginTop: Spacing.xxxl, paddingBottom: Spacing.xxl },
});
