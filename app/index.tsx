import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/lib/constants";

export default function Index() {
  const { session, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace("/(auth)/login");
    } else if (!profile?.onboarded) {
      router.replace("/(auth)/onboarding");
    } else {
      router.replace("/(tabs)");
    }
  }, [session, profile, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark,
  },
});
