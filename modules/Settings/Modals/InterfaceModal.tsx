import { ActionRow } from "@/components/ActionRow";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import React from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useSettings } from "../hooks";
import { SettingsStyles } from "../Styles";

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

function InterfaceContent({ onBack }: { onBack: () => void }) {
  const theme = useTheme();
  const { tabBarEnabled, setTabBarEnabled, hideLabels, setHideLabels } = useTabBarModePreference();
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
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="Interface" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="palette-outline"
            label="Minimal icons"
            description="Use the primary color for category icons"
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
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primary }}
                thumbColor={hideLabels ? theme.colors.onPrimary : theme.colors.surface}
              />
            }
          />
          <ActionRow
            icon="dock-bottom"
            label="Bottom bar"
            description="Show the bottom navigation bar"
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
                  tabBarEnabled ? theme.colors.onPrimary : theme.colors.surface
                }
              />
            }
          />
        </SheetCard>
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
