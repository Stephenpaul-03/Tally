import type { THEME_PRESETS, ThemeId } from "@/theme/presets";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MODE_OPTIONS, type ModeOption } from "../Constants";
import { SettingsStyles } from "../Styles";

type ThemeOption = [ThemeId, (typeof THEME_PRESETS)[ThemeId]];
const ACCENT_GAP = 8;
const ACCENT_COLS = 3;

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
  const [gridWidth, setGridWidth] = React.useState(0);
  const cardWidth =
    gridWidth > 0
      ? Math.floor((gridWidth - ACCENT_GAP * (ACCENT_COLS - 1)) / ACCENT_COLS)
      : undefined;
  const primary = theme.colors.primary;

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

        <View style={local.accentDivider}>
          <View
            style={[
              local.accentDividerLine,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <Text
            style={[
              local.accentDividerText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Accent colors
          </Text>
          <View
            style={[
              local.accentDividerLine,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
        </View>

        {/* Accent grid */}
        <View
          style={local.accentGrid}
          onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
        >
          {themeOptions.map(([id, preset]) => {
            const active = themeId === id;
            return (
              <Pressable
                key={id}
                onPress={() => onThemeSelect(id)}
                style={[
                  local.accentCard,
                  cardWidth != null && { width: cardWidth },
                  {
                    backgroundColor: active
                      ? theme.colors.primaryContainer
                      : theme.colors.background,
                    borderColor: active ? primary : theme.colors.outlineVariant,
                    borderWidth: 1,
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
                    <MaterialCommunityIcons
                      color="#fff"
                      name="check"
                      size={14}
                    />
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
      </View>
    </>
  );
}

const local = StyleSheet.create({
  accentDivider: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  accentDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  accentDividerText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  accentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: ACCENT_GAP,
    rowGap: ACCENT_GAP,
  },
  accentCard: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  swatchDot: {
    alignItems: "center",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  accentLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});
