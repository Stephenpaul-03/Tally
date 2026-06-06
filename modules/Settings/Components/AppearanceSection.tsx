import type { THEME_PRESETS, ThemeId } from "@/theme/presets";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MODE_OPTIONS, type ModeOption } from "../Constants";
import { SettingsStyles } from "../Styles";

type ThemeOption = [ThemeId, (typeof THEME_PRESETS)[ThemeId]];

type Props = {
  activeModeId: ModeOption;
  onModeSelect: (id: ModeOption) => void;
  themeId: ThemeId;
  onThemeSelect: (id: ThemeId) => void;
  themeOptions: ThemeOption[];
};

export function AppearanceSection({
  activeModeId,
  onModeSelect,
  themeId,
  onThemeSelect,
  themeOptions,
}: Props) {
  const theme = useTheme();

  return (
    <>
      <Text
        style={[
          SettingsStyles.sectionLabel,
          {
            ...typography.editorial.sectionLabel,
            fontSize: 14,
            color: theme.colors.onSurfaceVariant,
          },
        ]}
      >
        Appearance
      </Text>

      {/* Mode segments */}
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.elevation.level1,
          padding: 12,
          borderRadius: 12,
          marginHorizontal: 20,
          gap: 12,
        }}
      >
        <View style={SettingsStyles.segRow}>
          {MODE_OPTIONS.map((opt) => {
            const active = activeModeId === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => onModeSelect(opt.id)}
                style={[
                  SettingsStyles.seg,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: active
                      ? theme.colors.secondary
                      : theme.colors.outlineVariant,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={opt.icon as any}
                  size={18}
                  color={
                    active
                      ? theme.colors.onSecondaryContainer
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    SettingsStyles.segLabel,
                    {
                      color: active
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurfaceVariant,
                      fontWeight: active ? "600" : "400",
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Palette row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={SettingsStyles.paletteRow}
          style={{ marginBottom: 0 }}
        >
          {themeOptions.map(([id, preset]) => {
            const active = themeId === id;
            return (
              <Pressable
                key={id}
                onPress={() => onThemeSelect(id)}
                style={[
                  SettingsStyles.swatchTile,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: active
                      ? theme.colors.secondary
                      : theme.colors.outlineVariant,
                  },
                ]}
              >
                <View
                  style={[
                    SettingsStyles.swatchDot,
                    { backgroundColor: preset.primarySeed },
                  ]}
                />
                <Text
                  style={[
                    SettingsStyles.swatchName,
                    {
                      color: active
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurfaceVariant,
                      fontWeight: active ? "600" : "400",
                    },
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}
