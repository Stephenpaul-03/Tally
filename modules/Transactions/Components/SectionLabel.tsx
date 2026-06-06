import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { mobileLayoutStyles } from "../Layouts/Styles/MobileLayoutStyles";
import { formatCurrency } from "../Utils";

interface SectionLabelProps {
  label: string;
  metricValue?: number;
  metricColor?: string;
  monthMetrics?: {
    expense: number;
    income: number;
    expenseColor: string;
    incomeColor: string;
  };
  monthMode?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  footerMode?: boolean;
}

export function SectionLabel({
  label,
  metricValue,
  metricColor,
  monthMetrics,
  monthMode = false,
  collapsed = false,
  onToggle,
  footerMode = false,
}: SectionLabelProps) {
  const theme = useTheme();
  const displayLabelStyle = {
    ...typography.editorial.sectionLabel,
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0.7,
    textTransform: "uppercase" as const,
    opacity: 0.55,
  };

  const accentColor = theme.dark
    ? theme.colors.primary
    : theme.colors.onSurfaceVariant;

  const visibleMonthMetrics = monthMetrics
    ? [
        {
          key: "income",
          value: monthMetrics.income,
          color: monthMetrics.incomeColor,
        },
        {
          key: "expense",
          value: monthMetrics.expense,
          color: monthMetrics.expenseColor,
        },
      ].filter((item) => item.value > 0)
    : [];

  if (monthMode) {
    return (
      <View
        style={[
          mobileLayoutStyles.sectionLabelRow,
          mobileLayoutStyles.monthSectionLabelRow,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onToggle}
          hitSlop={8}
          style={({ pressed }) => [
            mobileLayoutStyles.sectionLabelLeft,
            { opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={16}
            color={accentColor}
            style={mobileLayoutStyles.sectionLabelIcon}
          />
          <Text
            style={[
              mobileLayoutStyles.sectionLabel,
              displayLabelStyle,
              { color: accentColor },
            ]}
          >
            {label}
          </Text>
        </Pressable>
        <View style={mobileLayoutStyles.sectionLabelRight}>
          {visibleMonthMetrics.length > 0 && (
            <View style={mobileLayoutStyles.monthSectionMetrics}>
              {visibleMonthMetrics.map((item) => (
                <Text
                  key={item.key}
                  style={[
                    mobileLayoutStyles.sectionLabelMetric,
                    { color: item.color },
                  ]}
                >
                  {formatCurrency(item.value)}
                </Text>
              ))}
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onToggle}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
          >
            <MaterialCommunityIcons
              name={collapsed ? "chevron-down" : "chevron-up"}
              size={20}
              color={accentColor}
              style={mobileLayoutStyles.sectionAccordionIcon}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  if (footerMode) {
    return (
      <View
        style={[
          mobileLayoutStyles.sectionLabelRow,
          mobileLayoutStyles.sectionFooterRow,
        ]}
      >
        <Text
          style={[
            mobileLayoutStyles.sectionLabel,
            displayLabelStyle,
            { color: accentColor },
          ]}
        >
          {label}
        </Text>
        {visibleMonthMetrics.length > 0 ? (
          <View style={mobileLayoutStyles.monthSectionMetrics}>
            {visibleMonthMetrics.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 ? (
                  <View
                    style={[
                      mobileLayoutStyles.summaryMetricDivider,
                      { backgroundColor: theme.colors.outlineVariant },
                    ]}
                  />
                ) : null}
                <Text
                  style={[
                    mobileLayoutStyles.sectionLabelMetric,
                    { color: item.color },
                  ]}
                >
                  {formatCurrency(item.value)}
                </Text>
              </React.Fragment>
            ))}
          </View>
        ) : metricValue !== undefined && metricColor ? (
          <Text
            style={[
              mobileLayoutStyles.sectionLabelMetric,
              { color: metricColor },
            ]}
          >
            {formatCurrency(metricValue)}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        mobileLayoutStyles.sectionLabelRow,
        { paddingBottom: 8, marginBottom: 8 },
        { borderBottomColor: theme.colors.outlineVariant },
      ]}
    >
      <View style={mobileLayoutStyles.sectionLabelLeft}>
        <Text
          style={[
            mobileLayoutStyles.sectionLabel,
            displayLabelStyle,
            { color: accentColor },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={mobileLayoutStyles.sectionLabelRight}>
        {metricValue !== undefined && metricColor && (
          <Text
            style={[
              mobileLayoutStyles.sectionLabelMetric,
              { color: metricColor },
            ]}
          >
            {formatCurrency(metricValue)}
          </Text>
        )}
      </View>
    </View>
  );
}
