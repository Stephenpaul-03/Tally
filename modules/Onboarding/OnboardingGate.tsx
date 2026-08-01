import { useAppDispatch } from "@/hooks/Redux";
import { fetchTransactions } from "@/modules/Core/Slices/TransactionSlice";
import { fetchWorkspaces } from "@/modules/Core/Slices/WorkspaceSlice";
import { store } from "@/modules/Core/Store";
import { CommonActions, useNavigation } from "@react-navigation/native";
import React from "react";
import { View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";
import {
  isFirstRunOnboardingComplete,
  markFirstRunOnboardingComplete,
} from "./storage";

export function OnboardingGate() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      await Promise.all([
        dispatch(fetchWorkspaces() as any),
        dispatch(fetchTransactions() as any),
      ]);
      let complete = await isFirstRunOnboardingComplete();
      const hasExistingTransactions =
        store.getState().transactions.transactions.length > 0;
      if (!complete && hasExistingTransactions) {
        await markFirstRunOnboardingComplete();
        complete = true;
      }
      if (!mounted) return;
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            complete
              ? { name: "Transactions" }
              : { name: "Onboarding", params: { mode: "first-run" } },
          ],
        }),
      );
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch, navigation]);

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: theme.colors.background,
        flex: 1,
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}
