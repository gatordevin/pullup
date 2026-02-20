import { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
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
import { supabase } from "@/lib/supabase";

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [sport, setSport] = useState<Sport | null>(null);
  const [skill, setSkill] = useState<SkillLevel | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceed = () => {
    if (step === 0) return displayName.trim().length >= 2 && sport !== null;
    if (step === 1) return skill !== null;
    if (step === 2) return locationId !== null;
    return false;
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError(null);

    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        preferred_sport: sport,
        skill_level: skill,
        favorite_location_id: locationId,
        onboarded: true,
      })
      .eq("id", user!.id);

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    await refreshProfile();
    router.replace("/(tabs)");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progress}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, i <= step && styles.dotActive]}
          />
        ))}
      </View>

      {step === 0 && (
        <View>
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>And what do you play?</Text>

          <Input
            label="Display Name"
            placeholder="e.g. Albert Gator"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={styles.sectionLabel}>Preferred Sport</Text>
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
        </View>
      )}

      {step === 1 && (
        <View>
          <Text style={styles.title}>Skill level?</Text>
          <Text style={styles.subtitle}>No pressure — just for matching</Text>

          <View style={styles.chipRow}>
            {SKILL_LEVELS.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                selected={skill === s.value}
                onPress={() => setSkill(s.value)}
              />
            ))}
          </View>
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={styles.title}>Favorite spot?</Text>
          <Text style={styles.subtitle}>Where do you usually play?</Text>

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
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttons}>
        {step > 0 && (
          <Button
            title="Back"
            onPress={() => setStep(step - 1)}
            variant="outline"
            style={styles.backBtn}
          />
        )}
        <Button
          title={step === 2 ? "Let's go!" : "Next"}
          onPress={handleNext}
          disabled={!canProceed()}
          loading={loading}
          size="lg"
          style={styles.nextBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.xxl,
    paddingTop: 80,
  },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.darkTertiary,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  buttons: {
    flexDirection: "row",
    marginTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  backBtn: {
    flex: 1,
  },
  nextBtn: {
    flex: 2,
  },
});
