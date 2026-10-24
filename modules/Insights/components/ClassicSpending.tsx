import React from "react";
import { View, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import { typography } from "@/theme/typography";
import { getCategoryColor, getCategoryIconName } from "@/utils/Helpers";
import { percentLabel, type Group } from "../calculations";
import { ringArcs, spendingRingItems } from "../spendingRingModel";
import { MotionPressable } from "./Motion";
import { CardFooterAction } from "./Primitives";
import { CardEmptyState } from "./CardEmptyState";

function RingArc({
  size,
  stroke,
  start,
  sweep,
  color,
}: {
  size: number;
  stroke: number;
  start: number;
  sweep: number;
  color: string;
}) {
  const half = size / 2;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        transform: [{ rotate: `${start}deg` }],
      }}
    >
      <View
        style={{
          position: "absolute",
          left: half,
          width: half,
          height: size,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: -half,
            width: size,
            height: size,
            overflow: "hidden",
            transform: [{ rotate: `${sweep - 180}deg` }],
          }}
        >
          <View
            style={{
              position: "absolute",
              left: half,
              width: half,
              height: size,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                left: -half,
                width: size,
                height: size,
                borderRadius: half,
                borderWidth: stroke,
                borderColor: color,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export function ClassicSpending({
  groups,
  total,
  money,
  icons,
  colors,
  onSelect,
  onShowAll,
  type = "expense",
}: {
  type?: "expense" | "income";
  groups: Group[];
  total: number;
  money: (value: number) => string;
  icons: Record<string, string>;
  colors: Record<string, string>;
  onSelect: (group: Group) => void;
  onShowAll: () => void;
}) {
  const { colors: c } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 370 || fontScale > 1.2;
  const items = spendingRingItems(groups);
  const palette = items.map((item) =>
    item.group
      ? getCategoryColor(item.label, type, colors)
      : c.onSurfaceVariant,
  );
  const arcs = ringArcs(items.map((item) => item.share));
  const size = stacked ? 152 : 128;
  if (!items.length)
    return (
      <CardEmptyState
        message={type === "income" ? "No income yet" : "Nothing spent yet"}
      />
    );
  return (
    <View>
      <View
        style={{
          flexDirection: stacked
            ? "column"
            : type === "income"
              ? "row-reverse"
              : "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${type === "income" ? "Income" : "Spending"} breakdown, ${money(total)} total. ${items.map((item) => `${item.label} ${percentLabel(item.share * 100)}`).join(", ")}`}
          style={{
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 16,
              borderColor: c.outlineVariant,
            }}
          />
          {arcs.map((arc, index) => (
            <RingArc
              key={index}
              size={size}
              stroke={16}
              {...arc}
              color={palette[arc.index]}
            />
          ))}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              ...typography.bodyStrong,
              fontSize: 18,
              maxWidth: size - 42,
              color: c.onSurface,
            }}
          >
            {money(total)}
          </Text>
          <Text
            style={{
              ...typography.body,
              fontSize: 10,
              color: c.onSurfaceVariant,
            }}
          >
            {type === "income" ? "Total income" : "Total spent"}
          </Text>
        </View>
        <View
          style={{
            flex: stacked ? undefined : 1,
            width: stacked ? "100%" : undefined,
            minWidth: 0,
          }}
        >
          {items.map((item, index) => (
            <MotionPressable
              key={item.label}
              onPress={() => (item.group ? onSelect(item.group) : onShowAll())}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}, ${money(item.amount)}, ${percentLabel(item.share * 100)}. ${item.group ? "View entries" : `View all ${type === "income" ? "income" : "spending"} categories`}.`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 54,
                paddingVertical: 5,
              }}
            >
              <CategoryIconBadge
                icon={
                  item.group
                    ? (getCategoryIconName(
                        item.label,
                        type,
                        icons,
                      ) as React.ComponentProps<typeof Icon>["name"])
                    : "dots-horizontal"
                }
                color={palette[index]}
                categoryName={item.group?.name}
                style={{ width: 28, height: 28, borderRadius: 9 }}
              />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text
                  style={{
                    ...typography.bodyMedium,
                    fontSize: 12,
                    color: c.onSurface,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    ...typography.body,
                    fontSize: 11,
                    color: c.onSurfaceVariant,
                  }}
                >
                  {percentLabel(item.share * 100)}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  ...typography.bodyMedium,
                  fontSize: 12,
                  maxWidth: "40%",
                  color: c.onSurface,
                }}
              >
                {money(item.amount)}
              </Text>
              <Icon name="chevron-right" size={13} color={c.onSurfaceVariant} />
            </MotionPressable>
          ))}
        </View>
      </View>
      {items.some((item) => !item.group) && (
        <CardFooterAction
          label={`View ${groups.filter((group) => group.count > 0).length - 3} more`}
          onPress={onShowAll}
        />
      )}
    </View>
  );
}
