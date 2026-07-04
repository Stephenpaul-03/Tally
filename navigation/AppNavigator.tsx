import { SharedTabHeaderProvider } from "@/components/pageheader/SharedTabHeader";
import { BottomTabBar } from "@/components/tabbar/BottomTabBar";
import {
  useSetTabBarHeight,
  useTabBarEdgeButton,
} from "@/components/tabbar/TabBarContext";
import { APP_ROUTES, TAB_ROUTES } from "@/constants/routes";
import { SettingsScreen } from "@/modules/Settings/Index";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { AppRouteName } from "@/constants/routes";
import type { RootParamList } from "./types";

const Tab = createBottomTabNavigator<RootParamList>();

function TabBarHeightResetter() {
  const setTabBarHeight = useSetTabBarHeight();
  useEffect(() => {
    setTabBarHeight(0);
  }, [setTabBarHeight]);
  return null;
}

function MobileTabsNavigator() {
  const edgeButtons = useTabBarEdgeButton();
  const [activeRouteName, setActiveRouteName] =
    useState<AppRouteName | null>("Transactions");

  return (
    <SharedTabHeaderProvider activeRouteName={activeRouteName}>
      <Tab.Navigator
        initialRouteName="Transactions"
        backBehavior="history"
        screenListeners={({ route }) => ({
          focus: () => {
            if (APP_ROUTES.some((tabRoute) => tabRoute.name === route.name)) {
              setActiveRouteName(route.name as AppRouteName);
              return;
            }
            setActiveRouteName(null);
          },
        })}
        screenOptions={{ headerShown: false }}
        tabBar={({ navigation, state }) => {
          const stateRoutesByName = new Map(state.routes.map((r) => [r.name, r]));
          const visibleRoutes = TAB_ROUTES.map((tab) => {
            const stateRoute = stateRoutesByName.get(tab.name);
            return {
              key: stateRoute?.key ?? tab.name,
              name: tab.name,
              title: tab.title,
              icon: tab.icon,
            };
          });

          const activeTabRouteName = state.routes[state.index]?.name;
          const activeIndex = visibleRoutes.findIndex(
            (r) => r.name === activeTabRouteName,
          );
          const actionButtons = (() => {
            const activeRoute = visibleRoutes.find(
              (route) => route.name === activeTabRouteName,
            );
            if (!activeRoute || (!edgeButtons?.left && !edgeButtons?.right)) {
              return undefined;
            }
            return {
              [activeRoute.key]: {
                left: edgeButtons.left ?? undefined,
                right: edgeButtons.right ?? undefined,
              },
            };
          })();

          if (activeIndex < 0) return <TabBarHeightResetter />;
          return (
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              <BottomTabBar
                routes={visibleRoutes}
                activeIndex={activeIndex}
                actionButtons={actionButtons}
                onTabPress={(index) => {
                  const route = visibleRoutes[index];
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!event.defaultPrevented) {
                    navigation.navigate(route.name as never);
                  }
                }}
              />
            </View>
          );
        }}
      >
        {APP_ROUTES.map((route) => {
          const ScreenComponent = route.component;

          return (
            <Tab.Screen
              key={route.name}
              name={route.name}
              options={{
                title: route.title,
                tabBarIcon: route.icon,
              }}
            >
              {() => <ScreenComponent />}
            </Tab.Screen>
          );
        })}
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </SharedTabHeaderProvider>
  );
}

export function AppNavigator() {
  return <MobileTabsNavigator />;
}
