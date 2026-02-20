import { useEffect } from "react";
import { Stack } from "expo-router";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/providers/AuthProvider";
import { tokenCache } from "@/lib/clerk";
import { Colors } from "@/lib/constants";

SplashScreen.preventAutoHideAsync();

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.dark },
              headerTintColor: Colors.text,
              headerTitleStyle: { fontWeight: "700" },
              contentStyle: { backgroundColor: Colors.dark },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="create-game"
              options={{
                presentation: "modal",
                title: "Create Game",
                headerStyle: { backgroundColor: Colors.darkElevated },
              }}
            />
            <Stack.Screen
              name="game/[id]"
              options={{
                title: "Game Details",
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
