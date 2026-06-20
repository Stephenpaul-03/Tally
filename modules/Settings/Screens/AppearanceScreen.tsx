import { ActionRow } from "@/components/ActionRow";
import { SheetCard } from "@/components/SheetCard";
import { toast } from "@/components/toast/ToastProvider";
import { useTransactionUiPrefs } from "@/hooks/use-transaction-ui-prefs";
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
    minimalIconsEnabled,
    handleMinimalIconsToggle,
  } = useSettings();
  const {
    datePickerCalendarMode,
    isHydrated: isPrefsHydrated,
    toggleDatePickerCalendarMode,
  } = useTransactionUiPrefs();

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
            icon="calendar-outline"
            label="Date picker"
            description="Choose the calendar picker layout"
            onPress={() => {}}
            theme={theme}
            showChevron={false}
            rightElement={
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[
                  { id: "strip", label: "Strip", icon: "view-week-outline" },
                  {
                    id: "calendar",
                    label: "Calendar",
                    icon: "calendar-month-outline",
                  },
                ].map((opt) => {
                  const active =
                    opt.id === "calendar"
                      ? datePickerCalendarMode
                      : !datePickerCalendarMode;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                        if (!isPrefsHydrated) return;
                        if (opt.id === "calendar" && !datePickerCalendarMode) {
                          toggleDatePickerCalendarMode();
                          toast.success("Date picker set to Calendar mode");
                        } else if (
                          opt.id === "strip" &&
                          datePickerCalendarMode
                        ) {
                          toggleDatePickerCalendarMode();
                          toast.success("Date picker set to Strip mode");
                        }
                      }}
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
