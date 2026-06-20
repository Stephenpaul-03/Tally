import { BottomTabBar } from "@/components/tabbar/BottomTabBar";
import { useSetTabBarHeight } from "@/components/tabbar/TabBarContext";
import { APP_ROUTES, TAB_ROUTES } from "@/constants/routes";
import { SettingsScreen } from "@/modules/Settings/Index";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
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
  return (
    <Tab.Navigator
      initialRouteName="Transactions"
      backBehavior="history"
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

        const activeRouteName = state.routes[state.index]?.name;
        const activeIndex = visibleRoutes.findIndex(
          (r) => r.name === activeRouteName,
        );

        if (activeIndex < 0) return <TabBarHeightResetter />;
        return (
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <BottomTabBar
              routes={visibleRoutes}
              activeIndex={activeIndex}
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
  );
}

export function AppNavigator() {
  return <MobileTabsNavigator />;
}
