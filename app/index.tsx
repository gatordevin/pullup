import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/lib/constants";
import { consumePendingRedirect } from "@/lib/redirectStore";

export default function Index() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const redirect = consumePendingRedirect();
    if (redirect) {
      router.replace(redirect as any);
    } else {
      // Everyone goes to the feed — login is not required
      router.replace("/(tabs)");
    }
  }, [isLoading]);

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
