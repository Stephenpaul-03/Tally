import { withOpacity } from "@/modules/Common/Utils/Helpers";
import React from "react";
import { Text } from "react-native-paper";
import Svg, { Circle } from "react-native-svg";
import { COMPARE_RING_SIZE, COMPARE_RING_STROKE } from "../Constants";

export function ComparisonArcRing({
  percentage,
  accent,
  radiusOffset,
  size = COMPARE_RING_SIZE,
  stroke = COMPARE_RING_STROKE,
}: {
  percentage: number;
  accent: string;
  radiusOffset: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2 - radiusOffset;
  const dash =
    (Math.min(Math.max(percentage, 0), 100) / 100) * (2 * Math.PI * radius);
  const gap = 2 * Math.PI * radius - dash;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={withOpacity(accent, "22")}
        strokeWidth={stroke}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        rotation={-90}
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

export function PercentDeltaPill({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#A6ADBC" }}>
        New
      </Text>
    );
  }
  if (value === 0) {
    return (
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#A6ADBC" }}>
        0%
      </Text>
    );
  }

  const positive = value > 0;
  const color = positive ? "#D9919B" : "#89C8AF";
  const rounded =
    Math.abs(value) >= 10
      ? Math.round(Math.abs(value))
      : Number(Math.abs(value).toFixed(1));

  return (
    <Text style={{ fontSize: 13, fontWeight: "700", color }}>
      {`${positive ? "+" : "-"}${rounded}%`}
    </Text>
  );
}
