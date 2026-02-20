import { View, Text, StyleSheet } from "react-native";
import { Link, Stack } from "expo-router";
import { Colors, FontSize, Spacing } from "@/lib/constants";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Link href="/" style={styles.link}>
          Go back home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.dark,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  link: {
    marginTop: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.accent,
  },
});
