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
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as WebBrowser from "expo-web-browser";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginSchema, type LoginForm } from "@/lib/validators";
import { Colors, FontSize, Spacing, BorderRadius } from "@/lib/constants";
import { consumePendingRedirect } from "@/lib/redirectStore";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { redirect: redirectParam } = useLocalSearchParams<{ redirect?: string }>();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        if (!signUpLoaded || !signUp) return;
        await signUp.create({ emailAddress: data.email, password: data.password });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setLoading(false);
        router.push({ pathname: "/(auth)/verify", params: { email: data.email, redirect: redirectParam ?? "" } });
      } else {
        if (!signInLoaded || !signIn) return;
        const result = await signIn.create({ identifier: data.email, password: data.password });
        setLoading(false);
        if (result.status === "complete" && setSignInActive) {
          await setSignInActive({ session: result.createdSessionId });
          const redirect = consumePendingRedirect() ?? redirectParam;
          router.replace((redirect as any) ?? "/");
        }
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.errors?.[0]?.longMessage ?? err?.message ?? "Something went wrong");
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        const redirect = consumePendingRedirect() ?? redirectParam;
        router.replace((redirect as any) ?? "/");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.message ?? "Sign in failed");
    } finally {
      setGoogleLoading(false);
    }
  }, [startOAuthFlow]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["rgba(255,214,10,0.08)", "transparent"]}
        style={styles.glowTop}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Logo */}
          <Image
            source={require("../../assets/logo-horizontal.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Segmented control */}
          <View style={styles.segmented}>
            <Pressable
              onPress={() => { setIsSignUp(false); setError(null); }}
              style={[styles.segmentBtn, !isSignUp && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, !isSignUp && styles.segmentTextActive]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setIsSignUp(true); setError(null); }}
              style={[styles.segmentBtn, isSignUp && styles.segmentBtnActiveGreen]}
            >
              <Text style={[styles.segmentText, isSignUp && styles.segmentTextActive]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          <Text style={styles.tagline}>
            {isSignUp ? "Join PullUp" : "Welcome back"}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp ? "Create your free account" : "Sign in to your account"}
          </Text>

          {/* Email / Password form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@email.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="At least 8 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  textContentType="password"
                />
              )}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              style={({ pressed }) => [
                styles.mainBtn,
                { backgroundColor: isSignUp ? "#30D158" : Colors.accent },
                pressed && { opacity: 0.85 },
                loading && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.mainBtnText}>
                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
              </Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              style={({ pressed }) => [
                styles.googleBtn,
                pressed && { opacity: 0.85 },
                googleLoading && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>
                {googleLoading ? "Signing in..." : "Continue with Google"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  glowTop: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 300,
    zIndex: 0,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
    alignItems: "center",
  },
  logo: {
    width: Math.min(width * 0.55, 240),
    height: 70,
    marginBottom: Spacing.xxl,
  },
  tagline: {
    fontSize: FontSize.xxxl,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.xl,
    padding: 3,
    marginBottom: Spacing.xxl,
    width: "100%",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.xl - 2,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: Colors.accent,
  },
  segmentBtnActiveGreen: {
    backgroundColor: "#30D158",
  },
  segmentText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.dark,
    fontWeight: "700",
  },
  form: { width: "100%" },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  mainBtn: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
    width: "100%",
  },
  mainBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.dark,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.darkTertiary },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.lg,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    width: "100%",
    gap: Spacing.md,
  },
  googleIcon: { fontSize: 18, fontWeight: "800", color: "#4285F4" },
  googleText: { fontSize: FontSize.sm, fontWeight: "600", color: "#1A1A1A" },
});
