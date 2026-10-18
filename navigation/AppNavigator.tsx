import { SpotlightTourProvider } from "@/modules/Onboarding/SpotlightTour";
import {
  AppShellProvider,
  useAppShell,
  type ShellTab,
} from "@/components/AppShellContext";
import { SharedTabHeaderProvider } from "@/components/pageheader/SharedTabHeader";
import { BottomTabBar } from "@/components/tabbar/BottomTabBar";
import {
  TabBarProvider,
  useSetTabBarEdgeButton,
  useSetTabBarHeight,
  useTabBarEdgeButton,
} from "@/components/tabbar/TabBarContext";
import { SHELL_TAB_ROUTES } from "@/constants/routes";
import { useAppDispatch } from "@/hooks/Redux";
import {
  fetchAccounts,
  fetchBudget,
  fetchCategories,
  fetchTransactions,
} from "@/modules/Core/Slices/TransactionSlice";
import { fetchWorkspaces } from "@/modules/Core/Slices/WorkspaceSlice";
import { TransactionsScreen } from "@/modules/Management/Transaction/Screens/TransactionsScreen";
import { OnboardingGate } from "@/modules/Onboarding/OnboardingGate";
import { OnboardingScreen } from "@/modules/Onboarding/OnboardingScreen";
import { SettingsScreen } from "@/modules/Settings/Index";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import type { RootParamList } from "./types";

const Stack = createNativeStackNavigator<RootParamList>();

function TabBarHeightResetter() {
  const setTabBarHeight = useSetTabBarHeight();
  const setTabBarEdgeButton = useSetTabBarEdgeButton();

  useEffect(() => {
    setTabBarHeight(0);
    setTabBarEdgeButton(null);
  }, [setTabBarEdgeButton, setTabBarHeight]);

  return null;
}

function ShellBottomBar() {
  const edgeButtons = useTabBarEdgeButton();
  const { activeTab, activeTabProgress, requestTab, requestTabProgress } =
    useAppShell();
  const visibleRoutes = SHELL_TAB_ROUTES;
  const activeIndex = visibleRoutes.findIndex(
    (route) => route.key === activeTab,
  );
  const actionButtons = (() => {
    const activeRoute = visibleRoutes[activeIndex];
    if (!activeRoute || (!edgeButtons?.left && !edgeButtons?.right)) {
      return undefined;
    }

    return {
      [activeRoute.key]: {
        left: edgeButtons.left
          ? {
              ...edgeButtons.left,
              label: edgeButtons.left.label ?? "",
            }
          : undefined,
        right: edgeButtons.right
          ? {
              ...edgeButtons.right,
              label: edgeButtons.right.label ?? "",
            }
          : undefined,
      },
    };
  })();

  if (activeIndex < 0) {
    return <TabBarHeightResetter />;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <BottomTabBar
        routes={visibleRoutes}
        activeIndex={activeIndex}
        activePosition={activeTabProgress}
        actionButtons={actionButtons}
        onTabPress={(index) => {
          requestTab(visibleRoutes[index].key as ShellTab);
        }}
        onTabDrag={(position) => {
          requestTabProgress(position);
        }}
      />
    </View>
  );
}

function TransactionsStackScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [isHydrated, setIsHydrated] = React.useState(false);

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      dispatch(fetchWorkspaces() as any),
      dispatch(fetchTransactions() as any),
      dispatch(fetchCategories("income") as any),
      dispatch(fetchCategories("expense") as any),
      dispatch(fetchAccounts() as any),
      dispatch(fetchBudget() as any),
    ]).then(() => {
      if (mounted) setIsHydrated(true);
    });

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  if (!isHydrated) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: theme.colors.background,
          flex: 1,
          justifyContent: "center",
        }}
      ></View>
    );
  }

  return (
    <SharedTabHeaderProvider activeRouteName="Transactions">
      <TransactionsScreen />
      <ShellBottomBar />
    </SharedTabHeaderProvider>
  );
}

function SettingsStackScreen() {
  return (
    // Settings has no bottom bar. Keep its empty state local so opening it
    // cannot erase the clearance of the still-mounted transaction screen.
    <TabBarProvider>
      <SettingsScreen />
    </TabBarProvider>
  );
}

function RootStackNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="OnboardingGate"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        statusBarStyle: theme.dark ? "light" : "dark",
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="OnboardingGate" component={OnboardingGate} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Transactions" component={TransactionsStackScreen} options={{ freezeOnBlur: false }} />
      <Stack.Screen name="Settings" component={SettingsStackScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <AppShellProvider>
      <SpotlightTourProvider>
        <RootStackNavigator />
      </SpotlightTourProvider>
    </AppShellProvider>
  );
}
