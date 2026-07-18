import type { RootParamList } from "@/navigation/types";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import React from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { Text, useTheme } from "react-native-paper";

type SummaryMetric = {
  label: string;
  value: string;
  caption?: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color?: string;
  onPress?: () => void;
};

type HeroCardProps = {
  heroLabel?: string;
  primary: SummaryMetric;
  middle?: SummaryMetric;
  right?: SummaryMetric;
  budget?: SummaryMetric;
  projected?: SummaryMetric;
  accentColor: string;
  outline: string;
  textColor: string;
  muted: string;
  style?: StyleProp<ViewStyle>;
  showGreeting?: boolean;
  greetingCollapseProgress?: number;
  carouselMetrics?: readonly SummaryMetric[];
  carouselGridProgress?: number;
  monthTimeline?: {
    selectedMonthKey: string;
    onMonthChange: (monthKey: string) => void;
  };
};

type DashboardMetric = SummaryMetric & {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  percent: number;
  tone: string;
};

function currencySymbolFromValue(value: string) {
  const match = value.trim().match(/^[^\d\-+.,\s]+/);
  return match?.[0] ?? "";
}

function amountWithoutCurrencySymbol(value: string) {
  const symbol = currencySymbolFromValue(value);
  return symbol ? value.trim().slice(symbol.length).trim() : value;
}

