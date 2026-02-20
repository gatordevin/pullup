import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Platform,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Colors, Gradient, FontSize, Spacing, BorderRadius } from "@/lib/constants";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const btnFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(btnFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? "Sign in failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow]);

  return (
    <View style={styles.container}>
      {/* Gradient glow at top */}
      <LinearGradient
        colors={["rgba(255,214,10,0.08)", "transparent"]}
        style={styles.glowTop}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: fadeAnim, transform: [{ scale: logoScale }] },
          ]}
        >
          <Image
            source={require("../../assets/logo-horizontal.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[styles.tagline, { opacity: fadeAnim }]}
        >
          Find your game.{"\n"}Pull up.
        </Animated.Text>

        <Animated.Text
          style={[styles.subtitle, { opacity: fadeAnim }]}
        >
          Pickup pickleball & spikeball — organized in seconds.
        </Animated.Text>

        {/* CTA area */}
        <Animated.View
          style={[
            styles.ctaArea,
            { opacity: btnFade, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Google Sign In Button */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={({ pressed }) => [
              styles.googleBtn,
              pressed && styles.googleBtnPressed,
              loading && styles.googleBtnLoading,
            ]}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>
              {loading ? "Signing in..." : "Continue with Google"}
            </Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email sign in link */}
          <Pressable
            onPress={() => router.push("/(auth)/email-login")}
            style={({ pressed }) => [
              styles.emailBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.emailBtnText}>Sign in with email</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Bottom gradient glow */}
      <LinearGradient
        colors={["transparent", "rgba(255,149,0,0.04)"]}
        style={styles.glowBottom}
      />

      {/* Footer */}
      <Text style={styles.footer}>
        By continuing, you agree to our Terms of Service
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  glowTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  glowBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
  },
  logoWrap: {
    marginBottom: Spacing.xxxl,
  },
  logo: {
    width: Math.min(width * 0.6, 280),
    height: 90,
  },
  tagline: {
    fontSize: FontSize.display,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 50,
    letterSpacing: -1,
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxxxl,
    maxWidth: 300,
  },
  ctaArea: {
    width: "100%",
    alignItems: "center",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    width: "100%",
    maxWidth: 340,
    gap: Spacing.md,
  },
  googleBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  googleBtnLoading: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4285F4",
  },
  googleText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.darkTertiary,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.lg,
  },
  emailBtn: {
    borderWidth: 1,
    borderColor: Colors.darkTertiary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xxl,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  emailBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: "500",
  },
  footer: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: "center",
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
  },
});
