import { withOpacity } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import { formatInr } from "../Hooks";
import { budgetStyles } from "../Styles";

type Props = {
  name: string;
  spent: number;
  budget: number;
  icon: string;
  color: string;
  theme: MD3Theme;
  hasBudget: boolean;
  isLast?: boolean;
  onPress: () => void;
};

export function BudgetRow({
  name,
  spent,
  budget,
  icon,
  color,
  theme,
  hasBudget,
  isLast,
  onPress,
}: Props) {
  const c = theme.colors;
  const rawPercent = hasBudget ? Math.round((spent / budget) * 100) : 0;
  const progress = Math.min(100, Math.max(0, rawPercent));
  const statusColor =
    hasBudget && spent > budget
      ? "#F05E93"
      : hasBudget && spent >= budget * 0.8
        ? "#D4AF45"
        : color;

  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          budgetStyles.budgetListRow,
          { opacity: pressed ? 0.76 : 1 },
        ]}
      >
        <View style={budgetStyles.rowInner}>
          <View style={budgetStyles.rowLeading}>
            <View
              style={[
                budgetStyles.categoryIconBadge,
                {
                  backgroundColor: withOpacity(
                    hasBudget ? statusColor : c.onSurfaceVariant,
                    "18",
                  ),
                },
              ]}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={22}
                color={hasBudget ? statusColor : c.onSurfaceVariant}
              />
            </View>

            <View style={budgetStyles.rowText}>
              <Text
                numberOfLines={1}
                style={[budgetStyles.rowTitle, { color: c.onSurface }]}
              >
                {name}
              </Text>
              <Text
                numberOfLines={1}
                style={[budgetStyles.rowMeta, { color: c.onSurfaceVariant }]}
              >
                {hasBudget
                  ? `${formatInr(spent)} of ${formatInr(budget)}`
                  : "No budget yet"}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[
              budgetStyles.rowPercent,
              { color: hasBudget ? statusColor : c.primary },
            ]}
          >
            {hasBudget ? `${rawPercent}%` : "Set"}
          </Text>
        </View>

        <View
          style={[
            budgetStyles.budgetProgressTrack,
            { backgroundColor: c.elevation.level3 },
          ]}
        >
          <View
            style={[
              budgetStyles.budgetProgressFill,
              { width: `${progress}%`, backgroundColor: statusColor },
            ]}
          />
        </View>
      </Pressable>

      {!isLast ? (
        <View
          style={[
            budgetStyles.rowDivider,
            { backgroundColor: c.outlineVariant },
          ]}
        />
      ) : null}
    </>
  );
}

