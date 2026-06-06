import React from "react";
import { useRoute, type RouteProp } from "@react-navigation/native";
import type { RootParamList } from "@/navigation/types";
import { SettingsNavigator } from "./Navigation";

export function SettingsScreen() {
  const route = useRoute<RouteProp<RootParamList, "Settings">>();
  const initialRouteName =
    route.params?.section === "notification-reminders"
      ? "Labs"
      : "SettingsHome";

  return (
    <SettingsNavigator
      key={initialRouteName}
      initialRouteName={initialRouteName}
    />
  );
}
