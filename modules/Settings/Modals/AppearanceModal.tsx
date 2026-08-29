import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import type { THEME_PRESETS, ThemeId } from "@/theme/presets";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useSettings } from "../hooks";
import { SettingsStyles } from "../Styles";

export type ModeOption = "light" | "dark" | "system";

const MODE_OPTIONS: { id: ModeOption; label: string; icon: string }[] = [
  { id: "light", label: "Light", icon: "weather-sunny" },
  { id: "dark", label: "Dark", icon: "weather-night" },
  { id: "system", label: "System", icon: "cellphone-cog" },
];

type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
};

type ContentProps = {
  modal?: boolean;
  onBack: () => void;
};

type ThemeOption = [ThemeId, (typeof THEME_PRESETS)[ThemeId]];
const ACCENT_GAP = 8;
const ACCENT_COLS = 3;

type AppearanceSectionProps = {
  activeModeId: ModeOption;
  onModeSelect: (id: ModeOption) => void;
  themeId: ThemeId;
  onThemeSelect: (id: ThemeId) => void;
  themeOptions: ThemeOption[];
  trueBlack: boolean;
  onTrueBlackChange: (enabled: boolean) => void;
};

function AppearanceSection({
  activeModeId,
  onModeSelect,
  themeId,
  onThemeSelect,
  themeOptions,
  trueBlack,
  onTrueBlackChange,
}: AppearanceSectionProps) {
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
      <SheetCard theme={theme} style={appearanceStyles.cardContent}>
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
            appearanceStyles.cardDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <Pressable
          onPress={() => onTrueBlackChange(!trueBlack)}
          style={({ pressed }) => [
            SettingsStyles.row,
            appearanceStyles.amoledRow,
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
                  { color: theme.colors.onSurface, fontWeight: "700" },
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
      <SheetCard theme={theme} style={appearanceStyles.cardContent}>
        <View
          style={appearanceStyles.accentGrid}
          onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
        >
          {themeOptions.map(([id, preset]) => {
            const active = themeId === id;
            return (
              <Pressable
                key={id}
                onPress={() => onThemeSelect(id)}
                style={[
                  appearanceStyles.accentCard,
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
                    appearanceStyles.swatchDot,
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
                    appearanceStyles.accentLabel,
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

function SheetShell({
  children,
  onDismiss,
  visible,
}: SheetProps & {
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: "92%",
        overflow: "hidden",
      }}
      includeBottomInset={false}
    >
      <View style={styles.handleWrap}>
        <View
          style={[
            styles.handle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
      </View>
      {children}
    </AnimatedPaperModal>
  );
}

function AppearanceContent({ modal = false, onBack }: ContentProps) {
  const {
    activeModeId,
    handleModeSelect,
    setThemeId,
    setTrueBlack,
    themeId,
    themeOptions,
    trueBlack,
  } = useSettings();

  return (
    <>
      <SettingsHeader title="Appearance" onBack={onBack} modal={modal} />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppearanceSection
          activeModeId={activeModeId}
          onModeSelect={handleModeSelect}
          themeId={themeId}
          onThemeSelect={setThemeId}
          themeOptions={themeOptions}
          trueBlack={trueBlack}
          onTrueBlackChange={setTrueBlack}
        />
      </ScrollView>
    </>
  );
}

export function AppearanceModal({ visible, onDismiss }: SheetProps) {
  return (
    <SheetShell visible={visible} onDismiss={onDismiss}>
      <AppearanceContent modal onBack={onDismiss} />
    </SheetShell>
  );
}

const styles = StyleSheet.create({
  handle: {
    borderRadius: 999,
    height: 4,
    width: 42,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
  },
});

const appearanceStyles = StyleSheet.create({
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
