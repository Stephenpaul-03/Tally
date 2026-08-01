import { ActionRow } from "@/components/ActionRow";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppearanceSection } from "../Components/AppearanceSection";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useSettings } from "../hooks";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
};

type ContentProps = {
  modal?: boolean;
  onBack: () => void;
};

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

function InterfaceContent({ modal = false, onBack }: ContentProps) {
  const theme = useTheme();
  const { tabBarEnabled, setTabBarEnabled } = useTabBarModePreference();
  const { minimalIconsEnabled, handleMinimalIconsToggle } = useSettings();

  return (
    <>
      <SettingsHeader title="Interface" onBack={onBack} modal={modal} />
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
              <Pressable
                onPress={() => handleMinimalIconsToggle(!minimalIconsEnabled)}
              >
                <MaterialCommunityIcons
                  name={minimalIconsEnabled ? "check-circle" : "circle-outline"}
                  size={18}
                  color={
                    minimalIconsEnabled
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
              </Pressable>
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

export function AppearanceModal({ visible, onDismiss }: SheetProps) {
  return (
    <SheetShell visible={visible} onDismiss={onDismiss}>
      <AppearanceContent modal onBack={onDismiss} />
    </SheetShell>
  );
}

export function InterfaceModal({ visible, onDismiss }: SheetProps) {
  return (
    <SheetShell visible={visible} onDismiss={onDismiss}>
      <InterfaceContent modal onBack={onDismiss} />
    </SheetShell>
  );
}

export function AppearanceScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <AppearanceContent onBack={() => navigation.goBack()} />
    </SafeAreaView>
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
