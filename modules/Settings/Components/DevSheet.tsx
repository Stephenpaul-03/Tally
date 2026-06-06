import { AnimatedPaperModal } from "@/components/modal/modal";
import React from "react";
import { ScrollView, View } from "react-native";
import { Divider, List, Text, useTheme } from "react-native-paper";
import { devStyles } from "../Styles";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  notificationPermissionLabel: string;
  handleRefreshNotificationPermission: () => void;
  handleOpenNotificationSettings: () => void;
  handleTestDailyReminder: () => void;
  handleTestMonthlyInsight: () => void;
  handleTestPendingUpiRecovery: () => void;
  handleTestFailedTransactionFollowUp: () => void;
  handleSeedData: () => void;
  handleClearAllTransactions: () => void;
};

export function DevSheet({
  visible,
  onDismiss,
  notificationPermissionLabel,
  handleRefreshNotificationPermission,
  handleOpenNotificationSettings,
  handleTestDailyReminder,
  handleTestMonthlyInsight,
  handleTestPendingUpiRecovery,
  handleTestFailedTransactionFollowUp,
  handleSeedData,
  handleClearAllTransactions,
}: Props) {
  const theme = useTheme();
  const itemTitleStyle = { color: theme.colors.onSurface };
  const itemDescStyle = { color: theme.colors.onSurfaceVariant };

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={[
        devStyles.sheetContainer,
        {
          backgroundColor: theme.colors.elevation.level2,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
      ]}
    >
      <View style={devStyles.handleWrap}>
        <View
          style={[devStyles.handle, { backgroundColor: theme.colors.outlineVariant }]}
        />
      </View>
      <Text
        style={[devStyles.sheetLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        Developer Tools
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <List.Item
          title="Notification Status"
          description={`Permission: ${notificationPermissionLabel}`}
          titleStyle={itemTitleStyle}
          descriptionStyle={itemDescStyle}
          left={(props) => (
            <List.Icon {...props} icon="bell-check-outline" color={theme.colors.secondary} />
          )}
          right={(props) => <List.Icon {...props} icon="refresh" />}
          onPress={handleRefreshNotificationPermission}
          style={devStyles.listItem}
        />
        <Divider style={{ marginLeft: 16 }} />
        <List.Item
          title="Open Notification Settings"
          description="Jump to system settings if notifications are off"
          titleStyle={itemTitleStyle}
          descriptionStyle={itemDescStyle}
          left={(props) => (
            <List.Icon {...props} icon="cog-outline" color={theme.colors.secondary} />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleOpenNotificationSettings}
          style={devStyles.listItem}
        />
        <Divider style={{ marginLeft: 16 }} />
        <List.Item
          title="Test Daily Reminder"
          description="Checks reminder copy, channel, and tap routing"
          titleStyle={itemTitleStyle}
          descriptionStyle={itemDescStyle}
          left={(props) => (
            <List.Icon {...props} icon="calendar-clock-outline" color={theme.colors.secondary} />
          )}
          right={(props) => <List.Icon {...props} icon="send-outline" />}
          onPress={handleTestDailyReminder}
          style={devStyles.listItem}
        />
        <Divider style={{ marginLeft: 16 }} />
        <List.Item
          title="Test Monthly Insight"
          description="Checks insights prompt copy and navigation"
          titleStyle={itemTitleStyle}
          descriptionStyle={itemDescStyle}
          left={(props) => (
            <List.Icon {...props} icon="chart-line" color={theme.colors.secondary} />
          )}
          right={(props) => <List.Icon {...props} icon="send-outline" />}
          onPress={handleTestMonthlyInsight}
          style={devStyles.listItem}
        />
        <Divider style={{ marginLeft: 16 }} />
        <List.Item
          title="Test Pending UPI Recovery"
          description="Checks action buttons and transaction payload routing"
          titleStyle={itemTitleStyle}
          descriptionStyle={itemDescStyle}
          left={(props) => (
            <List.Icon {...props} icon="cash-refund" color={theme.colors.secondary} />
          )}
          right={(props) => <List.Icon {...props} icon="send-outline" />}
          onPress={handleTestPendingUpiRecovery}
          style={devStyles.listItem}
        />
        <Divider style={{ marginLeft: 16 }} />
        <List.Item
          title="Test Failed Transaction Follow-Up"
          description="Checks transaction follow-up copy and routing"
          titleStyle={itemTitleStyle}
          descriptionStyle={itemDescStyle}
          left={(props) => (
            <List.Icon {...props} icon="alert-circle-check-outline" color={theme.colors.secondary} />
          )}
          right={(props) => <List.Icon {...props} icon="send-outline" />}
          onPress={handleTestFailedTransactionFollowUp}
          style={devStyles.listItem}
        />
        <Divider style={{ marginLeft: 16 }} />
        <List.Item
          title="Seed Test Data"
          description="Add Mar-Apr sample transactions (INR)"
          titleStyle={itemTitleStyle}
          descriptionStyle={itemDescStyle}
          left={(props) => (
            <List.Icon {...props} icon="database-plus-outline" color={theme.colors.secondary} />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleSeedData}
          style={devStyles.listItem}
        />
        <Divider style={{ marginLeft: 16 }} />
        <List.Item
          title="Clear All Transactions"
          description="Permanently delete all data"
          titleStyle={{ color: theme.colors.error }}
          descriptionStyle={itemDescStyle}
          left={(props) => (
            <List.Icon {...props} icon="delete-sweep-outline" color={theme.colors.error} />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleClearAllTransactions}
          style={devStyles.listItem}
        />
      </ScrollView>
    </AnimatedPaperModal>
  );
}