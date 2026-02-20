import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginSchema, type LoginForm } from "@/lib/validators";
import { Colors, FontSize, Spacing } from "@/lib/constants";

export default function EmailLoginScreen() {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        router.push({ pathname: "/(auth)/verify", params: { email: data.email } });
      } else {
        if (!signInLoaded || !signIn) return;
        const result = await signIn.create({ identifier: data.email, password: data.password });
        setLoading(false);
        if (result.status === "complete" && setSignInActive) {
          await setSignInActive({ session: result.createdSessionId });
          router.replace("/");
        }
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.errors?.[0]?.longMessage ?? err?.message ?? "Something went wrong");
    }
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
          <Text style={styles.title}>
            {isSignUp ? "Create account" : "Welcome back"}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp ? "Sign up with your email" : "Sign in with your email"}
          </Text>

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

            <Button
              title={isSignUp ? "Create Account" : "Sign In"}
              onPress={handleSubmit(onSubmit)}
              size="lg"
              loading={loading}
              style={styles.button}
            />

            <Pressable
              onPress={() => { setIsSignUp(!isSignUp); setError(null); }}
              style={{ marginTop: Spacing.lg }}
            >
              <Text style={styles.switchText}>
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <Text style={styles.switchLink}>
                  {isSignUp ? "Sign in" : "Sign up"}
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    padding: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  form: {
    width: "100%",
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.sm,
  },
  switchText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: "center",
  },
  switchLink: {
    color: Colors.accent,
    fontWeight: "600",
  },
});
