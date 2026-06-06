import { ActionRow } from "@/modules/Common/Components/HeaderMenuModal/Molecules/ActionRow";
import { SheetCard } from "@/modules/Common/Components/SheetCard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppearanceSection } from "../Components/AppearanceSection";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { TAB_BAR_MODE_OPTIONS } from "../Constants";
import { useSettings } from "../hooks";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

export function AppearanceScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const {
    themeId,
    setThemeId,
    themeOptions,
    activeModeId,
    handleModeSelect,
    tabBarMode,
    setTabBarMode,
    minimalIconsEnabled,
    handleMinimalIconsToggle,
    animationsEnabled,
    handleAnimationsToggle,
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
            icon="motion-play-outline"
            label="Animations"
            description="Turn all motion on or off across Tally"
            onPress={() => handleAnimationsToggle(!animationsEnabled)}
            theme={theme}
            showChevron={false}
            rightElement={
              <Pressable onPress={() => handleAnimationsToggle(!animationsEnabled)}>
                <MaterialCommunityIcons
                  name={animationsEnabled ? "check-circle" : "circle-outline"}
                  size={18}
                  color={
                    animationsEnabled
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
              </Pressable>
            }
          />
          <ActionRow
            icon="dock-bottom"
            label="Navigation bar"
            description="Choose the tab bar layout"
            onPress={() => {}}
            theme={theme}
            showChevron={false}
            rightElement={
              <View style={{ flexDirection: "row", gap: 6 }}>
                {TAB_BAR_MODE_OPTIONS.map((opt) => {
                  const active = tabBarMode === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setTabBarMode(opt.id)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: active
                          ? theme.colors.secondary
                          : theme.colors.outlineVariant,
                        backgroundColor: theme.colors.background,
                        minWidth: 76,
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon as any}
                        size={15}
                        color={
                          active
                            ? theme.colors.onSecondaryContainer
                            : theme.colors.onSurfaceVariant
                        }
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: active
                            ? theme.colors.onSecondaryContainer
                            : theme.colors.onSurfaceVariant,
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            }
          />
        </SheetCard>
      </ScrollView>
    </SafeAreaView>
  );
}
