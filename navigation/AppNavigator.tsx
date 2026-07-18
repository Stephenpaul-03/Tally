import { SharedTabHeaderProvider } from "@/components/pageheader/SharedTabHeader";
import {
  AppShellProvider,
  useAppShell,
  type ShellTab,
} from "@/components/AppShellContext";
import { BottomTabBar } from "@/components/tabbar/BottomTabBar";
import {
  useSetTabBarHeight,
  useTabBarEdgeButton,
  useSetTabBarEdgeButton,
} from "@/components/tabbar/TabBarContext";
import { SHELL_TAB_ROUTES } from "@/constants/routes";
import { SettingsScreen } from "@/modules/Settings/Index";
import { TransactionsScreen } from "@/screens/TransactionsScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
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
  const activeIndex = visibleRoutes.findIndex((route) => route.key === activeTab);
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
  return (
    <SharedTabHeaderProvider activeRouteName="Transactions">
      <TransactionsScreen />
      <ShellBottomBar />
    </SharedTabHeaderProvider>
  );
}

function SettingsStackScreen() {
  return (
    <>
      <TabBarHeightResetter />
      <SettingsScreen />
    </>
  );
}

function RootStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Transactions"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Transactions" component={TransactionsStackScreen} />
      <Stack.Screen name="Settings" component={SettingsStackScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <AppShellProvider>
      <RootStackNavigator />
    </AppShellProvider>
  );
}
