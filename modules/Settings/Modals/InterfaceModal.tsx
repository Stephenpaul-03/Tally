import { SettingsSheetHandle } from "../Components/SettingsSheetHandle";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { ActivityTypeToggle } from "@/modules/Insights/components/ActivityTypeToggle";
import { useMainDesign } from "@/hooks/use-main-design";
import { DesignChoiceCards } from "../Components/DesignChoiceCards";
import { ActionRow } from "@/components/ActionRow";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import React from "react";
import { ScrollView, Switch } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useSettings } from "../hooks";
import { SettingsStyles } from "../Styles";
import { SettingsDetailContext } from "../Layouts/SettingsDetailContext";
import { SettingsLayoutView } from "../Components/SettingsLayoutView";

type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
};

function SheetShell({
  children,
  onDismiss,
  visible,
}: SheetProps & { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        maxHeight: "92%",
        overflow: "hidden",
      }}
      includeBottomInset={false}
    >
      <SettingsSheetHandle />
      {children}
    </AnimatedPaperModal>
  );
}

function InterfaceContent({ onBack }: { onBack: () => void }) {
  const theme = useTheme();
  const embedded = React.useContext(SettingsDetailContext);
  const { design, setDesign, insightsStyle, setInsightsStyle } = useMainDesign();
  const { tonalSettingsCardsEnabled, setTonalSettingsCardsEnabled, insightsGroupingEnabled, setInsightsGroupingEnabled } = useAddonPrefs();
  const { tabBarEnabled, setTabBarEnabled, hideLabels, setHideLabels,
    tabletNavigationSide, setTabletNavigationSide } =
    useTabBarModePreference();
  const {
    minimalIconsEnabled,
    handleMinimalIconsToggle,
    interactionHintsEnabled,
    handleInteractionHintsToggle,
  } = useSettings();

  return (
    <>
      <SettingsHeader title="Interface" onBack={onBack} modal />
      <ScrollView
        style={embedded ? { flex: 1, minHeight: 0 } : { flexGrow: 0 }}
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsLayoutView>
        <SettingsLayoutView>
        <SectionLabel label="Style" />
        <DesignChoiceCards
          value={design.layout}
          onChange={(layout) => setDesign({ layout })}
          purpose="style"
        />
        </SettingsLayoutView>
        <SettingsLayoutView>
        <SectionLabel label="Interface" />
        <SheetCard theme={theme}>
          <ActionRow icon="dock-left" label="Tablet navigation"
            description="Choose the sidebar side in tablet landscape"
            theme={theme} showChevron={false}
            onPress={() => setTabletNavigationSide(tabletNavigationSide === "left" ? "right" : "left")}
            rightElement={<SegmentedButtons value={tabletNavigationSide}
              onValueChange={(value) => setTabletNavigationSide(value === "right" ? "right" : "left")}
              density="small" style={{ width: 176 }}
              buttons={[{ value: "left", label: "Left", accessibilityLabel: "Navigation on the left" },
                { value: "right", label: "Right", accessibilityLabel: "Navigation on the right" }]} />}
          />
          <ActionRow icon="layers-triple-outline" label="Group similar entries in Insights"
            description="Combine matching titles, categories and accounts into expandable groups. Only affects Insights."
            theme={theme} showChevron={false} onPress={() => setInsightsGroupingEnabled(!insightsGroupingEnabled)}
            rightElement={<Switch value={insightsGroupingEnabled} onValueChange={setInsightsGroupingEnabled}
              accessibilityLabel="Group similar entries in Insights" />} />
          <ActionRow icon="chart-box-outline" label="Insights type"
            description="Choose how Insights looks" theme={theme} showChevron={false}
            onPress={() => setInsightsStyle((insightsStyle ?? design.layout) === "classic" ? "sage" : "classic")}
            rightElement={<ActivityTypeToggle stylePicker value={(insightsStyle ?? design.layout) === "sage" ? "expense" : "income"}
              onChange={(type) => setInsightsStyle(type === "expense" ? "sage" : "classic")} />}
          />
          {design.layout === "sage" ? <ActionRow
            icon="palette-swatch-outline"
            label="Tonal cards"
            description="Use item colors in Categories, Accounts, Budgets, Goals and Defaults"
            theme={theme} showChevron={false}
            onPress={() => setTonalSettingsCardsEnabled(!tonalSettingsCardsEnabled)}
            rightElement={<Switch accessibilityLabel="Tonal cards" value={tonalSettingsCardsEnabled} onValueChange={setTonalSettingsCardsEnabled}
              trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primary }}
              thumbColor={tonalSettingsCardsEnabled ? theme.colors.onPrimary : theme.colors.surface} />}
          /> : null}
          <ActionRow
            icon="palette-outline"
            label="Colored icons"
            description="Show icons in their own colors without backgrounds"
            onPress={() => handleMinimalIconsToggle(!minimalIconsEnabled)}
            theme={theme}
            showChevron={false}
            rightElement={
              <Switch
                value={minimalIconsEnabled}
                onValueChange={handleMinimalIconsToggle}
                trackColor={{
                  false: theme.colors.outlineVariant,
                  true: theme.colors.primary,
                }}
                thumbColor={
                  minimalIconsEnabled
                    ? theme.colors.onPrimary
                    : theme.colors.surface
                }
              />
            }
          />
          <ActionRow
            icon="gesture-swipe-horizontal"
            label="Interaction hints"
            description="Show one-time gestures that explain swipeable controls"
            onPress={() =>
              handleInteractionHintsToggle(!interactionHintsEnabled)
            }
            theme={theme}
            showChevron={false}
            rightElement={
              <Switch
                value={interactionHintsEnabled}
                onValueChange={handleInteractionHintsToggle}
                trackColor={{
                  false: theme.colors.outlineVariant,
                  true: theme.colors.primary,
                }}
                thumbColor={
                  interactionHintsEnabled
                    ? theme.colors.onPrimary
                    : theme.colors.surface
                }
              />
            }
          />
          {design.layout === "classic" ? (
            <>
              <ActionRow
                icon="format-text"
                label="Hide labels"
                description="Use icons only for Home and Transactions controls and bottom navigation"
                onPress={() => setHideLabels(!hideLabels)}
                theme={theme}
                showChevron={false}
                rightElement={
                  <Switch
                    value={hideLabels}
                    onValueChange={setHideLabels}
                    accessibilityLabel="Hide labels"
                    trackColor={{
                      false: theme.colors.outlineVariant,
                      true: theme.colors.primary,
                    }}
                    thumbColor={
                      hideLabels ? theme.colors.onPrimary : theme.colors.surface
                    }
                  />
                }
              />
              <ActionRow
                icon="dock-bottom"
                label="Phone bottom bar"
                description="Show bottom navigation on phones"
                onPress={() => setTabBarEnabled(!tabBarEnabled)}
                theme={theme}
                showChevron={false}
                rightElement={
                  <Switch
                    value={tabBarEnabled}
                    onValueChange={setTabBarEnabled}
                    trackColor={{
                      false: theme.colors.outlineVariant,
                      true: theme.colors.primary,
                    }}
                    thumbColor={
                      tabBarEnabled
                        ? theme.colors.onPrimary
                        : theme.colors.surface
                    }
                  />
                }
              />
            </>
          ) : null}
        </SheetCard>
        </SettingsLayoutView>
        </SettingsLayoutView>
      </ScrollView>
    </>
  );
}

export function InterfaceModal({ visible, onDismiss }: SheetProps) {
  return (
    <SheetShell visible={visible} onDismiss={onDismiss}>
      <InterfaceContent onBack={onDismiss} />
    </SheetShell>
  );
}
