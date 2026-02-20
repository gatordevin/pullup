import { Stack } from "expo-router";
import { Colors } from "@/lib/constants";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="email-login" options={{ headerShown: true, title: "", headerStyle: { backgroundColor: Colors.dark }, headerTintColor: Colors.text }} />
      <Stack.Screen name="verify" options={{ headerShown: true, title: "", headerStyle: { backgroundColor: Colors.dark }, headerTintColor: Colors.text }} />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
