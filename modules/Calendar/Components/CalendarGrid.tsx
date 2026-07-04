import React, { useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { buildCalendarStyles } from "../Styles";
import type { CalendarTokens } from "../Tokens";
import type { CalendarDay } from "../Types";
import { isTodayString } from "../Utils";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type CalendarGridProps = {
  weeks: CalendarDay[][];
  selectedDateString: string | null;
  rowAnims: Animated.Value[];
  onDayPress: (day: CalendarDay) => void;
  onDayLongPress: (day: CalendarDay) => void;
  cellSize: number;
  tokens: CalendarTokens;
};

function CalendarDayCell({
  day,
  isSelected,
  onPress,
  onLongPress,
  cellSize,
  tokens,
}: {
  day: CalendarDay;
  isSelected: boolean;
  onPress: (event: GestureResponderEvent) => void;
  onLongPress: () => void;
  cellSize: number;
  tokens: CalendarTokens;
}) {
  const styles = buildCalendarStyles(tokens);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isToday = day.dateString ? isTodayString(day.dateString) : false;
  const showIncomeDot = Boolean(day.activity?.hasIncome);
  const showExpenseDot = Boolean(day.activity?.hasExpense);

  if (day.day === null) {
    return (
      <View
        style={[styles.emptyDayCell, { width: cellSize, height: cellSize }]}
      />
    );
  }

  const triggerPressAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        width: cellSize,
        height: cellSize,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={day.dateString ?? undefined}
        onPress={(event) => {
          triggerPressAnimation();
          onPress(event);
        }}
        onLongPress={onLongPress}
        style={[
          styles.dayCellBase,
          { width: cellSize, height: cellSize },
          isToday ? styles.dayCellToday : null,
          isSelected ? styles.dayCellSelected : null,
        ]}
      >
        <Text
          style={[
            styles.dayNumber,
            !day.activity ? styles.dayNumberMuted : null,
            isSelected ? styles.dayNumberSelected : null,
          ]}
        >
          {day.day}
        </Text>
        <View style={styles.dotRow}>
          {showIncomeDot ? (
            <View
              style={[
                styles.dot,
                styles.dotIncome,
                isSelected ? styles.dotSelected : null,
              ]}
            />
          ) : null}
          {showExpenseDot ? (
            <View
              style={[
                styles.dot,
                styles.dotExpense,
                isSelected ? styles.dotSelected : null,
              ]}
            />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function CalendarGrid({
  weeks,
  selectedDateString,
  rowAnims,
  onDayPress,
  onDayLongPress,
  cellSize,
  tokens,
}: CalendarGridProps) {
  const styles = useMemo(() => buildCalendarStyles(tokens), [tokens]);
  const rowStyles = useMemo(
    () =>
      rowAnims.map((value) => ({
        opacity: value,
        transform: [
          {
            translateY: value.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      })),
    [rowAnims],
  );

  return (
    <View style={styles.gridCard}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.weeksWrap}>
        {weeks.map((week, index) => (
          <Animated.View
            key={`week-${index}`}
            style={[styles.weekRow, rowStyles[index]]}
          >
            {week.map((day, dayIndex) => (
              <CalendarDayCell
                key={day.dateString ?? `empty-${index}-${dayIndex}`}
                day={day}
                isSelected={day.dateString === selectedDateString}
                onPress={() => onDayPress(day)}
                onLongPress={() => onDayLongPress(day)}
                cellSize={cellSize}
                tokens={tokens}
              />
            ))}
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
