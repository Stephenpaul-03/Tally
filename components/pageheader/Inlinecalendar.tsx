import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useTheme, type MD3Theme } from "react-native-paper";
import { buildCalendarTheme, parseIso } from "./Dateutils";

export function InlineCalendar({
  visible,
  selectedDate,
  backgroundColor,
  onDateSelect,
}: {
  visible: boolean;
  selectedDate: string;
  backgroundColor: string;
  onDateSelect: (iso: string) => void;
}) {
  const theme = useTheme<MD3Theme>();
  const calendarTheme = buildCalendarTheme(theme);
  const parts = parseIso(selectedDate);
  const [calendarMonth, setCalendarMonth] = useState(parts.month);
  const [calendarYear, setCalendarYear] = useState(parts.year);
  const currentMonth = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-01`;

  useEffect(() => {
    setCalendarMonth(parts.month);
    setCalendarYear(parts.year);
  }, [parts.month, parts.year]);

  return (
    <View style={[styles.calendarWrap, !visible && { height: 0, opacity: 0 }]}>
      <Calendar
        current={currentMonth}
        markedDates={{
          [selectedDate]: { selected: true, disableTouchEvent: true },
        }}
        theme={calendarTheme}
        hideExtraDays={false}
        enableSwipeMonths
        style={[styles.inlineCalendar, { backgroundColor }]}
        onDayPress={(day: { dateString: string }) => {
          onDateSelect(day.dateString);
        }}
        onMonthChange={(month: { month: number; year: number }) => {
          setCalendarMonth(month.month - 1);
          setCalendarYear(month.year);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inlineCalendar: { paddingHorizontal: 4 },
  calendarWrap: { overflow: "hidden" },
});
