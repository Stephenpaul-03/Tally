import { THEME_PRESETS, type ThemeId } from "@/theme/presets";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import type { OnboardingStyles } from "../Styles";
import type { OnboardingThemePreference } from "../Types";

const MODE_OPTIONS: {
  id: OnboardingThemePreference;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}[] = [
  {
    id: "light",
    title: "Light",
    subtitle: "Always bright",
    icon: "weather-sunny",
  },
  {
    id: "dark",
    title: "Dark",
    subtitle: "Easy on eyes",
    icon: "weather-night",
  },
  {
    id: "system",
    title: "System",
    subtitle: "Follows device",
    icon: "cellphone-cog",
  },
];

const ACCENT_GAP = 8;
const ACCENT_COLS = 3;

type Props = {
  themePreference: OnboardingThemePreference;
  onThemePreferenceSelect: (preference: OnboardingThemePreference) => void;
  selectedThemeId: ThemeId;
  onAccentSelect: (themeId: ThemeId) => void;
  accentOptions: [ThemeId, (typeof THEME_PRESETS)[ThemeId]][];
  styles: OnboardingStyles;
  theme: MD3Theme;
};

export function AppearanceScreen({
  themePreference,
  onThemePreferenceSelect,
  selectedThemeId,
  onAccentSelect,
  accentOptions,
  styles,
  theme,
}: Props) {
  const [gridWidth, setGridWidth] = React.useState(0);
  const cardWidth =
    gridWidth > 0
      ? (gridWidth - ACCENT_GAP * (ACCENT_COLS - 1)) / ACCENT_COLS
      : undefined;

  const primary = theme.colors.primary;

  return (
    <Animated.View style={[styles.screenStack, styles.screenTopStack]}>
      {/* Header */}
      <View style={local.header}>
        <View
          style={[
            local.iconBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            color={theme.colors.onPrimaryContainer}
            name="palette-outline"
            size={20}
          />
        </View>
        <Text style={[local.title, { color: theme.colors.onSurface }]}>
          Make it yours
        </Text>
        <Text
          style={[local.description, { color: theme.colors.onSurfaceVariant }]}
        >
          Choose how the app looks and feels. You can always change this in
          Settings later.
        </Text>
      </View>

      {/* Mode — single row, 3 equal columns */}
      <Text
        style={[local.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        Appearance
      </Text>
      <View style={local.modeRow}>
        {MODE_OPTIONS.map((option) => {
          const active = themePreference === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onThemePreferenceSelect(option.id)}
              style={[
                local.modeCard,
                {
                  backgroundColor: active
                    ? theme.colors.primaryContainer
                    : theme.colors.elevation.level1,
                  borderColor: active ? primary : theme.colors.outlineVariant,
                  borderWidth: active ? 1.5 : 1,
                },
              ]}
            >
              <View
                style={[
                  local.modeIconWrap,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  color={
                    active
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant
                  }
                  name={option.icon}
                  size={18}
                />
              </View>
              <Text
                style={[
                  local.modeTitle,
                  {
                    color: active
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurface,
                  },
                ]}
              >
                {option.title}
              </Text>
              <Text
                style={[
                  local.modeSubtitle,
                  {
                    color: active
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                    opacity: active ? 0.8 : 0.6,
                  },
                ]}
              >
                {option.subtitle}
              </Text>
              <View style={local.modeCheckSlot}>
                {active ? (
                  <MaterialCommunityIcons
                    color={primary}
                    name="check-circle"
                    size={18}
                  />
                ) : (
                  <View
                    style={[
                      local.modeCircle,
                      { borderColor: theme.colors.outlineVariant },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Accent — strict 3-per-row using measured container width */}
      <Text
        style={[local.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        Accent colour
      </Text>
      <View
        style={local.accentGrid}
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
      >
        {accentOptions.map(([id, preset]) => {
          const active = selectedThemeId === id;
          return (
            <Pressable
              key={id}
              onPress={() => onAccentSelect(id)}
              style={[
                local.accentCard,
                cardWidth != null && { width: cardWidth },
                {
                  backgroundColor: active
                    ? theme.colors.primaryContainer
                    : theme.colors.elevation.level1,
                  borderColor: active ? primary : theme.colors.outlineVariant,
                  borderWidth: active ? 1.5 : 1,
                },
              ]}
            >
              <View
                style={[
                  local.swatchDot,
                  { backgroundColor: preset.primarySeed },
                ]}
              >
                {active ? (
                  <MaterialCommunityIcons color="#fff" name="check" size={14} />
                ) : null}
              </View>
              <Text
                style={[
                  local.accentLabel,
                  {
                    color: active
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurface,
                  },
                ]}
                numberOfLines={1}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const local = StyleSheet.create({
  header: { gap: 6, marginBottom: 24 },
  iconBadge: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    marginBottom: 6,
    width: 40,
  },
  title: { fontSize: 26, fontWeight: "500", lineHeight: 31 },
  description: { fontSize: 14, lineHeight: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.9,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
  },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  modeCard: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  modeIconWrap: {
    alignItems: "center",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    marginBottom: 2,
    width: 36,
  },
  modeTitle: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  modeSubtitle: { fontSize: 11, textAlign: "center" },
  modeCheckSlot: {
    alignItems: "center",
    height: 20,
    justifyContent: "center",
    marginTop: 4,
    width: 20,
  },
  modeCircle: { borderRadius: 9, borderWidth: 1.5, height: 18, width: 18 },
  accentGrid: { flexDirection: "row", flexWrap: "wrap", gap: ACCENT_GAP },
  accentCard: { borderRadius: 16, gap: 8, padding: 12 },
  swatchDot: {
    alignItems: "center",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  accentLabel: { fontSize: 12, fontWeight: "500" },
});
