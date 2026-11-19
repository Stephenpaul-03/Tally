import React from "react";
import { Pressable, View } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DesignText as Text } from "@/components/DesignText";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import type { RootParamList } from "@/navigation/types";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { ProgressRing } from "@/modules/Insights/components/ExpressiveOverview";
import { TabletCardStretchContext } from "@/components/CardWidthContext";

export function TabletCard({ title, action, onAction, headerAction, children }: {
  title: string; action?: string; onAction?: () => void; children: React.ReactNode; headerAction?: React.ReactNode;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const stretch = React.useContext(TabletCardStretchContext);
  return <View style={{ flexGrow: stretch ? 1 : undefined, padding: 14, gap: 8, borderRadius: theme.expressive ? 24 : 16,
    backgroundColor: theme.colors.surface, borderWidth: theme.expressive ? 0 : 0.5, borderColor: theme.colors.outlineVariant }}>
    <View style={{ flexDirection: "row", alignItems: "center", minHeight: 32, gap: 8 }}>
      <Text accessibilityRole="header" style={{ ...(theme.expressive ? { fontSize: 17, fontWeight: "800" } as const : typography.editorial.sectionLabel), color: theme.colors.onSurface, flex: 1 }}>{title}</Text>
      {headerAction}
      {onAction ? <Pressable accessibilityRole="button" accessibilityLabel={`${action || "View all"} ${title.toLowerCase()}`}
        onPress={onAction} hitSlop={6} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.primary }}>{action || "View all"} →</Text>
      </Pressable> : null}
    </View>
    {children}
  </View>;
}

export function TabletWorkspaceButton() {
  const theme = useTheme<ExtendedMD3Theme>();
  const workspace = useAppSelector(selectActiveWorkspace);
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Switch workspace, ${workspace?.name || "Workspace"}`}
    onPress={() => navigation.navigate("Settings", { section: "workspaces" })}
    style={{ minHeight: 44, maxWidth: 180, paddingHorizontal: 12, borderRadius: theme.expressive ? 22 : 12,
      flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.colors.surface }}>
    <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 13, fontWeight: "600", color: theme.colors.onSurface }}>{workspace?.name || "Workspace"}</Text>
    <Icon name="chevron-down" size={17} color={theme.colors.onSurfaceVariant} />
  </Pressable>;
}

export function TabletMetrics({ income, spent, balance, money, onIncome, onSpent, percent, compact = false }: {
  income: number; spent: number; balance: number; money: (value: number) => string;
  onIncome: () => void; onSpent: () => void; percent?: number | null;
  compact?: boolean;
}) {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors;
  const metrics = [
    { label: "Balance", value: balance, color: balance < 0 ? theme.semantic.expense : c.onSurface, background: c.surfaceVariant, icon: "wallet-outline", action: undefined },
    { label: "Income", value: income, color: theme.semantic.income, background: theme.dark ? "#20392B" : "#E5F2E7", icon: "arrow-bottom-left", action: onIncome },
    { label: "Spent", value: spent, color: theme.semantic.expense, background: c.errorContainer, icon: "arrow-top-right", action: onSpent },
  ] as const;
  const ring = percent !== undefined ? <View accessibilityLabel={percent === null ? "No income recorded" : `${percent.toFixed(1)}% of income spent`}
      style={{ width: 88, justifyContent: "center", alignItems: "center", gap: 3 }}>
      <View style={{ width: 64, height: 64, justifyContent: "center", alignItems: "center" }}>
        <View style={{ position: "absolute", width: 128, height: 128, left: -32, top: -32, transform: [{ scale: 0.5 }] }}><ProgressRing percent={percent || 0} /></View>
        <Text style={{ fontWeight: "800", fontSize: 14, color: c.onSurface }}>{percent === null ? "—" : `${percent.toFixed(1)}%`}</Text>
      </View>
      <Text style={{ fontSize: 10, color: c.onSurfaceVariant }}>of income spent</Text>
    </View> : null;
  if (compact) return <View style={{ gap: 12 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {ring}<View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>Balance</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 26, fontWeight: "800", color: balance < 0 ? theme.semantic.expense : c.onSurface }}>{balance < 0 ? "−" : ""}{money(balance)}</Text>
      </View>
    </View>
    <View style={{ flexDirection: "row", gap: 10 }}>
      {metrics.slice(1).map(metric => <Pressable key={metric.label} accessibilityRole="button" accessibilityLabel={`View ${metric.label.toLowerCase()} transactions`}
        onPress={metric.action} style={{ flex: 1, minWidth: 0, minHeight: 64, padding: 10, gap: 4, borderRadius: 16, backgroundColor: metric.background }}>
        <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{metric.label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 19, fontWeight: "700", color: metric.color }}>{money(metric.value)}</Text>
      </Pressable>)}
    </View>
  </View>;
  return <View style={{ flexDirection: "row", gap: 12, alignItems: "stretch" }}>
    {ring}
    {metrics.map(metric => <Pressable key={metric.label} onPress={metric.action} disabled={!metric.action}
      accessibilityRole={metric.action ? "button" : undefined} accessibilityLabel={`${metric.label}, ${metric.value < 0 ? "minus " : ""}${money(metric.value)}${metric.action ? ". View entries" : ""}`}
      style={{ flex: 1, minWidth: 0, padding: 14, gap: 8, minHeight: 88,
        justifyContent: "center", borderRadius: theme.expressive ? 20 : 12,
        backgroundColor: theme.expressive ? metric.background : c.surface, borderWidth: theme.expressive ? 0 : 0.5, borderColor: c.outlineVariant }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name={metric.icon} size={16} color={metric.color} />
        <Text style={{ fontSize: 12, fontWeight: "600", color: c.onSurfaceVariant }}>{metric.label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 25, fontWeight: "800", color: metric.color }}>
        {metric.value < 0 ? "−" : ""}{money(metric.value)}
      </Text>
    </Pressable>)}
  </View>;
}
