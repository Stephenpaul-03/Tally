import { ActionRow } from "@/components/ActionRow";
import { SheetCard } from "@/components/SheetCard";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppearanceSection } from "../Components/AppearanceSection";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useSettings } from "../hooks";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

export function AppearanceScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { tabBarEnabled, setTabBarEnabled } = useTabBarModePreference();
  const {
    themeId,
    setThemeId,
    themeOptions,
    activeModeId,
    handleModeSelect,
    minimalIconsEnabled,
    handleMinimalIconsToggle,
    trueBlack,
    setTrueBlack,
  } = useSettings();

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader title="Appearances" onBack={() => navigation.goBack()} />
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
        />

        <View style={SettingsStyles.sectionGap} />

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

          <ActionRow
            icon="theme-light-dark"
            label="AMOLED mode"
            description="Use true black surfaces in dark mode"
            onPress={() => setTrueBlack(!trueBlack)}
            theme={theme}
            showChevron={false}
            rightElement={
              <Switch
                value={trueBlack}
                onValueChange={setTrueBlack}
                trackColor={{
                  false: theme.colors.outlineVariant,
                  true: theme.colors.primary,
                }}
                thumbColor={
                  trueBlack ? theme.colors.onPrimary : theme.colors.surface
                }
              />
            }
          />
        </SheetCard>
      </ScrollView>
    </SafeAreaView>
  );
}
