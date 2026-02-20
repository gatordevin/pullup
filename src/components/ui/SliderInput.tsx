import React, { createElement } from "react";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "@/lib/constants";

interface SliderInputProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onValueChange: (value: number) => void;
  formatLabel?: (value: number) => string;
  minLabel?: string;
  maxLabel?: string;
}

export function SliderInput({
  min,
  max,
  step,
  value,
  onValueChange,
  formatLabel,
  minLabel,
  maxLabel,
}: SliderInputProps) {
  const label = formatLabel ? formatLabel(value) : String(value);

  const decrement = () => {
    const next = Math.max(min, Math.round((value - step) * 1000) / 1000);
    onValueChange(next);
  };

  const increment = () => {
    const next = Math.min(max, Math.round((value + step) * 1000) / 1000);
    onValueChange(next);
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <Text style={styles.valueLabel}>{label}</Text>
        {createElement("input", {
          type: "range",
          min: String(min),
          max: String(max),
          step: String(step),
          value: String(value),
          onChange: (e: any) => onValueChange(parseFloat(e.target.value)),
          style: {
            width: "100%",
            accentColor: Colors.accent,
            height: 4,
            cursor: "pointer",
            marginTop: 8,
            marginBottom: 4,
          },
        })}
        {(minLabel || maxLabel) && (
          <View style={styles.labelsRow}>
            {minLabel ? <Text style={styles.endLabel}>{minLabel}</Text> : <View />}
            {maxLabel ? <Text style={styles.endLabel}>{maxLabel}</Text> : <View />}
          </View>
        )}
      </View>
    );
  }

  // Native fallback: stepper buttons
  return (
    <View style={styles.container}>
      <Text style={styles.valueLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={decrement}
          style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <View style={styles.stepperSpacer} />
        <Pressable
          onPress={increment}
          style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
      {(minLabel || maxLabel) && (
        <View style={styles.labelsRow}>
          {minLabel ? <Text style={styles.endLabel}>{minLabel}</Text> : <View />}
          {maxLabel ? <Text style={styles.endLabel}>{maxLabel}</Text> : <View />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  valueLabel: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  endLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.darkTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 22,
    color: Colors.text,
    fontWeight: "500",
    lineHeight: 24,
  },
  stepperSpacer: {
    flex: 1,
  },
});
