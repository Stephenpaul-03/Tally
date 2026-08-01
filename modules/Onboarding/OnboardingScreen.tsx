import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { OnboardingProvider } from "./OnboardingContext";
import { AccountCreateScreen } from "./Screens/AccountCreateScreen";
import { AppearanceScreen } from "./Screens/AppearanceScreen";
import { BudgetScreen } from "./Screens/BudgetScreen";
import { CategoriesScreen } from "./Screens/CategoriesScreen";
import { CategoryCreateScreen } from "./Screens/CategoryCreateScreen";
import { DefaultsScreen } from "./Screens/DefaultsScreen";
import { PrivacyScreen } from "./Screens/PrivacyScreen";
import { WelcomeScreen } from "./Screens/WelcomeScreen";
import { WorkspaceScreen } from "./Screens/WorkspaceScreen";

export type OnboardingStackParamList = {
  Welcome: undefined;
  Appearance: undefined;
  Workspace: undefined;
  Accounts: undefined;
  AccountCreate: undefined;
  IncomeCategories: undefined;
  ExpenseCategories: undefined;
  CategoryCreate: { type: "income" | "expense" };
  Budget: undefined;
  Defaults: undefined;
  Privacy: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingScreen() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Appearance" component={AppearanceScreen} />
        <Stack.Screen name="Workspace" component={WorkspaceScreen} />
        <Stack.Screen name="Accounts" component={CategoriesScreen} />
        <Stack.Screen name="AccountCreate" component={AccountCreateScreen} />
        <Stack.Screen name="IncomeCategories" component={CategoriesScreen} />
        <Stack.Screen name="ExpenseCategories" component={CategoriesScreen} />
        <Stack.Screen name="CategoryCreate" component={CategoryCreateScreen} />
        <Stack.Screen name="Budget" component={BudgetScreen} />
        <Stack.Screen name="Defaults" component={DefaultsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
