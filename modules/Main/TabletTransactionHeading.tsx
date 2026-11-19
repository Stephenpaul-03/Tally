import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DesignText as Text } from "@/components/DesignText";
import { useTabletLandscape } from "@/hooks/use-tablet-landscape";
import type { RootParamList } from "@/navigation/types";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { TabletWorkspaceButton } from "./TabletDashboard";

export function TabletTransactionHeading({ month, count, onMonth }: { month: string; count: number; onMonth: () => void }) {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors;
  const landscape = useTabletLandscape();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  return <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, gap: 6 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text accessibilityRole="header" style={{ ...(theme.expressive ? { fontWeight: "800" } as const : typography.editorial.hero), fontSize: 28, lineHeight: 36, color: c.onSurface, flex: 1 }}>Transactions</Text>
      <TabletWorkspaceButton />
      <Pressable accessibilityRole="button" accessibilityLabel="Choose transaction month" onPress={onMonth}
        style={{ minHeight: 44, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: theme.expressive ? 22 : 12, backgroundColor: c.surface }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: c.onSurface }}>{new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</Text>
        <Icon name="chevron-down" size={18} color={c.onSurfaceVariant} />
      </Pressable>
      {!landscape ? <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => navigation.navigate("Settings")}
        style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}><Icon name="cog-outline" size={22} color={c.onSurface} /></Pressable> : null}
    </View>
    <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{count} {count === 1 ? "entry" : "entries"}</Text>
  </View>;
}
