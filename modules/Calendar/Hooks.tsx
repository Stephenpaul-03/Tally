import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import type { DayActivity, SelectedDaySummary } from "./Types";
import { formatDayLabel, getDayName } from "./Utils";

export function useCalendarMonth(initialYear: number, initialMonth: number) {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateMonthChange = useCallback(
    (nextDirection: "left" | "right", onMidpoint: () => void) => {
      if (isAnimating) {
        return;
      }
      setDirection(nextDirection);
      setIsAnimating(true);
      slideAnim.setValue(0);

      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: nextDirection === "left" ? -1 : 1,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) {
          setIsAnimating(false);
          setDirection(null);
          slideAnim.setValue(0);
          return;
        }
        setIsAnimating(false);
        setDirection(null);
      });

      setTimeout(() => {
        onMidpoint();
        slideAnim.setValue(nextDirection === "left" ? 1 : -1);
      }, 150);
    },
    [isAnimating, slideAnim],
  );

  const goToNextMonth = useCallback(() => {
    animateMonthChange("left", () => {
      setCurrentMonth((previousMonth) => {
        if (previousMonth === 11) {
          setCurrentYear((previousYear) => previousYear + 1);
          return 0;
        }
        return previousMonth + 1;
      });
    });
  }, [animateMonthChange]);

  const goToPrevMonth = useCallback(() => {
    animateMonthChange("right", () => {
      setCurrentMonth((previousMonth) => {
        if (previousMonth === 0) {
          setCurrentYear((previousYear) => previousYear - 1);
          return 11;
        }
        return previousMonth - 1;
      });
    });
  }, [animateMonthChange]);

  const setCalendarMonth = useCallback(
    (year: number, month: number) => {
      if (isAnimating) {
        return;
      }
      setCurrentYear(year);
      setCurrentMonth(month);
      slideAnim.setValue(0);
      setDirection(null);
    },
    [isAnimating, slideAnim],
  );

  return {
    currentYear,
    currentMonth,
    direction,
    slideAnim,
    isAnimating,
    goToNextMonth,
    goToPrevMonth,
    setCalendarMonth,
  };
}

export function useSelectedDay() {
  const [selectedDateString, setSelectedDateString] = useState<string | null>(
    null,
  );
  const [summary, setSummary] = useState<SelectedDaySummary | null>(null);

  const selectDay = useCallback(
    (
      dateString: string,
      activity: DayActivity | null,
      monthToDateBalance: number,
    ) => {
      const nextSummary: SelectedDaySummary = {
        dateString,
        label: formatDayLabel(dateString),
        dayName: getDayName(dateString),
        income: activity?.incomeTotal ?? 0,
        expense: activity?.expenseTotal ?? 0,
        monthToDateBalance,
        transactionCount: activity?.transactionCount ?? 0,
        hasActivity: (activity?.transactionCount ?? 0) > 0,
      };

      setSelectedDateString(dateString);
      setSummary(nextSummary);
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedDateString(null);
    setSummary(null);
  }, []);

  return {
    selectedDateString,
    summary,
    selectDay,
    clearSelection,
  };
}

export function useRowAnimations(weekCount: number, animationKey?: string) {
  const rowAnims = useMemo(
    () => Array.from({ length: weekCount }, () => new Animated.Value(0)),
    [weekCount],
  );

  useEffect(() => {
    rowAnims.forEach((value) => value.setValue(0));

    Animated.stagger(
      85,
      rowAnims.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [animationKey, rowAnims]);

  return rowAnims;
}
