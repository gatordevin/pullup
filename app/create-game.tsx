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
  Modal,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { SliderInput } from "@/components/ui/SliderInput";
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
  getSkillLevels,
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
  { label: "1 hr", emoji: "🕐", minutes: 60 },
  { label: "2 hr", emoji: "🕑", minutes: 120 },
];

function formatPace(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}/mi`;
}

function crossAlert(title: string, msg: string, onOk?: () => void) {
  if (Platform.OS === "web") {
    (window as any).alert(`${title}\n${msg}`);
    onOk?.();
  } else {
    Alert.alert(title, msg, [{ text: "OK", onPress: onOk }]);
  }
}

export default function CreateGameScreen() {
  const { user, guestLogin } = useAuth();

  // Guest prompt state
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  const [sport, setSport] = useState<Sport>("pickleball");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("any");
  const [startsAt, setStartsAt] = useState(new Date(Date.now() + 1800000));
  const [timePreset, setTimePreset] = useState<number | null>(30);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeFlexible, setTimeFlexible] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [courtFlexible, setCourtFlexible] = useState(true);
  const [hasEquipment, setHasEquipment] = useState(false);
  const [extraEquipment, setExtraEquipment] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Running: distance in miles, pace in seconds per mile
  const [distance, setDistance] = useState(3);
  const [paceSeconds, setPaceSeconds] = useState(510); // 8:30/mi

  const isRunning = sport === "running";
  const isBallSport = !isRunning;
  const lookingFor = maxPlayers - 1;

  const selectTimePreset = (minutes: number) => {
    setTimePreset(minutes);
    setTimeFlexible(false);
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    setStartsAt(now);
  };

  const toggleTimeFlexible = (v: boolean) => {
    setTimeFlexible(v);
    if (v) setTimePreset(null);
  };

  const handleGuestSubmit = async () => {
    if (guestName.trim().length < 2) {
      crossAlert("Name required", "Please enter your name (at least 2 characters)");
      return;
    }
    if (!guestEmail.trim() || !guestEmail.includes("@")) {
      crossAlert("Email required", "Please enter a valid email");
      return;
    }
    setGuestLoading(true);
    const guestId = await guestLogin(guestName.trim(), guestEmail.trim());
    setGuestLoading(false);
    setShowGuestPrompt(false);
    // Auto-create the game with the new guest ID
    await createGame(guestId);
  };

  const handleCreate = async () => {
    if (!user) {
      setShowGuestPrompt(true);
      return;
    }
    await createGame(user.id);
  };

  const createGame = async (userId: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("games")
      .insert({
        host_id: userId,
        sport,
        skill_level: skillLevel,
        location_id: courtFlexible ? null : locationId,
        starts_at: startsAt.toISOString(),
        max_players: maxPlayers,
        has_equipment: isBallSport ? hasEquipment : false,
        extra_equipment: isBallSport ? extraEquipment : false,
        time_flexible: timeFlexible,
        distance_miles: isRunning ? distance : null,
        pace: isRunning ? formatPace(paceSeconds) : null,
        notes: notes.trim() || null,
      })
      .select("id")
      .single();

    setLoading(false);
    if (error) { crossAlert("Error", error.message); return; }

    const row = data as { id: string } | null;
    if (row) {
      await supabase.from("game_participants")
        .insert({ game_id: row.id, user_id: userId, status: "joined" as const });
      await copyGameLink(row.id);
      crossAlert("Game posted!", "Link copied — share it!", () => router.back());
    }
  };

  const toLocalDatetimeStr = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>
        {/* ═══ Sport ═══ */}
        <Text style={styles.sectionLabel}>What are you playing?</Text>
        <View style={styles.sportGrid}>
          {SPORTS.map((s) => {
            const sel = sport === s.value;
            return (
              <Pressable key={s.value}
                onPress={() => { setSport(s.value); setMaxPlayers(s.maxPlayersDefault); setHasEquipment(false); setExtraEquipment(false); setShowMore(false); setSkillLevel("any"); }}
                style={({ pressed }) => [styles.sportCard, sel && styles.sportCardSel, pressed && { opacity: 0.8 }]}>
                {sel && <LinearGradient colors={[...Gradient.brandSubtle]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />}
                <Text style={styles.sportEmoji}>{s.emoji}</Text>
                <Text style={[styles.sportLabel, sel && styles.sportLabelSel]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ═══ PRIMARY FIELDS ═══ */}
        {isRunning ? (
          <>
            <Text style={styles.sectionLabel}>Distance</Text>
            <View style={styles.sliderCard}>
              <SliderInput
                min={0.5} max={15} step={0.5} value={distance}
                onValueChange={setDistance}
                formatLabel={(v) => `${v} mi`}
                minLabel="0.5 mi" maxLabel="15 mi"
              />
            </View>

            <Text style={styles.sectionLabel}>Pace</Text>
            <View style={styles.sliderCard}>
              <SliderInput
                min={300} max={780} step={15} value={paceSeconds}
                onValueChange={setPaceSeconds}
                formatLabel={formatPace}
                minLabel="5:00/mi (fast)" maxLabel="13:00/mi (easy)"
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              Looking for {lookingFor} more player{lookingFor === 1 ? "" : "s"}
            </Text>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}>
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <View style={styles.stepperValue}>
                <Text style={styles.stepperNum}>{lookingFor}</Text>
                <Text style={styles.stepperUnit}>more</Text>
              </View>
              <Pressable onPress={() => setMaxPlayers(Math.min(20, maxPlayers + 1))}
                style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}>
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Skill level</Text>
            <View style={styles.chipRow}>
              {getSkillLevels(sport).map((s) => {
                const sel = skillLevel === s.value;
                return (
                  <Pressable key={s.value} onPress={() => setSkillLevel(s.value)}
                    style={[styles.chip, sel && styles.chipSel]}>
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* ═══ CUSTOMIZE ═══ */}
        <Pressable onPress={() => setShowMore(!showMore)}
          style={({ pressed }) => [styles.customizeBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.customizeText}>{showMore ? "▲ Less options" : "▼ Customize details"}</Text>
        </Pressable>

        {showMore && (
          <View style={styles.moreSection}>
            {isRunning && (
              <>
                <Text style={styles.sectionLabel}>Group size</Text>
                <View style={styles.stepperRow}>
                  <Pressable onPress={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                    style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <View style={styles.stepperValue}>
                    <Text style={styles.stepperNum}>{lookingFor}</Text>
                    <Text style={styles.stepperUnit}>more</Text>
                  </View>
                  <Pressable onPress={() => setMaxPlayers(Math.min(20, maxPlayers + 1))}
                    style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
              </>
            )}

            <Text style={styles.sectionLabel}>When</Text>
            {!timeFlexible && (
              <View style={styles.chipRow}>
                {TIME_PRESETS.map((p) => {
                  const sel = timePreset === p.minutes;
                  return (
                    <Pressable key={p.minutes} onPress={() => selectTimePreset(p.minutes)}
                      style={[styles.chip, sel && styles.chipSel]}>
                      <Text style={[styles.chipText, sel && styles.chipTextSel]}>{p.emoji} {p.label}</Text>
                    </Pressable>
                  );
                })}
                <Pressable onPress={() => { setTimePreset(null); if (Platform.OS !== "web") setShowDatePicker(true); }}
                  style={[styles.chip, timePreset === null && !timeFlexible && styles.chipSel]}>
                  <Text style={[styles.chipText, timePreset === null && !timeFlexible && styles.chipTextSel]}>📅 Pick</Text>
                </Pressable>
              </View>
            )}
            {timePreset === null && !timeFlexible && Platform.OS === "web" && (
              <View style={styles.webDateRow}>
                {createElement("input", {
                  type: "datetime-local", value: toLocalDatetimeStr(startsAt), min: toLocalDatetimeStr(new Date()),
                  onChange: (e: any) => { if (e.target.value) setStartsAt(new Date(e.target.value)); },
                  style: { backgroundColor: Colors.darkCard, color: Colors.text, border: `1px solid ${Colors.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 16, width: "100%", outline: "none" },
                })}
              </View>
            )}
            {timePreset === null && !timeFlexible && Platform.OS !== "web" && (
              <View style={styles.dateRow}>
                <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePill}>
                  <Text style={styles.datePillText}>{startsAt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</Text>
                </Pressable>
                <Pressable onPress={() => setShowTimePicker(true)} style={styles.datePill}>
                  <Text style={styles.datePillText}>{startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                </Pressable>
              </View>
            )}
            {showDatePicker && DateTimePicker && <DateTimePicker value={startsAt} mode="date" minimumDate={new Date()} onChange={(_: any, d: Date | undefined) => { setShowDatePicker(Platform.OS === "ios"); if (d) { const u = new Date(startsAt); u.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); setStartsAt(u); } }} />}
            {showTimePicker && DateTimePicker && <DateTimePicker value={startsAt} mode="time" onChange={(_: any, d: Date | undefined) => { setShowTimePicker(Platform.OS === "ios"); if (d) { const u = new Date(startsAt); u.setHours(d.getHours(), d.getMinutes()); setStartsAt(u); } }} />}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Flexible on time</Text>
              <Switch value={timeFlexible} onValueChange={toggleTimeFlexible} trackColor={{ false: Colors.darkTertiary, true: Colors.accent + "60" }} thumbColor={timeFlexible ? Colors.accent : "#636366"} />
            </View>

            <Text style={styles.sectionLabel}>{isRunning ? "Meeting point" : "Where"}</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{isRunning ? "Flexible on start point" : "Any court works"}</Text>
              <Switch value={courtFlexible} onValueChange={(v) => { setCourtFlexible(v); if (v) setLocationId(null); }} trackColor={{ false: Colors.darkTertiary, true: Colors.accent + "60" }} thumbColor={courtFlexible ? Colors.accent : "#636366"} />
            </View>
            {!courtFlexible && (
              <View style={[styles.chipRow, { marginTop: Spacing.sm }]}>
                {UF_LOCATIONS.map((loc) => {
                  const sel = locationId === loc.id;
                  return (
                    <Pressable key={loc.id} onPress={() => setLocationId(loc.id)} style={[styles.chip, sel && styles.chipSel]}>
                      <Text style={[styles.chipText, sel && styles.chipTextSel]}>📍 {loc.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {isBallSport && (
              <>
                <Text style={styles.sectionLabel}>Equipment</Text>
                <View style={styles.equipCard}>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>I have {getEquipLabel(sport)}</Text>
                    <Switch value={hasEquipment} onValueChange={setHasEquipment} trackColor={{ false: Colors.darkTertiary, true: Colors.accent + "60" }} thumbColor={hasEquipment ? Colors.accent : "#636366"} />
                  </View>
                  <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.toggleLabel}>Extras to share</Text>
                    <Switch value={extraEquipment} onValueChange={setExtraEquipment} trackColor={{ false: Colors.darkTertiary, true: Colors.accent + "60" }} thumbColor={extraEquipment ? Colors.accent : "#636366"} />
                  </View>
                </View>
              </>
            )}

            <Text style={styles.sectionLabel}>Notes <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput style={styles.notesInput} value={notes} onChangeText={setNotes} placeholder="Anything players should know..." placeholderTextColor={Colors.textMuted} maxLength={200} multiline numberOfLines={3} />
          </View>
        )}

        <View style={styles.submitArea}>
          <Button title={user ? "Post Game" : "Post Game (Quick Join)"} onPress={handleCreate} size="lg" loading={loading} style={{ width: "100%" } as any} />
        </View>
      </View>

      {/* Guest prompt modal */}
      <Modal
        visible={showGuestPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuestPrompt(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGuestPrompt(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Quick Setup</Text>
            <Text style={styles.modalSubtitle}>Enter your name and email to post</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              maxLength={30}
            />

            <Text style={styles.modalLabel}>Email</Text>
            <TextInput
              style={styles.modalInput}
              value={guestEmail}
              onChangeText={setGuestEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={100}
            />

            <Pressable
              onPress={handleGuestSubmit}
              style={({ pressed }) => [styles.modalSubmitBtn, pressed && { opacity: 0.8 }]}
            >
              <LinearGradient
                colors={[...Gradient.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
              />
              <Text style={styles.modalSubmitText}>{guestLoading ? "Setting up..." : "Let's Go"}</Text>
            </Pressable>

            <Pressable onPress={() => { setShowGuestPrompt(false); router.push("/(auth)/login"); }} style={styles.modalLoginLink}>
              <Text style={styles.modalLoginText}>Have an account? Log in</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  content: { paddingBottom: 60 },
  inner: { maxWidth: 560, width: "100%", alignSelf: "center", paddingHorizontal: Spacing.xl },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: Spacing.md, marginTop: Spacing.xxl },
  optional: { textTransform: "none", fontWeight: "400", letterSpacing: 0 },
  sportGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  sportCard: { flexBasis: "48%", flexGrow: 1, alignItems: "center", paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.darkCard, borderWidth: 1.5, borderColor: Colors.border, overflow: "hidden" },
  sportCardSel: { borderColor: Colors.accent },
  sportEmoji: { fontSize: 32, marginBottom: Spacing.xs },
  sportLabel: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textSecondary },
  sportLabelSel: { color: Colors.text },
  sliderCard: { backgroundColor: Colors.darkCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  customizeBtn: { alignSelf: "center", paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  customizeText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: "600" },
  moreSection: { marginBottom: Spacing.sm },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.xxl, paddingVertical: Spacing.sm },
  stepperBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  stepperBtnText: { fontSize: 24, color: Colors.text, fontWeight: "500", lineHeight: 26 },
  stepperValue: { alignItems: "center", minWidth: 60 },
  stepperNum: { fontSize: 36, fontWeight: "800", color: Colors.text, fontVariant: ["tabular-nums"] },
  stepperUnit: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.full, backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.border },
  chipSel: { backgroundColor: Colors.accent + "18", borderColor: Colors.accent + "80" },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: "500" },
  chipTextSel: { color: Colors.accent, fontWeight: "600" },
  dateRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md },
  datePill: { flex: 1, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  datePillText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: "500" },
  webDateRow: { marginTop: Spacing.md },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border + "40" },
  toggleLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: "500", flex: 1 },
  equipCard: { backgroundColor: Colors.darkCard, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  notesInput: { backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: Spacing.lg, fontSize: FontSize.md, color: Colors.text, minHeight: 80, textAlignVertical: "top" },
  submitArea: { marginTop: Spacing.xl, paddingBottom: Spacing.xxl },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  modalCard: { backgroundColor: Colors.darkElevated, borderRadius: BorderRadius.lg, padding: Spacing.xxl, width: "100%", maxWidth: 400, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.text, textAlign: "center", marginBottom: Spacing.xs },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center", marginBottom: Spacing.xxl },
  modalLabel: { fontSize: 12, fontWeight: "600", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.md },
  modalInput: { backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.text },
  modalSubmitBtn: { borderRadius: BorderRadius.md, overflow: "hidden", paddingVertical: Spacing.md + 2, alignItems: "center", marginTop: Spacing.xxl },
  modalSubmitText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.dark },
  modalLoginLink: { alignItems: "center", marginTop: Spacing.lg, paddingVertical: Spacing.sm },
  modalLoginText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: "500" },
});
