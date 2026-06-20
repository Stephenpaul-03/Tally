import { ActionRow } from "@/components/ActionRow";
import { SheetCard } from "@/components/SheetCard";
import { useThemedAsset } from "@/hooks/use-themed-insights";
import { DevSheet } from "@/modules/Settings/Components/DevSheet";
import { useDevTools, useSettings } from "@/modules/Settings/hooks";
import { typography } from "@/theme/typography";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import React from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

export function AboutScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const appVersion = Constants.expoConfig?.version ?? "0.1.0";
  const devTools = useDevTools();
  const { handleSeedData, handleClearAllTransactions } = useSettings();
  const [devSheetOpen, setDevSheetOpen] = React.useState(false);
  const logoSource = useThemedAsset("logo");
  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader title="About" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open developer tools"
            onLongPress={() => setDevSheetOpen(true)}
            delayLongPress={400}
            style={[
              styles.appIcon,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <Image
              source={logoSource}
              style={styles.appImage}
              resizeMode="contain"
            />
          </Pressable>
          <Text
            variant="headlineMedium"
            style={[
              styles.appName,
              { ...typography.editorial.sectionLabel, fontSize: 28 },
            ]}
          >
            Tally
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Offline-first finance tracker
          </Text>
        </View>

        {/* ── Support ──────────────────────────────────────── */}
        <SectionLabel label="Support" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="heart-outline"
            label="Support Development"
            description="Help fund future updates"
            onPress={() => Linking.openURL("https://buymeacoffee.com")}
            theme={theme}
            showChevron
          />
          <ActionRow
            icon="message-alert-outline"
            label="Report an Issue"
            description="Help improve Tally"
            onPress={() => Linking.openURL("mailto:support@tally.app")}
            theme={theme}
            showChevron
          />
          <ActionRow
            icon="lightbulb-outline"
            label="Suggest a Feature"
            description="Share your ideas with us"
            onPress={() =>
              Linking.openURL(
                "mailto:support@tally.app?subject=Feature Suggestion",
              )
            }
            theme={theme}
            showChevron
          />
        </SheetCard>

        {/* ── Legal ────────────────────────────────────────── */}
        <SectionLabel label="Legal" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="shield-check-outline"
            label="Privacy Policy"
            description="How your data is handled"
            onPress={() => navigation.navigate("Workspaces")}
            theme={theme}
            showChevron
          />
          <ActionRow
            icon="file-document-outline"
            label="Open Source Licenses"
            description="Third-party acknowledgements"
            onPress={() => navigation.navigate("Workspaces")}
            theme={theme}
            showChevron
          />
        </SheetCard>

        {/* ── Version ──────────────────────────────────────── */}
        <SectionLabel label="Version" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="information-outline"
            label="Version"
            description="Installed app build"
            onPress={() => {}}
            theme={theme}
            showChevron={false}
            rightElement={
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {appVersion}
              </Text>
            }
          />
        </SheetCard>

        <DevSheet
          visible={devSheetOpen}
          onDismiss={() => setDevSheetOpen(false)}
          notificationPermissionLabel={devTools.notificationPermissionLabel}
          handleRefreshNotificationPermission={
            devTools.handleRefreshNotificationPermission
          }
          handleOpenNotificationSettings={
            devTools.handleOpenNotificationSettings
          }
          handleTestDailyReminder={devTools.handleTestDailyReminder}
          handleTestMonthlyInsight={devTools.handleTestMonthlyInsight}
          handleTestPendingUpiRecovery={devTools.handleTestPendingUpiRecovery}
          handleTestFailedTransactionFollowUp={
            devTools.handleTestFailedTransactionFollowUp
          }
          handleSeedData={handleSeedData}
          handleClearAllTransactions={handleClearAllTransactions}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    overflow: "hidden",
  },
  appImage: {
    width: 120,
    height: 120,
  },
  appName: {
    fontWeight: "700",
  },
});
