import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { TokenCache } from "@clerk/clerk-expo";

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      if (Platform.OS === "web") return null;
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      if (Platform.OS === "web") return;
      try {
        await SecureStore.setItemAsync(key, token);
      } catch {
        // Silently fail
      }
    },
    clearToken: async (key: string) => {
      if (Platform.OS === "web") return;
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // Silently fail
      }
    },
  };
};

export const tokenCache = createTokenCache();
