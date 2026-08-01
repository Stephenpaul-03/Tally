import { SheetCard } from "@/components/SheetCard";
import type { THEME_PRESETS, ThemeId } from "@/theme/presets";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Switch, Text, useTheme } from "react-native-paper";
import { MODE_OPTIONS, type ModeOption } from "../Constants";
import { SettingsStyles } from "../Styles";
import { SectionLabel } from "./SectionLabel";

type ThemeOption = [ThemeId, (typeof THEME_PRESETS)[ThemeId]];
const ACCENT_GAP = 8;
const ACCENT_COLS = 3;

type Props = {
  activeModeId: ModeOption;
  onModeSelect: (id: ModeOption) => void;
  themeId: ThemeId;
  onThemeSelect: (id: ThemeId) => void;
  themeOptions: ThemeOption[];
  trueBlack: boolean;
  onTrueBlackChange: (enabled: boolean) => void;
};

export function AppearanceSection({
  activeModeId,
  onModeSelect,
  themeId,
  onThemeSelect,
  themeOptions,
  trueBlack,
  onTrueBlackChange,
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
      <SectionLabel label="Main theme" />
      <SheetCard theme={theme} style={local.cardContent}>
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
        <View
          style={[
            local.cardDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <Pressable
          onPress={() => onTrueBlackChange(!trueBlack)}
          style={({ pressed }) => [
            SettingsStyles.row,
            local.amoledRow,
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <View style={SettingsStyles.rowLeft}>
            <View style={SettingsStyles.rowIcon}>
              <MaterialCommunityIcons
                name="theme-light-dark"
                size={18}
                color={theme.colors.primary}
              />
            </View>
            <View>
              <Text
                style={[
                  SettingsStyles.rowTitle,
                  {
                    color: theme.colors.onSurface,
                    fontWeight: "700",
                  },
                ]}
              >
                AMOLED dark mode
              </Text>
              <Text
                style={[
                  SettingsStyles.rowSub,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Use true black surfaces in dark mode
              </Text>
            </View>
          </View>
          <Switch value={trueBlack} onValueChange={onTrueBlackChange} />
        </Pressable>
      </SheetCard>

      <SectionLabel label="Accent colors" />
      <SheetCard theme={theme} style={local.cardContent}>
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
      </SheetCard>
    </>
  );
}

const local = StyleSheet.create({
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
  amoledRow: {
    paddingHorizontal: 0,
    paddingBottom: 2,
  },
  cardContent: {
    padding: 10,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
});
