import { useAppShell } from "@/components/AppShellContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, View } from "react-native";
import { Text } from "react-native-paper";
import {
  formatInsightMoney,
  formatPercent,
  useHeroBalanceSummary,
} from "../Hooks";
import { insightStyles } from "../Styles";

const HERO_SURFACE = "#121416";
const HERO_TILE = "rgba(255,255,255,0.08)";
const HERO_TILE_BORDER = "rgba(255,255,255,0.04)";
const HERO_PANEL_BORDER = "rgba(255,255,255,0.12)";
const HERO_MUTED = "rgba(255,255,255,0.68)";
const HERO_TEXT = "rgba(255,255,255,0.94)";
const HERO_SEGMENT_OFF = "rgba(255,255,255,0.16)";
const HERO_GREEN = "#65D67C";
const HERO_YELLOW = "#F6D84D";
const HERO_RED = "#EF6B6B";
const HERO_SEGMENT_COUNT = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`;
}

function getBudgetColor(
  budgetUsed: number,
  safeBelowPercent: number,
  nearlyEmptyFromPercent: number,
) {
  if (budgetUsed >= nearlyEmptyFromPercent) return HERO_RED;
  if (budgetUsed >= safeBelowPercent) return HERO_YELLOW;
  return HERO_GREEN;
}

function getBudgetSegmentColor({
  index,
  safeBelowPercent,
  nearlyEmptyFromPercent,
}: {
  index: number;
  safeBelowPercent: number;
  nearlyEmptyFromPercent: number;
}) {
  const segmentPercent = ((index + 0.5) / HERO_SEGMENT_COUNT) * 100;
  if (segmentPercent >= nearlyEmptyFromPercent) return HERO_RED;
  if (segmentPercent >= safeBelowPercent) return HERO_YELLOW;
  return HERO_GREEN;
}

function HeroStat({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
}) {
  return (
    <View
      style={[
        insightStyles.heroStat,
        { backgroundColor: HERO_TILE, borderColor: HERO_TILE_BORDER },
      ]}
    >
      <View style={insightStyles.heroStatTopRow}>
        <View
          style={[
            insightStyles.heroStatIconWrap,
            { backgroundColor: withAlpha(iconColor, "2E") },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={12} color={iconColor} />
        </View>
        <Text
          numberOfLines={1}
          style={[insightStyles.heroStatLabel, { color: HERO_MUTED }]}
        >
          {label}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={[insightStyles.heroStatValue, { color: HERO_TEXT }]}
      >
        {value}
      </Text>
    </View>
  );
}

export function HeroCard() {
  const { activeTabProgress } = useAppShell();
  const summary = useHeroBalanceSummary();
  const progress = clamp(activeTabProgress - 1, 0, 1);
  const animatedProgress = React.useRef(new Animated.Value(progress)).current;
  const netColor = summary.net >= 0 ? HERO_GREEN : HERO_RED;
  const budgetUsed = summary.budget > 0 ? summary.budgetUsed : 0;
  const budgetUsedClamped = clamp(budgetUsed, 0, 100);
  const budgetColor =
    summary.budget > 0
      ? getBudgetColor(
          budgetUsed,
          summary.budgetSafeBelowPercent,
          summary.budgetNearlyEmptyFromPercent,
        )
      : HERO_MUTED;
  const filledSegments = Math.round(
    (budgetUsedClamped / 100) * HERO_SEGMENT_COUNT,
  );

  React.useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 360,
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, progress]);

  const cardPadding = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 11],
  });
  const heroGap = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 10],
  });
  const valueSize = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 30],
  });
  const valueLineHeight = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [27, 36],
  });
  const detailOpacity = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.35, 1],
  });
  const detailHeight = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 68],
  });

  return (
    <Animated.View
      style={[
        insightStyles.heroCard,
        {
          backgroundColor: HERO_SURFACE,
          borderColor: HERO_PANEL_BORDER,
          padding: cardPadding,
          gap: heroGap,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.22,
          shadowRadius: 16,
        },
      ]}
    >
      <View style={insightStyles.heroTopRow}>
        <View style={insightStyles.heroLabelGroup}>
          <Text
            numberOfLines={1}
            style={[insightStyles.heroEyebrow, { color: HERO_MUTED }]}
          >
            Balance
          </Text>
          <Animated.Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.62}
            style={[
              insightStyles.heroValue,
              {
                color: netColor,
                fontSize: valueSize,
                lineHeight: valueLineHeight,
              },
            ]}
          >
            {formatInsightMoney(summary.net)}
          </Animated.Text>
        </View>
        <View
          style={[
            insightStyles.heroIconWrap,
            { backgroundColor: HERO_TILE },
          ]}
        >
          <MaterialCommunityIcons
            name={summary.net >= 0 ? "trending-up" : "trending-down"}
            size={18}
            color={netColor}
          />
        </View>
      </View>

      <View style={insightStyles.heroCompactStats}>
        <HeroStat
          label="Income"
          value={formatInsightMoney(summary.income)}
          icon="arrow-down"
          iconColor={HERO_GREEN}
        />
        <HeroStat
          label="Spent"
          value={formatInsightMoney(summary.spent)}
          icon="arrow-up"
          iconColor={HERO_RED}
        />
        <HeroStat
          label="Budget left"
          value={formatInsightMoney(summary.budgetLeft)}
          icon="circle-outline"
          iconColor={budgetColor}
        />
      </View>

      <Animated.View
        pointerEvents={progress > 0.55 ? "auto" : "none"}
        style={[
          insightStyles.heroExpanded,
          {
            borderColor: HERO_PANEL_BORDER,
            opacity: detailOpacity,
            maxHeight: detailHeight,
          },
        ]}
      >
        <View style={insightStyles.heroBudgetHeader}>
          <View style={insightStyles.heroBudgetSide}>
            <Text
              numberOfLines={1}
              style={[insightStyles.heroBudgetLabel, { color: HERO_MUTED }]}
            >
              Budget
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={[insightStyles.heroBudgetValue, { color: HERO_TEXT }]}
            >
              {formatInsightMoney(summary.budget)}
            </Text>
          </View>
          <View style={insightStyles.heroBudgetCenter}>
            <Text
              style={[
                insightStyles.heroBudgetPercent,
                { color: budgetColor },
              ]}
            >
              {formatPercent(budgetUsed)}
            </Text>
          </View>
          <View style={insightStyles.heroBudgetRight}>
            <Text
              numberOfLines={1}
              style={[insightStyles.heroBudgetLabel, { color: HERO_MUTED }]}
            >
              Spent
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={[insightStyles.heroBudgetValue, { color: budgetColor }]}
            >
              {formatInsightMoney(summary.spent)}
            </Text>
          </View>
        </View>
        <View style={insightStyles.heroBudgetTrack}>
          {Array.from({ length: HERO_SEGMENT_COUNT }, (_, index) => {
            const isFilled = index < filledSegments;
            const segmentColor = getBudgetSegmentColor({
              index,
              safeBelowPercent: summary.budgetSafeBelowPercent,
              nearlyEmptyFromPercent: summary.budgetNearlyEmptyFromPercent,
            });
            return (
              <View
                key={index}
                style={[
                  insightStyles.heroBudgetFill,
                  {
                    backgroundColor: isFilled
                      ? segmentColor
                      : HERO_SEGMENT_OFF,
                  },
                ]}
              />
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
