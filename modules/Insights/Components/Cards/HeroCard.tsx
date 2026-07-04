import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, StyleProp, View, ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

type SummaryMetric = {
  label: string;
  value: string;
  caption: string;
};

type DailyMetric = {
  label: string;
  value: string;
  caption?: string;
};

type HeroCardProps = {
  summaryLabel?: string;
  left: SummaryMetric;
  middle?: SummaryMetric;
  right: SummaryMetric;
  accentColor: string;
  outline: string;
  textColor: string;
  muted: string;
  style?: StyleProp<ViewStyle>;
  showGreeting?: boolean;
  daily?: {
    left: DailyMetric;
    middle: DailyMetric;
    right: DailyMetric;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getGreeting(): string {
  const tod = getTimeOfDay();
  if (tod === "morning") return "Good Morning";
  if (tod === "afternoon") return "Good Afternoon";
  if (tod === "evening") return "Good Evening";
  return "Good Night";
}

function getDateLabel(): string {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString("en-IN", { month: "long" });
  const v = day % 100;
  const s = ["th", "st", "nd", "rd"];
  const suffix = s[(v - 20) % 10] ?? s[v] ?? s[0];
  return `${day}${suffix} ${month}`;
}

function getTimeIcon(): React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"] {
  const tod = getTimeOfDay();
  if (tod === "morning") return "weather-sunset-up";
  if (tod === "afternoon") return "weather-sunny";
  if (tod === "evening") return "weather-sunset-down";
  return "weather-night";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BorderLabel({
  label,
  muted,
  surfaceColor,
  accentColor,
}: {
  label: string;
  muted: string;
  surfaceColor: string;
  accentColor: string;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: -9,
        alignSelf: "center",
        backgroundColor: surfaceColor,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 0.5,
        borderColor: muted,
        borderRadius: 20,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          lineHeight: 14,
          fontWeight: "500",
          letterSpacing: 0.8,
          color: accentColor,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function SummaryColumn({
  metric,
  muted,
}: {
  metric: SummaryMetric;
  muted: string;
}) {
  const theme = useTheme();
  const isNegativeValue = metric.value.includes("-");

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text
        style={{
          borderColor: palette.transparent,
          borderWidth: 0.5,
          fontSize: 10,
          lineHeight: 18,
          fontWeight: "400",
          letterSpacing: 0.5,
          color: muted,
          textAlign: "center",
          includeFontPadding: false,
          textAlignVertical: "center",
          textTransform: "uppercase",
        }}
      >
        {metric.label}
      </Text>
      <Text
        style={{
          ...typography.editorial.sectionLabel,
          fontSize: 20,
          lineHeight: 32,
          letterSpacing: 0.5,
          textAlign: "center",
          color: isNegativeValue ? theme.colors.error : theme.colors.onSurface,
        }}
      >
        {metric.value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          lineHeight: 20,
          color: muted,
          textAlign: "center",
        }}
      >
        {metric.caption}
      </Text>
    </View>
  );
}

const INLINE_CHAR_THRESHOLD = 26;

// ─── Greeting Card ──────────────────────────────────────────────────────────

type GreetingCardProps = {
  accentColor: string;
  outline: string;
  textColor: string;
  muted: string;
  style?: StyleProp<ViewStyle>;
};

export function GreetingCard({
  accentColor,
  outline,
  textColor,
  muted,
  style,
}: GreetingCardProps) {
  const theme = useTheme();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);

  const greeting = getGreeting();
  const dateLabel = getDateLabel();
  const ownerName = activeWorkspace?.ownerName?.trim() || null;

  const greetingText = ownerName ? `${greeting}, ${ownerName}` : greeting;
  const isInline = greetingText.length <= INLINE_CHAR_THRESHOLD;

  const { animStyle } = useFadeSlide({
    from: "top",
    distance: 18,
    duration: 650,
  });

  const greetingRow = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexShrink: 1,
        minWidth: 0,
      }}
    >
      <MaterialCommunityIcons
        name={getTimeIcon()}
        size={16}
        color={accentColor}
      />
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          ...typography.editorial.sectionLabel,
          fontSize: 14,
          lineHeight: 20,
          color: textColor,
          flexShrink: 1,
          minWidth: 0,
        }}
      >
        {greeting}
        {ownerName ? (
          <Text
            style={{
              ...typography.editorial.sectionLabel,
              fontSize: 14,
              lineHeight: 20,
              color: accentColor,
            }}
          >
            {`, ${ownerName}`}
          </Text>
        ) : null}
      </Text>
    </View>
  );

  const dateAndPillRow = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: isInline ? "flex-start" : "space-between",
        gap: 10,
        flexShrink: 0,
        width: isInline ? undefined : "100%",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <MaterialCommunityIcons
          name="calendar-outline"
          size={13}
          color={muted}
        />
        <Text
          style={{
            ...typography.editorial.sectionLabel,
            fontSize: 12,
            lineHeight: 18,
            color: muted,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {dateLabel}
        </Text>
      </View>

      {activeWorkspace ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: `${accentColor}10`,
            borderWidth: 0.5,
            borderColor: `${accentColor}28`,
            borderRadius: 99,
            paddingVertical: 3,
            paddingHorizontal: 9,
            flexShrink: 0,
          }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 99,
              backgroundColor: activeWorkspace.color ?? accentColor,
            }}
          />
          <MaterialCommunityIcons
            name={activeWorkspace.icon as any}
            size={11}
            color={accentColor}
          />
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              fontWeight: "500",
              color: accentColor,
              letterSpacing: 0.1,
              maxWidth: 90,
            }}
          >
            {activeWorkspace.name}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 20,
          borderWidth: 0.5,
          borderColor: outline,
          overflow: "hidden",
          paddingHorizontal: 14,
          paddingVertical: 12,
          opacity: animStyle.opacity,
          transform: animStyle.transform,
        },
        style,
      ]}
    >
      {isInline ? (
        // Short name: everything fits comfortably on one row.
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          {greetingRow}
          {dateAndPillRow}
        </View>
      ) : (
        // Long name: greeting gets the full row to itself, date + pill
        // move to a second row that's never fighting it for space.
        <View style={{ gap: 10 }}>
          {greetingRow}
          {dateAndPillRow}
        </View>
      )}
    </Animated.View>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

