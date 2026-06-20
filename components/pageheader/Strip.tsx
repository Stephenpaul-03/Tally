import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import {
    DAY_ROW_HEIGHT,
    DAY_ITEM_WIDTH,
    MAX_YEAR,
    MIN_YEAR,
    MONTH_ITEM_WIDTH,
    MONTH_ROW_HEIGHT,
} from "./constants";
import {
    buildDayItems,
    buildMonthItems,
    formatDayLabel,
    formatMonthLabel,
    formatWeekdayLabel,
    parseIso,
    toIso,
} from "./Dateutils";
import { GrowingStrip } from "./GrowingStrip";
import { InlineCalendar } from "./Inlinecalendar";
import type { DatePickerMode, StripItem } from "./types";

/** Separator item (month-name divider in day-strip, year divider in
 *  month-strip). Stretches to the strip's row height and centers its
 *  text within that height, so it lines up with the pills next to it. */
function SeparatorLabel({
  label,
  width,
  color,
}: {
  label: string;
  width: number;
  color: string;
}) {
  return (
    <View style={[styles.separatorItem, { width }]}>
      <Text style={[styles.separatorText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function DatePickerRail({
  visible,
  selectedDate,
  mode,
  onDateSelect,
  backgroundColor,
}: {
  visible: boolean;
  selectedDate: string;
  mode: DatePickerMode;
  onDateSelect: (iso: string) => void;
  backgroundColor: string;
}) {
  const theme = useTheme();
  const selectedDateObj = useMemo(() => {
    const parts = parseIso(selectedDate);
    return new Date(parts.year, parts.month, parts.day);
  }, [selectedDate]);
  const today = useMemo(() => new Date(), []);
  const dayListRef = useRef<FlatList<StripItem> | null>(null);
  const monthListRef = useRef<FlatList<StripItem> | null>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const [calendarHeight, setCalendarHeight] = useState(0);
  const [dayMonths, setDayMonths] = useState(() => [
    { year: selectedDateObj.getFullYear(), month: selectedDateObj.getMonth() },
  ]);
  const [monthYears, setMonthYears] = useState(() => [
    selectedDateObj.getFullYear(),
  ]);
  const dayItems = useMemo(() => buildDayItems(dayMonths), [dayMonths]);
  const monthItems = useMemo(() => buildMonthItems(monthYears), [monthYears]);
  const selectedMonthKey = `month-${selectedDate.slice(0, 7)}`;
  const selectedDayKey = `day-${selectedDate}`;
  const selectedKey = mode === "day-strip" ? selectedDayKey : selectedMonthKey;

  const appendMonth = useCallback(() => {
    setDayMonths((prev) => {
      const last = prev[prev.length - 1];
      const next = new Date(last.year, last.month + 1, 1);
      if (next.getFullYear() > MAX_YEAR) return prev;
      if (
        prev.some(
          (item) =>
            item.year === next.getFullYear() && item.month === next.getMonth(),
        )
      ) {
        return prev;
      }
      return [...prev, { year: next.getFullYear(), month: next.getMonth() }];
    });
  }, []);
  const prependMonth = useCallback(() => {
    setDayMonths((prev) => {
      const first = prev[0];
      const next = new Date(first.year, first.month - 1, 1);
      if (next.getFullYear() < MIN_YEAR) return prev;
      if (
        prev.some(
          (item) =>
            item.year === next.getFullYear() && item.month === next.getMonth(),
        )
      ) {
        return prev;
      }
      return [{ year: next.getFullYear(), month: next.getMonth() }, ...prev];
    });
  }, []);
  const appendYear = useCallback(() => {
    setMonthYears((prev) => {
      const next = prev[prev.length - 1] + 1;
      if (next > MAX_YEAR) return prev;
      if (prev.includes(next)) return prev;
      return [...prev, next];
    });
  }, []);
  const prependYear = useCallback(() => {
    setMonthYears((prev) => {
      const next = prev[0] - 1;
      if (next < MIN_YEAR) return prev;
      if (prev.includes(next)) return prev;
      return [next, ...prev];
    });
  }, []);

  const handleDayPress = useCallback(
    (item: StripItem) => {
      if (item.type !== "day") return;
      onDateSelect(toIso(item.date));
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [onDateSelect],
  );
  const handleMonthPress = useCallback(
    (item: StripItem) => {
      if (item.type !== "month") return;
      onDateSelect(toIso(item.date));
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [onDateSelect],
  );

  const targetHeight = useMemo(() => {
    if (!visible) return 0;
    if (mode === "day-strip") return DAY_ROW_HEIGHT;
    if (mode === "month-strip") return MONTH_ROW_HEIGHT;
    return calendarHeight || 360;
  }, [calendarHeight, mode, visible]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: targetHeight,
        duration: 260,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: visible ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [animatedHeight, animatedOpacity, targetHeight, visible]);

  const renderDayItem = useCallback(
    (item: StripItem, active: boolean) => {
      if (item.type === "label") {
        return (
          <SeparatorLabel
            label={item.label}
            width={item.width}
            color={theme.colors.onSurfaceVariant}
          />
        );
      }

      const iso = toIso(item.date);
      const isToday = iso === toIso(today);

      return (
        <View style={styles.dayColumn}>
          <View style={styles.dowLabelWrap}>
            <Text
              style={[
                styles.dowLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {formatWeekdayLabel(item.date)}
            </Text>
          </View>
          <Pressable
            onPress={() => handleDayPress(item)}
            style={({ pressed }) => [
              styles.dayPill,
              {
                backgroundColor: active
                  ? theme.colors.primary
                  : backgroundColor,
                borderColor: theme.colors.outlineVariant,
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text
              style={[
                styles.dayPillText,
                { color: active ? palette.black : theme.colors.onSurface },
                isToday && !active && { color: theme.colors.primary },
              ]}
              numberOfLines={1}
            >
              {formatDayLabel(item.date)}
            </Text>
          </Pressable>
        </View>
      );
    },
    [
      backgroundColor,
      handleDayPress,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      theme.colors.outlineVariant,
      theme.colors.primary,
      today,
    ],
  );

  const renderMonthItem = useCallback(
    (item: StripItem, active: boolean) => {
      if (item.type === "label") {
        return (
          <SeparatorLabel
            label={item.label}
            width={item.width}
            color={theme.colors.onSurfaceVariant}
          />
        );
      }

      return (
        <View style={styles.monthColumn}>
          <Pressable
            onPress={() => handleMonthPress(item)}
            style={({ pressed }) => [
              styles.monthPill,
              {
                backgroundColor: active
                  ? theme.colors.primary
                  : backgroundColor,
                borderColor: theme.colors.outlineVariant,
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text
              style={[
                styles.monthPillText,
                { color: active ? palette.black : theme.colors.onSurface },
              ]}
              numberOfLines={1}
            >
              {formatMonthLabel(item.date)}
            </Text>
          </Pressable>
        </View>
      );
    },
    [
      backgroundColor,
      handleMonthPress,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      theme.colors.outlineVariant,
      theme.colors.primary,
    ],
  );

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.railWrap,
        {
          height: animatedHeight,
          opacity: animatedOpacity,
        },
      ]}
    >
      <View>
        {mode === "calendar" ? (
          <View
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;
              if (nextHeight > 0 && nextHeight !== calendarHeight) {
                setCalendarHeight(nextHeight);
              }
            }}
          >
            <InlineCalendar
              visible={visible}
              selectedDate={selectedDate}
              backgroundColor={backgroundColor}
              onDateSelect={onDateSelect}
            />
          </View>
        ) : mode === "day-strip" ? (
          <GrowingStrip
            items={dayItems}
            selectedKey={selectedKey}
            listRef={dayListRef}
            rowHeight={DAY_ROW_HEIGHT}
            onReachEnd={appendMonth}
            onReachStart={prependMonth}
            renderItem={renderDayItem}
          />
        ) : (
          <GrowingStrip
            items={monthItems}
            selectedKey={selectedKey}
            listRef={monthListRef}
            rowHeight={MONTH_ROW_HEIGHT}
            onReachEnd={appendYear}
            onReachStart={prependYear}
            renderItem={renderMonthItem}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  railWrap: { gap: 6, overflow: "hidden" },

  separatorItem: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  separatorText: {
    ...typography.editorial.sectionLabel,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 1,
    textAlign: "center",
    includeFontPadding: false,
  },

  dayColumn: { width: DAY_ITEM_WIDTH, alignItems: "center" },
  dowLabelWrap: {
    width: DAY_ITEM_WIDTH,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dowLabel: {
    ...typography.editorial.sectionLabel,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  dayPill: {
    width: DAY_ITEM_WIDTH,
    height: DAY_ITEM_WIDTH,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 0.5,
  },
  dayPillText: {
    ...typography.editorial.sectionLabel,
    fontSize: 13,
    lineHeight: 14,
    letterSpacing: 0.6,
    textAlign: "center",
  },
  monthColumn: {
    width: MONTH_ITEM_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  monthPill: {
    width: MONTH_ITEM_WIDTH,
    minHeight: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderWidth: 0.5,
  },
  monthPillText: {
    ...typography.editorial.sectionLabel,
    fontSize: 13,
    lineHeight: 14,
    letterSpacing: 0.6,
    textAlign: "center",
  },
});
