import type { RootParamList } from "@/navigation/types";
import { useRoute, type RouteProp } from "@react-navigation/native";
import React from "react";
import { SettingsNavigator } from "./Navigation";

export function SettingsScreen() {
  const route = useRoute<RouteProp<RootParamList, "Settings">>();
  const initialRouteName =
    route.params?.section === "notification-reminders"
      ? "Labs"
      : route.params?.section === "workspaces"
        ? "Workspaces"
      : "SettingsHome";

  return (
    <SettingsNavigator
      key={initialRouteName}
      initialRouteName={initialRouteName}
    />
  );
}