type SummaryCardProps = {
  summaryLabel?: string;
  left: SummaryMetric;
  middle?: SummaryMetric;
  right: SummaryMetric;
  accentColor: string;
  outline: string;
  muted: string;
  style?: StyleProp<ViewStyle>;
};

function SummaryCard({
  summaryLabel = "Month Summary",
  left,
  middle,
  right,
  accentColor,
  outline,
  muted,
  style,
}: SummaryCardProps) {
  const theme = useTheme();
  const metrics = middle ? [left, middle, right] : [left, right];

  const { animStyle } = useFadeSlide({
    from: "top",
    distance: 18,
    duration: 650,
    delay: 80,
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 20,
          borderWidth: 0.5,
          borderColor: outline,
          overflow: "visible",
          padding: 10,
          paddingVertical: 20,
          position: "relative",
          opacity: animStyle.opacity,
          transform: animStyle.transform,
        },
        style,
      ]}
    >
      <BorderLabel
        label={summaryLabel}
        muted={muted}
        surfaceColor={theme.colors.surface}
        accentColor={accentColor}
      />
      <View style={{ flexDirection: "row", alignItems: "stretch" }}>
        {metrics.map((metric, index) => (
          <React.Fragment key={metric.label}>
            {index > 0 ? (
              <View
                style={{
                  width: 0.5,
                  backgroundColor: outline,
                  marginHorizontal: 8,
                }}
              />
            ) : null}
            <SummaryColumn metric={metric} muted={muted} />
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function HeroCard({
  summaryLabel,
  left,
  middle,
  right,
  accentColor,
  outline,
  textColor,
  muted,
  style,
  showGreeting = true,
}: HeroCardProps) {
  return (
    <View style={[{ gap: showGreeting ? 25 : 0 }, style]}>
      {showGreeting ? (
        <GreetingCard
          accentColor={accentColor}
          outline={outline}
          textColor={textColor}
          muted={muted}
        />
      ) : null}
      <SummaryCard
        summaryLabel={summaryLabel}
        left={left}
        middle={middle}
        right={right}
        accentColor={accentColor}
        outline={outline}
        muted={muted}
      />
    </View>
  );
}
