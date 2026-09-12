// components/shared/InlineDatePicker.tsx

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useTheme, type MD3Theme } from "react-native-paper";
import { AnimatedPaperModal } from "../modal/modal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayIso(): string {
  const now = new Date();
  return isoFromParts(now.getFullYear(), now.getMonth(), now.getDate());
}

function toCalendarMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface InlineDatePickerProps {
  visible: boolean;
  onDismiss: () => void;
  date: string;
  onDateChange: (iso: string) => void;
  isMobileLayout: boolean;
  width: number;
  bottom: number;
  calendarMonth: number;
  calendarYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  disableFuture?: boolean;
  minDate?: string;
  showSummaryCard?: boolean;
}

// ─── buildTheme ───────────────────────────────────────────────────────────────

function buildTheme(theme: MD3Theme) {
  return {
    calendarBackground: "transparent",
    backgroundColor: "transparent",
    monthTextColor: theme.colors.onSurface,
    textMonthFontSize: 16,
    textMonthFontWeight: "700" as const,
    arrowColor: theme.colors.primary,
    textSectionTitleColor: theme.colors.onSurfaceVariant,
    textDayHeaderFontSize: 13,
    textDayHeaderFontWeight: "600" as const,
    dayTextColor: theme.colors.onSurface,
    textDayFontSize: 14,
    textDayFontWeight: "500" as const,
    todayTextColor: theme.colors.primary,
    todayBackgroundColor: "transparent",
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: theme.colors.onPrimary,
    textDisabledColor: theme.dark
      ? theme.colors.onSurfaceVariant
      : theme.colors.outlineVariant,
    dotColor: theme.colors.primary,
    selectedDotColor: theme.colors.onPrimary,
    todayButtonTextColor: theme.colors.primary,
  };
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({
  today,
  theme,
  onSelectToday,
}: {
  today: string;
  theme: MD3Theme;
  onSelectToday: () => void;
}) {
  return (
    <Pressable
      onPress={onSelectToday}
      style={({ pressed }) => [
        summaryStyles.container,
        {
          borderBottomColor: theme.colors.outlineVariant,
          backgroundColor: pressed
            ? theme.colors.surfaceVariant
            : "transparent",
        },
      ]}
    >
      <Text
        style={[summaryStyles.label, { color: theme.colors.onSurfaceVariant }]}
      >
        Today
      </Text>
      <Text
        style={[summaryStyles.date, { color: theme.colors.onSurface }]}
        numberOfLines={1}
      >
        {formatDisplayDate(today)}
      </Text>
    </Pressable>
  );
}

const summaryStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function InlineDatePicker({
  visible,
  onDismiss,
  date,
  onDateChange,
  isMobileLayout,
  width,
  bottom: safeBottom,
  calendarMonth,
  calendarYear,
  onMonthChange,
  onYearChange,
  disableFuture = false,
  minDate,
  showSummaryCard = false,
}: InlineDatePickerProps) {
  const theme = useTheme<MD3Theme>();
  const calendarTheme = buildTheme(theme);

  const today = todayIso();
  const currentMonth = toCalendarMonth(calendarYear, calendarMonth);

  const markedDates = date
    ? { [date]: { selected: true, disableTouchEvent: true } }
    : {};

  function handleSelectToday() {
    const now = new Date();
    onDateChange(today);
    onMonthChange(now.getMonth());
    onYearChange(now.getFullYear());
    onDismiss();
  }

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation={isMobileLayout ? "sheet" : "modal"}
      zIndex={1950}
      contentContainerStyle={
        isMobileLayout
          ? [
              styles.sheetContainer,
              { backgroundColor: theme.colors.background },
            ]
          : [
              styles.modalContainer,
              {
                width: Math.min(420, width - 64),
                backgroundColor: theme.colors.background,
              },
            ]
      }
    >
      {/* Sheet handle — only shown in sheet (mobile) presentation */}
      {isMobileLayout && (
        <View
          style={[
            styles.handle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
      )}

      {showSummaryCard && (
        <SummaryCard
          today={today}
          theme={theme}
          onSelectToday={handleSelectToday}
        />
      )}

      <Calendar
        key={currentMonth}
        current={currentMonth}
        markedDates={markedDates}
        theme={calendarTheme}
        maxDate={disableFuture ? today : undefined}
        minDate={minDate}
        hideExtraDays={false}
        enableSwipeMonths
        onDayPress={(day) => {
          onDateChange(day.dateString);
          onDismiss();
        }}
        onMonthChange={(month) => {
          onMonthChange(month.month - 1);
          onYearChange(month.year);
        }}
      />
    </AnimatedPaperModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: "hidden",
  },
  modalContainer: {
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
});
