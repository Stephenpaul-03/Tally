import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

import { InsightsScreen } from "@/screens/InsightsScreen";
import { TransactionsScreen } from "@/screens/TransactionsScreen";

import type { RootParamList } from "@/navigation/types";
import { CalculatorScreen } from "@/screens/CalculatorScreen";

export type AppRouteName = keyof RootParamList;

export type AppRoute = {
  name: AppRouteName;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
  component: React.ComponentType<any>;
};

export const APP_ROUTES: AppRoute[] = [
  {
    name: "Calculator",
    title: "Calculator",
    focusedIcon: "Calculator",
    unfocusedIcon: "Calculator-outline",
    icon: ({ color, size }) =>
      React.createElement(MaterialCommunityIcons, {
        name: "view-dashboard",
        color,
        size,
      }),
    component: CalculatorScreen,
  },
  {
    name: "Transactions",
    title: "Transactions",
    focusedIcon: "cash-multiple",
    unfocusedIcon: "cash-multiple",
    icon: ({ color, size }) =>
      React.createElement(MaterialCommunityIcons, {
        name: "cash-multiple",
        color,
        size,
      }),
    component: TransactionsScreen,
  },
  {
    name: "Insights",
    title: "Insights",
    focusedIcon: "chart-line",
    unfocusedIcon: "chart-line",
    icon: ({ color, size }) =>
      React.createElement(MaterialCommunityIcons, {
        name: "chart-line",
        color,
        size,
      }),
    component: InsightsScreen,
  },
];

export const TAB_ROUTES = APP_ROUTES;
