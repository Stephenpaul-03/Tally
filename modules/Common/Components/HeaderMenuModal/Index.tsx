import { AnimatedPaperModal } from "@/components/modal/modal";
import { ActionRow } from "@/modules/Common/Components/HeaderMenuModal/Molecules/ActionRow";
import { SheetCard } from "@/modules/Common/Components/SheetCard";
import { useQuickShareInsights } from "@/modules/Common/Hooks/UseQuickShareInsights";
import type { RootParamList } from "@/navigation/types";
import { typography } from "@/theme/typography";
import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SheetSectionLabel } from "./Molecules/SheetCardLabel";
import { ToggleTile } from "./Molecules/ToggleTile";
import { WorkspaceInfoCard } from "./Molecules/WorkspaceInfoCard";
import { WorkspaceSwitcherModal } from "./Molecules/WorkspaceSwitcherModal";
import type { HeaderMenuSheetProps } from "./Types";
export { HeaderMenuButton } from "./Molecules/MenuButton";
export type { HeaderMenuButtonProps, HeaderMenuSheetProps } from "./Types";
export function HeaderMenuSheet({
  visible,
  onDismiss,
  showViewSection = false,
  monthMode = false,
  onToggleMonthMode,
  showDatePickerSection = false,
  datePickerCalendarMode = false,
  onToggleDatePickerStyle,
  isPrefsHydrated = true,
  showMonthSection = false,
  onCollapseAll,
  onExpandAll,
  insightsSummary,
  insightsMonthLabel,
}: HeaderMenuSheetProps) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootParamList>>();
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [lastMonthAction, setLastMonthAction] = useState<
    "collapse" | "expand" | null
  >(null);

  const { shareInsights, isGenerating } = useQuickShareInsights(
    insightsSummary,
    insightsMonthLabel,
  );

  const handleOpenSettings = () => {
    onDismiss();
    navigation.navigate("Settings");
  };

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        overflow: "hidden",
        paddingBottom: bottom + 16,
      }}
    >
      <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 2 }}>
        <View
          style={{
            width: 34,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.colors.outlineVariant,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <Text
          style={{
            flex: 1,
            color: theme.colors.onSurface,
            ...typography.editorial.sectionLabel,
          }}
        >
          Options
        </Text>
        <IconButton
          icon="close"
          size={18}
          iconColor={theme.colors.onSurfaceVariant}
          accessibilityLabel="Close menu"
          onPress={onDismiss}
          style={{ margin: 0 }}
        />
      </View>
      <SheetSectionLabel label="You are in" theme={theme} />
      <WorkspaceInfoCard
        theme={theme}
        onPress={() => setWorkspaceSwitcherOpen(true)}
      />

      {showViewSection ? (
        <>
          <SheetSectionLabel label="View" theme={theme} />
          <View
            style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16 }}
          >
            <ToggleTile
              icon="calendar-today"
              label="Day"
              description="See transactions for one selected day"
              active={!monthMode}
              onPress={
                !monthMode ? () => {} : (onToggleMonthMode ?? (() => {}))
              }
              theme={theme}
            />
            <ToggleTile
              icon="calendar-month-outline"
              label="Month"
              description="Browse all days grouped by month"
              active={monthMode}
              onPress={monthMode ? () => {} : (onToggleMonthMode ?? (() => {}))}
              theme={theme}
            />
          </View>
        </>
      ) : null}

      {showDatePickerSection ? (
        <>
          <SheetSectionLabel label="Date Picker" theme={theme} />
          <View
            style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16 }}
          >
            <ToggleTile
              icon="view-week-outline"
              label="Strip"
              description="Horizontal day strip with quick scroll"
              active={!datePickerCalendarMode}
              onPress={
                !datePickerCalendarMode
                  ? () => {}
                  : (onToggleDatePickerStyle ?? (() => {}))
              }
              theme={theme}
              disabled={!isPrefsHydrated}
            />
            <ToggleTile
              icon="calendar-month-outline"
              label="Calendar"
              description="Full month calendar for easy navigation"
              active={datePickerCalendarMode}
              onPress={
                datePickerCalendarMode
                  ? () => {}
                  : (onToggleDatePickerStyle ?? (() => {}))
              }
              theme={theme}
              disabled={!isPrefsHydrated}
            />
          </View>
        </>
      ) : null}

      {showMonthSection ? (
        <>
          <SheetSectionLabel label="Month sections" theme={theme} />
          <View
            style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16 }}
          >
            <ToggleTile
              icon="arrow-collapse-down"
              label="Collapse all"
              description="Fold all days into headers"
              active={lastMonthAction === "collapse"}
              onPress={() => {
                setLastMonthAction("collapse");
                onCollapseAll?.();
              }}
              theme={theme}
            />
            <ToggleTile
              icon="arrow-expand-up"
              label="Expand all"
              description="Show all transactions for every day"
              active={lastMonthAction === "expand"}
              onPress={() => {
                setLastMonthAction("expand");
                onExpandAll?.();
              }}
              theme={theme}
            />
          </View>
        </>
      ) : null}

      <SheetSectionLabel label="Manage" theme={theme} />
      <SheetCard theme={theme}>
        {insightsSummary ? (
          <>
            <ActionRow
              icon="file-chart-outline"
              label="Share Insights"
              description={
                isGenerating
                  ? "Generating PDF..."
                  : "Export this month's summary as a PDF"
              }
              onPress={() => {
                onDismiss();
                shareInsights();
              }}
              // disabled={isGenerating}
              theme={theme}
            />
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: theme.colors.outlineVariant,
                marginLeft: 52,
              }}
            />
          </>
        ) : null}
        <ActionRow
          icon="cog-outline"
          label="Settings"
          description="Preferences, backups, and app tools"
          onPress={handleOpenSettings}
          theme={theme}
        />
      </SheetCard>
      <WorkspaceSwitcherModal
        visible={workspaceSwitcherOpen}
        onDismiss={() => setWorkspaceSwitcherOpen(false)}
        theme={theme}
      />
    </AnimatedPaperModal>
  );
}
