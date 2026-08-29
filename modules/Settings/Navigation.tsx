import { BudgetScreen } from "@/modules/Management/Budget/Index";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { AccountsScreen } from "./Screens/AccountsScreen";
import { CategoriesScreen } from "./Screens/CategoriesScreen";
import { DataScreen } from "./Screens/DataScreen";
import { DefaultsScreen } from "./Screens/DefaultsScreen";
import { MainSettingsScreen } from "./Screens/MainSettingsScreen";

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Categories: undefined;
  Accounts: undefined;
  Budget: undefined;
  Data: undefined;
  Defaults: undefined;
  Labs: undefined;
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
    </Stack.Navigator>
  );
}
