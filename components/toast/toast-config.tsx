import { palette } from "@/theme/color_palette";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MD3Theme } from "react-native-paper";

export type ToastType = "success" | "error" | "info";

interface VariantConfig {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  background: string;
  textColor: string;
}

const getVariants = (theme: MD3Theme): Record<ToastType, VariantConfig> => ({
  success: {
    icon: "check-circle-outline",
    color: palette.black,
    background: theme.colors.primary,
    textColor: palette.black,
  },
  error: {
    icon: "alert-circle-outline",
    color: theme.colors.error,
    background: theme.colors.errorContainer,
    textColor: theme.colors.onErrorContainer,
  },
  info: {
    icon: "information-outline",
    color: theme.colors.tertiary,
    background: theme.colors.surface,
    textColor: theme.colors.onSurface,
  },
});

function PillToast({
  text1,
  variant,
}: {
  text1?: string;
  variant: VariantConfig;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: variant.background }]}>
      <MaterialCommunityIcons
        name={variant.icon}
        size={16}
        color={variant.color}
      />
      <Text style={[styles.label, { color: variant.textColor }]}>{text1}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});

export const buildToastConfig = (theme: MD3Theme) => {
  const variants = getVariants(theme);
  return {
    success: (props: any) => (
      <PillToast text1={props.text1} variant={variants.success} />
    ),
    error: (props: any) => (
      <PillToast text1={props.text1} variant={variants.error} />
    ),
    info: (props: any) => (
      <PillToast text1={props.text1} variant={variants.info} />
    ),
  };
};
