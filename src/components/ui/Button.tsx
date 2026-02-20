import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradient, BorderRadius, FontSize, Spacing } from "@/lib/constants";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const inner = loading ? (
    <ActivityIndicator
      color={variant === "outline" || variant === "ghost" ? Colors.accent : Colors.dark}
      size="small"
    />
  ) : (
    <Text
      style={[
        styles.text,
        styles[`text_${variant}`],
        styles[`textSize_${size}`],
        textStyle,
      ]}
    >
      {title}
    </Text>
  );

  // Gradient fill for primary variant
  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={[...Gradient.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles[`size_${size}`]]}
        >
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {inner}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  primary: {},
  secondary: {
    backgroundColor: Colors.darkElevated,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  size_sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  size_md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  size_lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontWeight: "700",
  },
  text_primary: {
    color: Colors.dark,
  },
  text_secondary: {
    color: Colors.text,
  },
  text_outline: {
    color: Colors.accent,
  },
  text_ghost: {
    color: Colors.accent,
  },
  textSize_sm: {
    fontSize: FontSize.sm,
  },
  textSize_md: {
    fontSize: FontSize.md,
  },
  textSize_lg: {
    fontSize: FontSize.lg,
  },
});
