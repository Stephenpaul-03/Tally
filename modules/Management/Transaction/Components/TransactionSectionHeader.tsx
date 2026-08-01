import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { formatCurrencyWithSymbol } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

const TIMELINE_LAYER_WIDTH = 10;
const TIMELINE_STROKE_WIDTH = 1;
const SECTION_PADDING_LEFT = 22;
const TIMELINE_RAIL_LEFT = (TIMELINE_LAYER_WIDTH - TIMELINE_STROKE_WIDTH) / 2;
const CHEVRON_SLOT_WIDTH = 18;

type Props = {
  title: string;
  total: number;
  currencyCode: string;
  currencySymbol: string;
  totalLabel?: string;
  metric?: "spent" | "earned";
  collapsed?: boolean;
  renderContentWhenCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  children: React.ReactNode;
};

export function TransactionSectionHeader({
  title,
  total,
  currencySymbol,
  totalLabel,
  metric = "spent",
  collapsed = false,
  renderContentWhenCollapsed = false,
  onToggleCollapsed,
  children,
}: Props) {
  const theme = useTheme<ExtendedMD3Theme>();
  const collapsible = Boolean(onToggleCollapsed);
  const isCollapsed = collapsible && collapsed;
  const totalLabelText = totalLabel ?? metric;
  const totalAmountText = totalLabel
    ? ""
    : formatCurrencyWithSymbol(Math.abs(total), currencySymbol, false);
  const totalAccentColor =
    metric === "earned" ? theme.semantic.income : theme.colors.error;
  const totalIcon =
    metric === "earned" ? "arrow-bottom-left" : "arrow-top-right";
  const headerContent = (
    <>
      <Text
        numberOfLines={1}
        style={[
          styles.title,
          {
            color: theme.colors.onSurface,
          },
        ]}
      >
        {title}
      </Text>
      <View style={styles.trailing}>
        {totalLabel ? null : (
          <MaterialCommunityIcons
            name={totalIcon}
            size={12}
            color={totalAccentColor}
          />
        )}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={[
            styles.totalAmount,
            {
              color: theme.colors.onSurface,
            },
          ]}
        >
          {totalAmountText}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.totalLabel,
            {
              color: totalLabel
                ? theme.colors.onSurfaceVariant
                : totalAccentColor,
            },
          ]}
        >
          {totalLabelText}
        </Text>
        <View style={styles.chevronSlot}>
          {collapsible ? (
            <MaterialCommunityIcons
              name={isCollapsed ? "chevron-down" : "chevron-up"}
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          ) : null}
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.section}>
      <View pointerEvents="none" style={styles.timelineLayer}>
        <View
          style={[
            styles.rail,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View
          style={[
            styles.node,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
        />
      </View>
      {collapsible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${isCollapsed ? "Expand" : "Collapse"} ${title}`}
          accessibilityState={{ expanded: !isCollapsed }}
          onPress={onToggleCollapsed}
          style={({ pressed }) => [styles.header, pressed && { opacity: 0.68 }]}
        >
          {headerContent}
        </Pressable>
      ) : (
        <View style={styles.header}>{headerContent}</View>
      )}
      {isCollapsed && !renderContentWhenCollapsed ? null : (
        <>
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <View style={styles.content}>{children}</View>
        </>
      )}
    </View>
  );
}

export default TransactionSectionHeader;

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    paddingBottom: 18,
    paddingLeft: SECTION_PADDING_LEFT,
    position: "relative",
  },
  timelineLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: TIMELINE_LAYER_WIDTH,
  },
  rail: {
    bottom: 0,
    left: TIMELINE_RAIL_LEFT,
    position: "absolute",
    top: 0,
    width: TIMELINE_STROKE_WIDTH,
  },
  node: {
    borderRadius: 5,
    borderWidth: 1.5,
    height: 10,
    left: 0,
    position: "absolute",
    top: 5,
    width: 10,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  trailing: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 8,
  },
  title: {
    ...typography.editorial.sectionLabel,
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    minWidth: 0,
    textTransform: "uppercase",
  },
  totalLabel: {
    ...typography.editorial.sectionLabel,
    fontSize: 13,
    lineHeight: 16,
    textAlign: "left",
    textTransform: "lowercase",
  },
  totalAmount: {
    ...typography.editorial.sectionLabel,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "left",
    textTransform: "uppercase",
  },
  chevronSlot: {
    alignItems: "center",
    justifyContent: "center",
    width: CHEVRON_SLOT_WIDTH,
  },
  content: {
    gap: 4,
  },
  divider: {
    height: TIMELINE_STROKE_WIDTH,
    marginLeft: TIMELINE_RAIL_LEFT - SECTION_PADDING_LEFT,
    marginRight: -20,
    marginBottom: 10,
  },
});
