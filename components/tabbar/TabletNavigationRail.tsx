import React from "react";
import { ScrollView, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAppShell } from "@/components/AppShellContext";
import { SHELL_TAB_ROUTES } from "@/constants/routes";
import { useMainDesign } from "@/hooks/use-main-design";
import type { RootParamList } from "@/navigation/types";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { useSetTabBarHeight, useTabBarHidden } from "./TabBarContext";
import { useTabBarModePreference } from "./TabBarModePreference";
import { ClassicRailDestination, ExpressiveRailDestination } from "./TabletRailDestinations";

/** One arrangement for both tablet styles; screen content owns the remaining width. */
export function TabletNavigationRail() {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  const { activeTab, requestTab } = useAppShell();
  const { tabletNavigationSide } = useTabBarModePreference();
  const { design } = useMainDesign();
  const expressive = design.layout === "sage";
  const Destination = expressive ? ExpressiveRailDestination : ClassicRailDestination;
  const hidden = useTabBarHidden();
  const setHeight = useSetTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  React.useLayoutEffect(() => { setHeight(0); }, [setHeight]);
  const edgeInset = tabletNavigationSide === "left" ? insets.left : insets.right;
  return <View style={{ width: 112 + edgeInset, backgroundColor: expressive ? c.surface : c.background,
    paddingLeft: tabletNavigationSide === "left" ? edgeInset : 0,
    paddingRight: tabletNavigationSide === "right" ? edgeInset : 0,
    borderColor: c.outlineVariant,
    borderRightWidth: tabletNavigationSide === "left" ? 0.5 : 0,
    borderLeftWidth: tabletNavigationSide === "right" ? 0.5 : 0,
  }}>
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 16, paddingBottom: 16,
        paddingHorizontal: 10, justifyContent: "center", gap: expressive ? 10 : 6, opacity: hidden ? 0 : 1 }}
      pointerEvents={hidden ? "none" : "auto"}>
      {SHELL_TAB_ROUTES.map(route => {
        const selected = activeTab === route.key;
        const label = route.key === "calendar" ? "Transactions" : route.title;
        return <Destination key={route.key} label={label} selected={selected} onPress={() => requestTab(route.key)}
          icon={(selected ? route.focusedIcon : route.unfocusedIcon) as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} />;
      })}
    </ScrollView>
    <View pointerEvents={hidden ? "none" : "auto"} style={{ paddingHorizontal: 10, paddingBottom: insets.bottom + 16, opacity: hidden ? 0 : 1 }}>
      <Destination label="Settings" icon="cog-outline" settings onPress={() => navigation.navigate("Settings")} />
    </View>
  </View>;
}
