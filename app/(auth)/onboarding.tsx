import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors, FontSize, Spacing } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (displayName.trim().length < 2) return;
    setLoading(true);
    setError(null);

    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>What should we call you?</Text>
          <Text style={styles.subtitle}>Pick a name others will see</Text>

          <Input
            label="Display Name"
            placeholder="e.g. Albert Gator"
            value={displayName}
            onChangeText={setDisplayName}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            title="Let's go!"
            onPress={handleSubmit}
            disabled={displayName.trim().length < 2}
            loading={loading}
            size="lg"
            style={styles.btn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  scroll: { flexGrow: 1, justifyContent: "center" },
  content: {
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    padding: Spacing.xxl,
  },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  btn: { marginTop: Spacing.xxl },
});
