import type { RootParamList } from "@/navigation/types";
import { useRoute, type RouteProp } from "@react-navigation/native";
import React from "react";
import { SettingsNavigator } from "./Navigation";
import { useWindowDimensions } from "react-native";
import { TabletSettingsLayout } from "./Layouts/TabletSettingsLayout";

export function SettingsScreen() {
  const { width, height } = useWindowDimensions();
  const route = useRoute<RouteProp<RootParamList, "Settings">>();
  const initialRouteName =
    route.params?.section === "notification-reminders"
      ? "Labs"
      : route.params?.section === "recurring"
        ? "Recurring"
        : route.params?.section === "goals"
        ? "Goals"
        : route.params?.section === "budget"
          ? "Budget"
          : "SettingsHome";

  if (Math.min(width, height) >= 600 && width >= 768) {
    return <TabletSettingsLayout initialPage={initialRouteName} />;
  }
  return (
    <SettingsNavigator
      key={initialRouteName}
      initialRouteName={initialRouteName}
      openWorkspaces={route.params?.section === "workspaces"}
    />
  );
}
