import { useAppShell } from "@/components/AppShellContext";
import type { RootParamList } from "@/navigation/types";
import { useRoute, type RouteProp } from "@react-navigation/native";
import React from "react";
import Transactions from "../Index";

export function TransactionsScreen() {
  const route = useRoute<RouteProp<RootParamList, "Transactions">>();
  const { requestTab } = useAppShell();
  const shellTab = route.params?.shellTab;

  React.useEffect(() => {
    if (shellTab) {
      requestTab(shellTab);
    }
  }, [requestTab, shellTab]);

  return <Transactions initialSelectedDate={route.params?.date} />;
}