function amountNumber(value: string) {
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function parseMonthKey(monthKey: string) {
  const [yearValue, monthValue] = monthKey.split("-").map(Number);
  const year = Number.isFinite(yearValue)
    ? yearValue
    : new Date().getFullYear();
  const monthIndex = Number.isFinite(monthValue)
    ? monthValue - 1
    : new Date().getMonth();
  return new Date(year, monthIndex, 1);
}

function formatMonthTitle(monthKey?: string) {
  const date = monthKey ? parseMonthKey(monthKey) : new Date();
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTargetCaption(percent: number) {
  return `${Math.round(clampPercent(percent))}% of target`;
}

function MetricColumn({
  metric,
  muted,
  outline,
  trackColor,
  textColor,
  compact,
}: {
  metric: DashboardMetric;
  muted: string;
  outline: string;
  trackColor: string;
  textColor: string;
  compact: boolean;
}) {
  const normalizedPercent = clampPercent(metric.percent);
  const amount = (
    <View style={styles.metricAmountRow}>
      <Text style={[styles.currencySymbol, { color: textColor }]}>
        {currencySymbolFromValue(metric.value)}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.62}
        style={[styles.metricValue, { color: textColor }]}
      >
        {amountWithoutCurrencySymbol(metric.value)}
      </Text>
    </View>
  );
  const icon = (
    <View style={[styles.metricIconRing, { borderColor: metric.tone }]}>
      <MaterialCommunityIcons
        name={metric.icon}
        size={compact ? 13 : 15}
        color={metric.tone}
      />
    </View>
  );
  const label = (
    <Text
      style={[styles.metricLabel, { color: metric.tone }]}
      numberOfLines={1}
    >
      {metric.label}
    </Text>
  );
  const content = compact ? (
    <View style={styles.metricCompactRow}>
      {icon}
      {label}
      {amount}
    </View>
  ) : (
    <>
      {icon}
      {label}
      {amount}
      <View style={[styles.metricTrack, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.metricFill,
            {
              backgroundColor: metric.tone,
              width: `${normalizedPercent}%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.metricCaption, { color: muted }]} numberOfLines={1}>
        {metric.caption ?? formatTargetCaption(normalizedPercent)}
      </Text>
    </>
  );

  if (!metric.onPress) {
    return (
      <View
        style={[styles.metricColumn, { borderLeftColor: outline }]}
        pointerEvents="box-none"
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={metric.label}
      onPress={metric.onPress}
      style={({ pressed }) => [
        styles.metricColumn,
        { borderLeftColor: outline },
        pressed && { opacity: 0.72 },
      ]}
    >
      {content}
    </Pressable>
  );
}

export function HeroCard({
  primary,
  middle,
  right,
  budget,
  accentColor,
  outline,
  textColor,
  muted,
  style,
  showGreeting = true,
  greetingCollapseProgress = 0,
  monthTimeline,
}: HeroCardProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const navigation = useNavigation<NavigationProp<RootParamList>>();
  const { width } = useWindowDimensions();
  const compactProgress = Math.max(0, Math.min(1, greetingCollapseProgress));
  const compact = compactProgress > 0.55;
  const cardPadding = width < 390 ? 18 : 22;
  const animatedCompact = React.useRef(
    new Animated.Value(compactProgress),
  ).current;

  React.useEffect(() => {
    Animated.timing(animatedCompact, {
      toValue: compactProgress,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [animatedCompact, compactProgress]);

  const headerHeight = animatedCompact.interpolate({
    inputRange: [0, 1],
    outputRange: [38, 30],
  });
  const monthBlockHeight = animatedCompact.interpolate({
    inputRange: [0, 1],
    outputRange: [42, 26],
  });
  const metricsHeight = animatedCompact.interpolate({
    inputRange: [0, 1],
    outputRange: [98, 72],
  });
  const topPadding = animatedCompact.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 4],
  });
  const horizontalPadding = animatedCompact.interpolate({
    inputRange: [0, 1],
    outputRange: [cardPadding, Math.max(12, cardPadding - 6)],
  });
  const monthOpacity = animatedCompact.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });

  const incomeTone = middle?.color ?? theme.semantic.income;
  const expenseTone = right?.color ?? theme.semantic.expense;
  const balanceTone = primary.color ?? accentColor;
  const incomeAmount = amountNumber(middle?.value ?? "");
  const expenseAmount = amountNumber(right?.value ?? "");
  const balanceAmount = amountNumber(primary.value);
  const budgetAmount = amountNumber(budget?.value ?? "");
  const expensePercent =
    budgetAmount > 0
      ? (expenseAmount / budgetAmount) * 100
      : incomeAmount > 0
        ? (expenseAmount / incomeAmount) * 100
        : expenseAmount > 0
          ? 100
          : 0;
  const balancePercent =
    incomeAmount > 0 ? (balanceAmount / incomeAmount) * 100 : 0;
  const metrics: DashboardMetric[] = [
    ...(middle
      ? [
          {
            ...middle,
            icon: middle.icon ?? "arrow-up",
            percent: incomeAmount > 0 ? 100 : 0,
            tone: incomeTone,
          },
        ]
      : []),
    ...(right
      ? [
          {
            ...right,
            icon: right.icon ?? "arrow-down",
            percent: expensePercent,
            tone: expenseTone,
          },
        ]
      : []),
    {
      ...primary,
      label: primary.label || "Balance",
      icon: primary.icon ?? "wallet-outline",
      percent: balancePercent,
      tone: balanceTone,
      caption: primary.caption ?? "Income - Expenses",
    },
  ];
  const monthTitle = formatMonthTitle(monthTimeline?.selectedMonthKey);
  const dockTextColor = theme.dark ? textColor : "#F6F1EA";
  const trackColor = theme.dark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(246, 241, 234, 0.14)";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background,
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
        },
        style,
      ]}
    >
      {showGreeting ? (
        <Animated.View style={[styles.topHeader, { minHeight: headerHeight }]}>
          <Text style={styles.brand}>TALLY</Text>
          <View style={styles.topHeaderActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => navigation.navigate("Settings")}
              hitSlop={8}
              style={({ pressed }) => pressed && { opacity: 0.72 }}
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={22}
                color={accentColor}
              />
            </Pressable>
          </View>
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.monthBlock,
          {
            height: monthBlockHeight,
            opacity: monthOpacity,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Selected month ${monthTitle}`}
          disabled={!monthTimeline}
          onPress={() =>
            monthTimeline?.onMonthChange(monthTimeline.selectedMonthKey)
          }
          style={({ pressed }) => [
            styles.monthButton,
            pressed && monthTimeline ? { opacity: 0.72 } : null,
          ]}
        >
          <Text style={[styles.monthTitle, { color: dockTextColor }]}>
            {monthTitle}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={16}
            color={dockTextColor}
          />
        </Pressable>
        <View style={styles.tillTodayRow}>
          <Text style={[styles.tillToday, { color: muted }]}>Till today</Text>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={12}
            color={muted}
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.metricsGrid, { minHeight: metricsHeight }]}>
        {metrics.map((metric, index) => (
          <MetricColumn
            key={`${metric.label}-${index}`}
            metric={metric}
            muted={muted}
            outline={index === 0 ? "transparent" : outline}
            trackColor={trackColor}
            textColor={dockTextColor}
            compact={compact}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  brand: {
    ...typography.editorial.hero,
    color: "#F4C891",
    fontSize: 22,
    lineHeight: 26,
  },
  card: {
    borderRadius: 0,
    flex: 1,
    overflow: "hidden",
  },
  currencySymbol: {
    ...typography.editorial.hero,
    fontSize: 17,
    lineHeight: 21,
  },
  metricAmountRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 3,
    minWidth: 0,
  },
  metricCaption: {
    fontSize: 10,
    lineHeight: 12,
    marginTop: 6,
    textAlign: "center",
  },
  metricColumn: {
    alignItems: "center",
    borderLeftWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 8,
  },
  metricCompactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    minWidth: 0,
    width: "100%",
  },
  metricFill: {
    borderRadius: 999,
    height: "100%",
  },
  metricIconRing: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.25,
    height: 30,
    justifyContent: "center",
    marginBottom: 8,
    width: 30,
  },
  metricLabel: {
    ...typography.editorial.sectionLabel,
    fontSize: 9,
    lineHeight: 11,
    textAlign: "center",
    textTransform: "uppercase",
  },
  metricTrack: {
    borderRadius: 999,
    height: 5,
    marginTop: 7,
    overflow: "hidden",
    width: "100%",
  },
  metricValue: {
    ...typography.editorial.hero,
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 21,
  },
  metricsGrid: {
    flexDirection: "row",
    minHeight: 98,
    paddingBottom: 8,
  },
  monthBlock: {
    justifyContent: "center",
    overflow: "hidden",
  },
  monthButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
  },
  monthTitle: {
    ...typography.bodyBold,
    fontSize: 20,
    lineHeight: 24,
  },
  tillToday: {
    fontSize: 10,
    lineHeight: 12,
  },
  tillTodayRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 1,
  },
  topHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 38,
  },
  topHeaderActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
});
