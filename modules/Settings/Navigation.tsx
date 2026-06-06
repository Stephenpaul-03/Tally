import type { Workspace } from "@/modules/Common/Repository/SQLiteRepo";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { AboutScreen } from "./Screens/AboutScreen";
import { AccountsScreen } from "./Screens/AccountsScreen";
import { AppearanceScreen } from "./Screens/AppearanceScreen";
import { BackupExportScreen } from "./Screens/BackupExportScreen";
import { BackupImportScreen } from "./Screens/BackupImportScreen";
import { CategoriesScreen } from "./Screens/CategoriesScreen";
import { DataScreen } from "./Screens/DataScreen";
import { LabsScreen } from "./Screens/LabsScreen";
import { MainSettingsScreen } from "./Screens/MainSettingsScreen";
import { WorkspaceEditScreen } from "./Screens/WorkspaceEditScreen";
import { WorkspacesScreen } from "./Screens/WorkspacesScreen";

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Categories: undefined;
  Accounts: undefined;
  Workspaces: undefined;
  Data: undefined;
  Appearances: undefined;
  Labs: undefined;
  About: undefined;
  BackupExport: undefined;
  BackupImport: undefined;
  WorkspaceEdit: { workspace?: Workspace };
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
      <Stack.Screen name="Workspaces" component={WorkspacesScreen} />
      <Stack.Screen name="Data" component={DataScreen} />
      <Stack.Screen name="Appearances" component={AppearanceScreen} />
      <Stack.Screen name="Labs" component={LabsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="BackupExport" component={BackupExportScreen} />
      <Stack.Screen name="BackupImport" component={BackupImportScreen} />
      <Stack.Screen name="WorkspaceEdit" component={WorkspaceEditScreen} />
    </Stack.Navigator>
  );
}
