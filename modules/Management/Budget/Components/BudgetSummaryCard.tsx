import { InsightPillCard } from "@/modules/Labs/BetterAnalytics/Cards/InsightPillCard";
import { typography } from "@/theme/typography";
import React from "react";
import { View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import { formatInr } from "../Hooks";

type Props = {
  theme: MD3Theme;
  totalBudget: number;
  spent: number;
  remaining: number;
  categoryEntries: {
    name: string;
    budget: number;
    spent: number;
  }[];
};

export function BudgetSummaryCard({
  theme,
  totalBudget,
  spent,
  remaining,
  categoryEntries,
}: Props) {
  const now = new Date();
  const monthLabel = now
    .toLocaleDateString("en-IN", { month: "long" })
    .toUpperCase();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysLeft = Math.max(0, daysInMonth - now.getDate());
  const progress = totalBudget > 0 ? Math.min(1, spent / totalBudget) : 0;
  const watchlistCount = categoryEntries.filter(
    (category) =>
      category.budget > 0 && category.spent >= category.budget * 0.8,
  ).length;
  const statusColor =
    spent > totalBudget
      ? theme.colors.error
      : spent >= totalBudget * 0.8 && totalBudget > 0
        ? "#D4AF45"
        : "#42C777";
  const statusLabel =
    totalBudget <= 0
      ? "No budget set"
      : spent > totalBudget
        ? "Over budget"
        : spent >= totalBudget * 0.8
          ? "Approaching limit"
          : "On track";

  return (
    <InsightPillCard
      title={monthLabel}
      bg={theme.colors.elevation.level1}
      outline={theme.colors.outlineVariant}
      accentColor={theme.colors.primary}
      textColor={theme.colors.onSurface}
      muted={theme.colors.onSurfaceVariant}
    >
      <View style={{ gap: 12 }}>
        {/* Header: month + category count, status pill */}
        {/* <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >

        </View> */}

        {/* Spent / Total pair, big numbers, no circle needed */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}
          >
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 26,
                color: theme.colors.onSurface,
              }}
            >
              {formatInr(spent)}
            </Text>
            <Text
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 13,
                color: statusColor,
              }}
            >
              of {formatInr(totalBudget)}
            </Text>
          </View>
          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor:
                statusLabel === "Over budget"
                  ? theme.colors.errorContainer
                  : statusLabel === "Approaching limit"
                    ? theme.colors.tertiaryContainer
                    : theme.colors.primaryContainer,
            }}
          >
            <Text
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 11,
                color:
                  statusLabel === "Over budget"
                    ? theme.colors.onErrorContainer
                    : statusLabel === "Approaching limit"
                      ? theme.colors.onTertiaryContainer
                      : theme.colors.onPrimaryContainer,
              }}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Linear progress bar — height-compact regardless of value length,
            unlike the arc which forced a fixed square footprint */}
        <View
          style={{
            height: 8,
            borderRadius: 999,
            backgroundColor: theme.colors.elevation.level3,
            overflow: "hidden",
          }}
        >
          {progress > 0 ? (
            <View
              style={{
                height: "100%",
                width: `${Math.max(progress * 100, 4)}%`,
                borderRadius: 999,
                backgroundColor: statusColor,
              }}
            />
          ) : null}
        </View>

        {/* Single stat strip with dividers — mirrors the Expense/Income/Leftover
            pattern already used in Calendar & Insights month-summary cards */}
        <View
          style={{
            flexDirection: "row",
            paddingTop: 4,
          }}
        >
          <StatColumn
            label="LEFT"
            value={formatInr(Math.max(remaining, 0))}
            detail={`${daysLeft}d left`}
            theme={theme}
          />
          <Divider theme={theme} />
          <StatColumn
            label="USED"
            value={`${Math.round(progress * 100)}%`}
            detail="of budget"
            theme={theme}
          />
          <Divider theme={theme} />
          <StatColumn
            label="WATCHLIST"
            value={String(watchlistCount)}
            detail="near/over 80%"
            valueColor={watchlistCount > 0 ? "#D4AF45" : undefined}
            theme={theme}
          />
        </View>
      </View>
    </InsightPillCard>
  );
}

function Divider({ theme }: { theme: MD3Theme }) {
  return (
    <View
      style={{
        width: 1,
        marginHorizontal: 10,
        backgroundColor: theme.colors.outlineVariant,
      }}
    />
  );
}

function StatColumn({
  label,
  value,
  detail,
  valueColor,
  theme,
}: {
  label: string;
  value: string;
  detail: string;
  valueColor?: string;
  theme: MD3Theme;
}) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.4,
          color: theme.colors.onSurfaceVariant,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          ...typography.editorial.sectionLabel,
          fontSize: 18,
          color: valueColor ?? theme.colors.onSurface,
          textAlign: "center",
          paddingVertical: 4,
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 10,
          color: theme.colors.onSurfaceVariant,
          textAlign: "center",
        }}
      >
        {detail}
      </Text>
    </View>
  );
}
