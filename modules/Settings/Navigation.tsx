import { GoalsScreen } from "@/modules/Goals/GoalsScreen";
import {
  MotionEntranceScope,
  useMotionEnabled,
} from "@/components/animations/Motion";
import { Platform } from "react-native";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { BudgetScreen } from "@/modules/Management/Budget/Index";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useTheme } from "react-native-paper";
import { AccountsScreen } from "./Screens/AccountsScreen";
import { CategoriesScreen } from "./Screens/CategoriesScreen";
import { DataScreen } from "./Screens/DataScreen";
import { DefaultsScreen } from "./Screens/DefaultsScreen";
import { MainSettingsScreen } from "./Screens/MainSettingsScreen";

export type SettingsStackParamList = {
  SettingsHome: { openWorkspaces?: boolean } | undefined;
  Categories: undefined;
  Accounts: undefined;
  Budget: undefined;
  Goals: undefined;
  Data: undefined;
  Defaults: undefined;
  Labs: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

type Props = {
  initialRouteName?: keyof SettingsStackParamList;
  openWorkspaces?: boolean;
};

export function SettingsNavigator({
  initialRouteName = "SettingsHome",
  openWorkspaces = false,
}: Props) {
  const motionEnabled = useMotionEnabled();
  const theme = useTheme<ExtendedMD3Theme>();
  return (
    <MotionEntranceScope>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          statusBarStyle: theme.dark ? "light" : "dark",
          animation: !motionEnabled
            ? "none"
            : theme.expressive
              ? Platform.OS === "ios"
                ? "simple_push"
                : "ios_from_right"
              : "slide_from_right",
          freezeOnBlur: false,
        }}
      >
        <Stack.Screen
          name="SettingsHome"
          component={MainSettingsScreen}
          initialParams={{ openWorkspaces }}
        />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Accounts" component={AccountsScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen name="Budget" component={BudgetScreen} />
        <Stack.Screen name="Data" component={DataScreen} />
        <Stack.Screen name="Defaults" component={DefaultsScreen} />
      </Stack.Navigator>
    </MotionEntranceScope>
  );
}
