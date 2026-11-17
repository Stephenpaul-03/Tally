import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useAppShell } from "@/components/AppShellContext";
import { DesignText as Text } from "@/components/DesignText";
import { SHELL_TAB_ROUTES } from "@/constants/routes";
import { useMainDesign } from "@/hooks/use-main-design";
import type { RootParamList } from "@/navigation/types";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { useSetTabBarHeight, useTabBarEdgeButton, useTabBarHidden } from "./TabBarContext";
import { useTabBarModePreference } from "./TabBarModePreference";

/** One arrangement for both tablet styles; screen content owns the remaining width. */
export function TabletNavigationRail() {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  const { activeTab, requestTab } = useAppShell();
  const { tabletNavigationSide } = useTabBarModePreference();
  const { design } = useMainDesign();
  const edges = useTabBarEdgeButton();
  const hidden = useTabBarHidden();
  const setHeight = useSetTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  React.useLayoutEffect(() => { setHeight(0); }, [setHeight]);
  const edgeInset = tabletNavigationSide === "left" ? insets.left : insets.right;
  return <View style={{ width: 104 + edgeInset, backgroundColor: c.surface,
    paddingLeft: tabletNavigationSide === "left" ? edgeInset : 0,
    paddingRight: tabletNavigationSide === "right" ? edgeInset : 0,
    borderColor: c.outlineVariant,
    borderRightWidth: tabletNavigationSide === "left" ? 0.5 : 0,
    borderLeftWidth: tabletNavigationSide === "right" ? 0.5 : 0,
  }}>
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16,
        paddingHorizontal: 8, justifyContent: "center", gap: 12, opacity: hidden ? 0 : 1 }}
      pointerEvents={hidden ? "none" : "auto"}>
      {SHELL_TAB_ROUTES.map(route => {
        const selected = activeTab === route.key;
        const label = route.key === "calendar" ? "Transactions" : route.title;
        return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={label}
          accessibilityState={{ selected }} onPress={() => requestTab(route.key)}
          style={({ pressed }) => ({ minHeight: 72, paddingVertical: 12, paddingHorizontal: 2,
            alignItems: "center", justifyContent: "center", gap: 6,
            borderRadius: theme.expressive ? 24 : 16,
            backgroundColor: selected ? c.secondaryContainer : "transparent", opacity: pressed ? 0.65 : 1 })}>
          <MaterialCommunityIcons name={(selected ? route.focusedIcon : route.unfocusedIcon) as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
            size={26} color={selected ? c.onSecondaryContainer : c.onSurfaceVariant} />
          <Text style={{ fontSize: 11, fontWeight: selected ? "700" : "400", color: selected ? c.onSecondaryContainer : c.onSurfaceVariant }}>{label}</Text>
        </Pressable>;
      })}
      {design.layout === "classic" ? [edges?.left, edges?.right].map((action, index) => action ?
        <Pressable key={index} accessibilityRole="button" accessibilityLabel={action.accessibilityLabel ?? action.label}
          onPress={action.onPress} style={({ pressed }) => ({ minHeight: 56, borderRadius: 20, alignItems: "center",
            justifyContent: "center", backgroundColor: c.primaryContainer, opacity: pressed ? 0.65 : 1 })}>
          {action.icon({ color: c.onPrimaryContainer, size: 24 })}
        </Pressable> : null) : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => navigation.navigate("Settings")}
        style={({ pressed }) => ({ minHeight: 72, alignItems: "center", justifyContent: "center", gap: 6, opacity: pressed ? 0.65 : 1 })}>
        <MaterialCommunityIcons name="cog-outline" size={26} color={c.onSurfaceVariant} />
        <Text style={{ fontSize: 11, color: c.onSurfaceVariant }}>Settings</Text>
      </Pressable>
    </ScrollView>
  </View>;
}
