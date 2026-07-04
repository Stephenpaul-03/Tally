import { ActionRow } from "@/components/ActionRow";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import { toast } from "@/components/toast/ToastProvider";
import { useDevTools, useSettings } from "@/modules/Settings/hooks";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DEV_TOOLS_PASSCODE,
  isDeveloperToolsUnlockedForSession,
  unlockDeveloperToolsForSession,
} from "../DeveloperToolsSession";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";
import { SeedDataButton } from "@/utils/SeedDataButton";

export function DeveloperToolsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const devTools = useDevTools();
  const { handleClearAllTransactions } = useSettings();
  const [passcode, setPasscode] = React.useState("");
  const [isUnlocked, setIsUnlocked] = React.useState(
    isDeveloperToolsUnlockedForSession(),
  );

  const handleUnlock = React.useCallback(() => {
    if (passcode === DEV_TOOLS_PASSCODE) {
      unlockDeveloperToolsForSession();
      setIsUnlocked(true);
      toast.success("Developer tools unlocked");
      return;
    }

    toast.error("Incorrect developer code");
    setPasscode("");
  }, [passcode]);

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader title="Developer Tools" onBack={() => navigation.goBack()} />

      {isUnlocked ? (
        <ScrollView
          contentContainerStyle={SettingsStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SectionLabel label="Notifications" />
          <SheetCard theme={theme}>
            <ActionRow
              icon="bell-check-outline"
              label="Notification Status"
              description={`Permission: ${devTools.notificationPermissionLabel}`}
              onPress={devTools.handleRefreshNotificationPermission}
              theme={theme}
            />
            <ActionRow
              icon="cog-outline"
              label="Open Notification Settings"
              description="Jump to system settings if notifications are off"
              onPress={devTools.handleOpenNotificationSettings}
              theme={theme}
            />
            <ActionRow
              icon="calendar-clock-outline"
              label="Test Daily Reminder"
              description="Checks reminder copy, channel, and tap routing"
              onPress={devTools.handleTestDailyReminder}
              theme={theme}
            />
            <ActionRow
              icon="chart-line"
              label="Test Monthly Insight"
              description="Checks insights prompt copy and navigation"
              onPress={devTools.handleTestMonthlyInsight}
              theme={theme}
            />
          </SheetCard>

          <SectionLabel label="Data" />
          <SheetCard theme={theme}>
            <SeedDataButton theme={theme} />
          </SheetCard>

          <SectionLabel label="Danger Zone" />
          <SheetCard theme={theme}>
            <ActionRow
              icon="delete-sweep-outline"
              label="Clear All Transactions"
              description="Permanently delete all data"
              onPress={handleClearAllTransactions}
              theme={theme}
              destructive
            />
          </SheetCard>
        </ScrollView>
      ) : null}

      <AnimatedPaperModal
        visible={!isUnlocked}
        onDismiss={() => navigation.goBack()}
        presentation="sheet"
        keyboardAware
        dismissable={false}
        contentContainerStyle={{
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingHorizontal: 20,
            paddingBottom: 24,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 42,
              height: 4,
              borderRadius: 999,
              backgroundColor: theme.colors.outlineVariant,
              marginBottom: 14,
            }}
          />

          <View style={{ paddingHorizontal: 4, gap: 14 }}>
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.colors.onSurface,
                }}
              >
                Enter Developer Code
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                This screen uses a simple 4-digit code.
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label="Passcode"
              value={passcode}
              onChangeText={(value) =>
                setPasscode(value.replace(/[^0-9]/g, "").slice(0, 4))
              }
              keyboardType="number-pad"
              secureTextEntry={false}
              maxLength={4}
              autoFocus
            />

            <Button
              mode="contained"
              onPress={handleUnlock}
              disabled={passcode.length !== 4}
            >
              Unlock
            </Button>
          </View>
        </View>
      </AnimatedPaperModal>
    </SafeAreaView>
  );
}
