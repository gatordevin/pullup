import { Tabs } from "expo-router";
import { Text } from "react-native";
import { Colors } from "@/lib/constants";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.darkElevated,
          borderTopColor: Colors.darkTertiary,
          borderTopWidth: 0.5,
        },
        headerStyle: { backgroundColor: Colors.dark },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Games",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏓</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
