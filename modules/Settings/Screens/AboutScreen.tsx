import { ActionRow } from "@/modules/Common/Components/HeaderMenuModal/Molecules/ActionRow";
import { SheetCard } from "@/modules/Common/Components/SheetCard";
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
              source={require("@/assets/images/icon.png")}
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
            icon="coffee-outline"
            label="Buy Me a Coffee"
            description="Support development"
            onPress={() => Linking.openURL("https://buymeacoffee.com")}
            theme={theme}
            showChevron
          />
          <ActionRow
            icon="star-outline"
            label="Rate Tally"
            description="Leave a review on Play Store"
            onPress={() =>
              Linking.openURL(
                "https://play.google.com/store/apps/details?id=com.tally",
              )
            }
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
    width: 80,
    height: 80,
  },
  appName: {
    fontWeight: "700",
  },
});
