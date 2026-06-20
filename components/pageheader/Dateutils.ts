import type { MD3Theme } from "react-native-paper";
import {
    DAY_ITEM_WIDTH,
    LABEL_ITEM_WIDTH,
    MONTH_ITEM_WIDTH,
} from "./constants";
import type { StripItem } from "./types";

export function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month: month - 1, day };
}

export function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDayLabel(date: Date) {
  return String(date.getDate());
}

export function formatDayChipLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date);
}

export function formatWeekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date);
}

export function formatLongMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { month: "long" }).format(date);
}

export function formatMonthChipLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function clampIndex(index: number, count: number) {
  return Math.max(0, Math.min(count - 1, index));
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function dayKey(date: Date) {
  return toIso(date);
}

export function buildDayItems(
  months: { year: number; month: number }[],
): StripItem[] {
  const items: StripItem[] = [];

  months.forEach((monthInfo, index) => {
    const firstOfMonth = new Date(monthInfo.year, monthInfo.month, 1);
    const daysInMonth = new Date(
      monthInfo.year,
      monthInfo.month + 1,
      0,
    ).getDate();
    const previousMonth = months[index - 1];
    const isYearBoundary =
      previousMonth != null && previousMonth.year !== monthInfo.year;

    if (isYearBoundary) {
      items.push({
        key: `year-${monthInfo.year}`,
        type: "label",
        label: String(monthInfo.year),
        width: LABEL_ITEM_WIDTH,
      });
    }

    items.push({
      key: `month-${monthKey(monthInfo.year, monthInfo.month)}`,
      type: "label",
      label: formatLongMonthLabel(firstOfMonth),
      width: Math.max(LABEL_ITEM_WIDTH, 56),
    });

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(monthInfo.year, monthInfo.month, day);
      items.push({
        key: `day-${dayKey(date)}`,
        type: "day",
        date,
        width: DAY_ITEM_WIDTH,
      });
    }
  });

  return items;
}

export function buildMonthItems(years: number[]): StripItem[] {
  const items: StripItem[] = [];
  years.forEach((year, index) => {
    for (let month = 0; month < 12; month += 1) {
      if (index > 0 && month === 0) {
        items.push({
          key: `year-${year}`,
          type: "label",
          label: String(year),
          width: LABEL_ITEM_WIDTH,
        });
      }
      const date = new Date(year, month, 1);
      items.push({
        key: `month-${monthKey(year, month)}`,
        type: "month",
        date,
        width: MONTH_ITEM_WIDTH,
      });
    }
  });
  return items;
}

export function buildCalendarTheme(theme: MD3Theme) {
  return {
    calendarBackground: "transparent",
    backgroundColor: "transparent",
    monthTextColor: theme.colors.onSurface,
    textMonthFontSize: 14,
    textMonthFontWeight: "700" as const,
    arrowColor: theme.colors.primary,
    textSectionTitleColor: theme.colors.onSurfaceVariant,
    textDayHeaderFontSize: 11,
    textDayHeaderFontWeight: "600" as const,
    dayTextColor: theme.colors.onSurface,
    textDayFontSize: 13,
    textDayFontWeight: "500" as const,
    todayTextColor: theme.colors.primary,
    todayBackgroundColor: "transparent",
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: theme.colors.onPrimary,
    textDisabledColor: theme.dark
      ? theme.colors.onSurfaceVariant + "55"
      : theme.colors.outlineVariant,
  };
}
