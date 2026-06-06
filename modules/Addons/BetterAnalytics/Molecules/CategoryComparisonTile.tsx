import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { withOpacity } from "@/modules/Common/Utils/Helpers";
import type { CategoryComparisonRow } from "@/modules/Insights/Types";
import { formatInr } from "@/modules/Insights/Utils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import {
    COMPARE_RING_GAP,
    COMPARE_RING_SIZE,
    CURRENT_COMPARE_COLOR,
    PREVIOUS_COMPARE_COLOR,
} from "../Constants";
import { ComparisonArcRing, PercentDeltaPill } from "./ComparisonArcRing";

export function CategoryComparisonTile({
  item,
  textColor,
  muted,
}: {
  item: CategoryComparisonRow;
  textColor: string;
  muted: string;
}) {
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  const iconAccent = minimalIconsEnabled ? theme.colors.primary : item.color;

  return (
    <View
      style={{
        width: 122,
        borderRadius: 14,
        backgroundColor: withOpacity(textColor, "05"),
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 8,
      }}
    >
      <View
        style={{
          width: COMPARE_RING_SIZE,
          height: COMPARE_RING_SIZE,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ComparisonArcRing
            percentage={item.previousShare}
            accent={PREVIOUS_COMPARE_COLOR}
            radiusOffset={0}
          />
          <View style={{ position: "absolute" }}>
            <ComparisonArcRing
              percentage={item.currentShare}
              accent={CURRENT_COMPARE_COLOR}
              radiusOffset={COMPARE_RING_GAP}
            />
          </View>
          <View
            style={{
              width: COMPARE_RING_SIZE - 24,
              height: COMPARE_RING_SIZE - 24,
              borderRadius: 999,
              backgroundColor: minimalIconsEnabled
                ? theme.colors.surfaceVariant
                : withOpacity(iconAccent, "18"),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={18}
              color={iconAccent}
            />
          </View>
        </View>
      </View>

      <View style={{ gap: 2 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 11, color: textColor, textAlign: "center" }}
        >
          {item.category}
        </Text>
        <Text
          style={{
            fontSize: 12,
            lineHeight: 18,
            color: textColor,
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {formatInr(item.currentAmount)}
        </Text>
        <Text
          style={{
            fontSize: 10,
            lineHeight: 14,
            color: muted,
            textAlign: "center",
          }}
        >
          {`Last ${formatInr(item.previousAmount)}`}
        </Text>
        <View style={{ alignItems: "center" }}>
          <PercentDeltaPill value={item.percentChange} />
        </View>
      </View>
    </View>
  );
}
