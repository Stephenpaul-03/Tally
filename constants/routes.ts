import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

import type { ShellTab } from "@/components/AppShellContext";
import type { RootParamList } from "@/navigation/types";
import { TransactionsScreen } from "@/screens/TransactionsScreen";

export type AppRouteName = keyof RootParamList;

export type AppRoute = {
  name: AppRouteName;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
  component: React.ComponentType<any>;
};

export type ShellTabRoute = {
  key: ShellTab;
  name: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
};

export const APP_ROUTES: AppRoute[] = [
  {
    name: "Transactions",
    title: "Tally",
    focusedIcon: "home",
    unfocusedIcon: "home-outline",
    icon: ({ color, size }) =>
      React.createElement(MaterialCommunityIcons, {
        name: "home",
        color,
        size,
      }),
    component: TransactionsScreen,
  },
];

export const SHELL_TAB_ROUTES: ShellTabRoute[] = [
  {
    key: "calendar",
    name: "Calendar",
    title: "Transaction",
    focusedIcon: "calendar",
    unfocusedIcon: "calendar-outline",
    icon: ({ color, size }) =>
      React.createElement(MaterialCommunityIcons, {
        name: "calendar",
        color,
        size,
      }),
  },
  {
    key: "transactions",
    name: "Transactions",
    title: "Home",
    focusedIcon: "home",
    unfocusedIcon: "home-outline",
    icon: ({ color, size }) =>
      React.createElement(MaterialCommunityIcons, {
        name: "home",
        color,
        size,
      }),
  },
  {
    key: "insights",
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
  },
];

export const TAB_ROUTES = SHELL_TAB_ROUTES;
