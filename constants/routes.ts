import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

import { CalendarScreen } from "@/screens/CalendarScreen";
import { InsightsScreen } from "@/screens/InsightsScreen";
import { TransactionsScreen } from "@/screens/TransactionsScreen";
import type { RootParamList } from "@/navigation/types";

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
    name: "Calendar",
    title: "Calendar",
    focusedIcon: "calendar",
    unfocusedIcon: "calendar-outline",
    icon: ({ color, size }) =>
      React.createElement(MaterialCommunityIcons, {
        name: "calendar",
        color,
        size,
      }),
    component: CalendarScreen,
  },
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
