import { BudgetScreen } from "@/modules/Management/Budget/Index";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { AccountsScreen } from "./Screens/AccountsScreen";
import { AppearanceScreen } from "./Screens/AppearanceScreen";
import { BackupExportScreen } from "./Screens/BackupExportScreen";
import { BackupImportScreen } from "./Screens/BackupImportScreen";
import { CategoriesScreen } from "./Screens/CategoriesScreen";
import { DataScreen } from "./Screens/DataScreen";
import { DefaultsScreen } from "./Screens/DefaultsScreen";
import { DeveloperToolsScreen } from "./Screens/DeveloperToolsScreen";
import { MainSettingsScreen } from "./Screens/MainSettingsScreen";
import { NotificationsScreen } from "./Screens/NotificationsScreen";
import { SecurityScreen } from "./Screens/SecurityScreen";

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Categories: undefined;
  Accounts: undefined;
  Budget: undefined;
  Data: undefined;
  Defaults: undefined;
  Notifications: undefined;
  Security: undefined;
  Appearances: undefined;
  Labs: undefined;
  DeveloperTools: undefined;
  BackupExport: undefined;
  BackupImport: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

type Props = {
  initialRouteName?: keyof SettingsStackParamList;
};

export function SettingsNavigator({
  initialRouteName = "SettingsHome",
}: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="SettingsHome" component={MainSettingsScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Accounts" component={AccountsScreen} />
      <Stack.Screen name="Budget" component={BudgetScreen} />
      <Stack.Screen name="Data" component={DataScreen} />
      <Stack.Screen name="Defaults" component={DefaultsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Appearances" component={AppearanceScreen} />
      <Stack.Screen name="DeveloperTools" component={DeveloperToolsScreen} />
      <Stack.Screen name="BackupExport" component={BackupExportScreen} />
      <Stack.Screen name="BackupImport" component={BackupImportScreen} />
    </Stack.Navigator>
  );
}
