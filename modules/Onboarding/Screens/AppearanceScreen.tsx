import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

import { StaggeredItems } from "../Components/StaggeredItems";
import { THEME_PRESETS, type ThemeId } from "@/theme/presets";
import type { OnboardingThemePreference } from "../Types";
import type { OnboardingStyles } from "../Styles";

const MODE_OPTIONS: {
  id: OnboardingThemePreference;
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}[] = [
  { id: "light", title: "Light", icon: "weather-sunny" },
  { id: "dark", title: "Dark", icon: "weather-night" },
  { id: "system", title: "Follow System", icon: "cellphone-cog" },
];

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
  return (
    <View style={[styles.screenStack, styles.screenTopStack]}>
      <Text style={styles.compactTitle}>Choose your theme</Text>
      <Text style={styles.compactDescription}>
        Pick how Tally follows your device and choose the accent color used
        across buttons, chips, and highlights.
      </Text>

      <Text style={styles.sectionLabel}>Mode</Text>
      <StaggeredItems
        contentContainerStyle={styles.modeRow}
        dataKey="modes"
        itemStyle={styles.modeItem}
      >
        {MODE_OPTIONS.map((option) => {
          const active = themePreference === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onThemePreferenceSelect(option.id)}
              style={[
                styles.modeCard,
                active && {
                  backgroundColor: theme.colors.primaryContainer,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <MaterialCommunityIcons
                color={
                  active
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant
                }
                name={option.icon}
                size={19}
              />
              <Text
                style={[
                  styles.modeCardText,
                  {
                    color: active
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </StaggeredItems>

      <Text style={styles.sectionLabel}>Accent</Text>
      <StaggeredItems contentContainerStyle={styles.accentGrid} dataKey="accent-options">
        {accentOptions.map(([id, preset]) => {
          const active = selectedThemeId === id;
          return (
            <Pressable
              key={id}
              onPress={() => onAccentSelect(id)}
              style={[
                styles.accentCardSquare,
                active && {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
            >
              <View
                style={[
                  styles.accentSwatchSquare,
                  { backgroundColor: preset.primarySeed },
                ]}
              />
              <Text
                style={[
                  styles.themeTitle,
                  active && { color: theme.colors.onPrimaryContainer },
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </StaggeredItems>
    </View>
  );
}
