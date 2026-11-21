import type { RootParamList } from "@/navigation/types";
import { useRoute, type RouteProp } from "@react-navigation/native";
import React from "react";
import { SettingsNavigator } from "./Navigation";
import { useTabletLayout } from "@/hooks/use-tablet-layout";
import { TabletSettingsLayout } from "./Layouts/TabletSettingsLayout";

export function SettingsScreen() {
  const tablet = useTabletLayout();
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

  if (tablet) {
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
