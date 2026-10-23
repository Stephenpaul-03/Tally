import { useMotionEnabled } from "@/components/animations/Motion";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { categoryTone } from "@/theme/sage";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import type { calculateInsights } from "../calculations";

type Data = ReturnType<typeof calculateInsights>;
export function ExpressiveOverview({
  data,
  money,
  onIncome,
  onSpending,
}: {
  data: Data;
  money: (value: number) => string;
  onIncome: () => void;
  onSpending: () => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const { colors: c } = theme;
  const empty = data.current.length === 0;
  return (
    <View
      style={{
        backgroundColor: c.primaryContainer,
        borderRadius: 40,
        padding: 22,
        gap: 18,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 22 }}>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Spending as a percentage of income"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.min(100, Math.round(data.usedPercent ?? 0)),
            text:
              data.usedPercent === null
                ? "No income recorded"
                : `${data.usedPercent.toFixed(1)}% spent`,
          }}
          style={{
            width: 128,
            height: 128,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ProgressRing percent={data.usedPercent ?? 0} />
          <Text
            style={{
              fontSize: 27,
              fontWeight: "800",
              letterSpacing: -1,
              color: theme.semantic.expense,
            }}
          >
            {data.usedPercent === null
              ? "—"
              : `${data.usedPercent.toFixed(1)}%`}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: c.onPrimaryContainer,
              textAlign: "center",
              maxWidth: 96,
            }}
          >
            {data.usedPercent === null ? "No income" : "of income spent"}
          </Text>
          {data.remaining < 0 ? (
            <View
              style={{
                position: "absolute",
                left: 56,
                top: 0,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: c.error,
              }}
            />
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
          {(
            [
              ["Income", data.income, onIncome],
              ["Spent", data.expense, onSpending],
            ] as const
          ).map(([name, amount, onPress]) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={`${name}, ${money(amount)}. View entries.`}
              onPress={onPress}
              style={{
                minHeight: 64,
                justifyContent: "center",
                gap: 3,
                padding: 10,
                borderRadius: 20,
                backgroundColor: categoryTone(
                  "",
                  theme.dark,
                  name === "Income" ? "#226A2B" : "#BA1A1A",
                )[0],
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color:
                    name === "Income"
                      ? theme.dark
                        ? "#C4EFB5"
                        : "#072100"
                      : c.onErrorContainer,
                }}
              >
                {name === "Income" ? "Income received" : "Money spent"}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color:
                    name === "Income"
                      ? theme.dark
                        ? "#C4EFB5"
                        : "#072100"
                      : c.onErrorContainer,
                }}
              >
                {empty ? "—" : money(amount)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ alignItems: "center", gap: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            alignSelf: "stretch",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: c.onPrimaryContainer,
            }}
          >
            Balance
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontSize: 28,
              fontWeight: "800",
              letterSpacing: -0.8,
              color: c.onPrimaryContainer,
              flexShrink: 1,
            }}
          >
            {empty ? "—" : money(data.remaining)}
          </Text>
        </View>
        {data.remaining < 0 ? (
          <View
            style={{
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 7,
              backgroundColor: c.errorContainer,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: c.onErrorContainer,
              }}
            >
              {money(Math.abs(data.remaining))} over
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
/** Two clipped native arcs keep the ring smooth without a new native dependency. */
function ProgressRing({ percent }: { percent: number }) {
  const enabled = useMotionEnabled();
  const theme = useTheme<ExtendedMD3Theme>();
  const { colors: c } = theme;
  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, percent / 100)), {
      duration: enabled ? 320 : 0,
      reduceMotion: ReduceMotion.System,
    });
  }, [percent, progress, enabled]);
  const right = useAnimatedStyle(() => ({
    opacity: progress.value > 0 ? 1 : 0,
    transform: [{ rotate: `${Math.min(progress.value, 0.5) * 360 - 135}deg` }],
  }));
  const left = useAnimatedStyle(() => ({
    opacity: progress.value > 0.5 ? 1 : 0,
    transform: [
      { rotate: `${Math.max(progress.value - 0.5, 0) * 360 + 45}deg` },
    ],
  }));
  const ring = {
    position: "absolute" as const,
    top: 0,
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 14,
    borderColor: "transparent",
    borderTopColor: theme.semantic.expense,
    borderRightColor: theme.semantic.expense,
  };
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, width: 128, height: 128 }}
    >
      <View
        style={{
          position: "absolute",
          width: 128,
          height: 128,
          borderRadius: 64,
          borderWidth: 14,
          borderColor: c.secondaryContainer,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 64,
          width: 64,
          height: 128,
          overflow: "hidden",
        }}
      >
        <Animated.View style={[ring, { left: -64 }, right]} />
      </View>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 64,
          height: 128,
          overflow: "hidden",
        }}
      >
        <Animated.View style={[ring, { left: 0 }, left]} />
      </View>
      <View
        style={{
          position: "absolute",
          left: 14,
          top: 14,
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: c.primaryContainer,
        }}
      />
    </View>
  );
}
