import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import * as Haptics from "expo-haptics";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Easing,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { InlineDatePicker } from "../datepicker/DatePickerModal";
// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_PILL_WIDTH = 38;
const STRIP_ITEM_GAP = 4;
const DAY_COLUMN_WIDTH = DAY_PILL_WIDTH + STRIP_ITEM_GAP;

const MONTH_PILL_WIDTH = 54;
const MONTH_COLUMN_WIDTH = MONTH_PILL_WIDTH + STRIP_ITEM_GAP;

const YEAR_PILL_WIDTH = 54;
const YEAR_COLUMN_WIDTH = YEAR_PILL_WIDTH + STRIP_ITEM_GAP;

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const VISIBILITY_THRESHOLD = 12;
const DAY_STRIP_LEADING_PADDING = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

export type HeaderLeftSlot =
  | { type: "hamburger"; onPress: () => void; accessibilityLabel?: string }
  | { type: "three-dots"; onPress: () => void; accessibilityLabel?: string }
  | { type: "custom"; render: () => React.ReactNode }
  | { type: "none" };

export type HeaderRightSlot =
  | { type: "date" }
  | { type: "custom"; render: () => React.ReactNode }
  | { type: "none" };

export type DayStripConfig = { type: "day-strip" };
export type CalendarStripConfig = { type: "calendar" };
export type CustomStripConfig = {
  type: "custom";
  render: (expanded: boolean) => React.ReactNode;
};
export type StripConfig =
  | DayStripConfig
  | CalendarStripConfig
  | CustomStripConfig;

export type DayDots = Record<
  string,
  { hasIncome?: boolean; hasExpense?: boolean }
>;

export type PageHeaderProps = DateAwarePageHeaderProps | SimplePageHeaderProps;

type DateAwarePageHeaderProps = {
  variant?: "date-aware";
  title?: string;
  selectedDate: string;
  onDateSelect: (iso: string) => void;
  left?: HeaderLeftSlot;
  right?: HeaderRightSlot;
  pickerMode?: "day-strip" | "calendar" | "month-strip";
  backgroundColor?: string;
  dayDots?: DayDots;
};

type SimplePageHeaderProps = {
  variant: "simple";
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  backgroundColor?: string;
};

// ─── Type guard ───────────────────────────────────────────────────────────────

function isSimple(p: PageHeaderProps): p is SimplePageHeaderProps {
  return p.variant === "simple";
}

// ─── SimplePageHeader ─────────────────────────────────────────────────────────

function SimplePageHeader({
  title,
  left,
  right,
  backgroundColor,
}: SimplePageHeaderProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        simpleStyles.container,
        { backgroundColor: backgroundColor ?? theme.colors.elevation.level0 },
      ]}
    >
      <View style={simpleStyles.side}>{left}</View>
      <View style={simpleStyles.center}>
        <Text
          variant="titleMedium"
          numberOfLines={1}
          style={[simpleStyles.title, { color: theme.colors.primary }]}
        >
          {title}
        </Text>
      </View>
      <View style={[simpleStyles.side, simpleStyles.sideRight]}>{right}</View>
    </View>
  );
}

const simpleStyles = StyleSheet.create({
  container: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  side: { width: 44, minHeight: 44, justifyContent: "center" },
  sideRight: { alignItems: "flex-end" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  title: {
    ...typography.editorial.sectionLabel,
    fontSize: 24,
    lineHeight: 24,
    letterSpacing: 0.6,
  },
});

// ─── Date helpers ─────────────────────────────────────────────────────────────

function isoFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayIso(): string {
  const now = new Date();
  return isoFromParts(now.getFullYear(), now.getMonth(), now.getDate());
}
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function isoWeekday(year: number, month: number, day: number): number {
  return (new Date(year, month, day).getDay() + 6) % 7;
}
function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}
function toCalendarMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}
function formatDateChip(
  iso: string,
  mode: "day-strip" | "calendar" | "month-strip",
): string {
  const { year, month, day } = parseDate(iso);
  if (mode === "month-strip") {
    const thisYear = new Date().getFullYear();
    return year === thisYear
      ? MONTH_NAMES_SHORT[month]
      : `${MONTH_NAMES_SHORT[month]} ${year}`;
  }
  return `${MONTH_NAMES_SHORT[month]} ${day}`;
}
function scrollToItem(
  ref: ScrollView | null,
  index: number,
  itemWidth: number,
) {
  if (!ref) return;
  ref.scrollTo({ x: Math.max(0, index * itemWidth), animated: true });
}
function computeVisibleIndices(
  scrollX: number,
  viewportWidth: number,
  itemWidth: number,
  count: number,
  leadingPadding: number,
  threshold = VISIBILITY_THRESHOLD,
): Set<number> {
  const visible = new Set<number>();
  for (let i = 0; i < count; i++) {
    const left = leadingPadding + i * itemWidth;
    const right = left + itemWidth;
    if (
      Math.min(right, scrollX + viewportWidth) - Math.max(left, scrollX) >=
      threshold
    ) {
      visible.add(i);
    }
  }
  return visible;
}
function buildCalendarTheme(theme: MD3Theme) {
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

// ─── HamburgerIcon ────────────────────────────────────────────────────────────

function HamburgerIcon({ color }: { color: string }) {
  return (
    <View style={localStyles.hamburgerWrap}>
      <View style={[localStyles.hamburgerLine, { backgroundColor: color }]} />
      <View
        style={[
          localStyles.hamburgerLine,
          localStyles.hamburgerLineMid,
          { backgroundColor: color },
        ]}
      />
      <View style={[localStyles.hamburgerLine, { backgroundColor: color }]} />
    </View>
  );
}

// ─── ThreeDotsIcon ────────────────────────────────────────────────────────────

function ThreeDotsIcon({ color }: { color: string }) {
  return (
    <View style={localStyles.threeDotsWrap}>
      <View style={[localStyles.dotCircle, { backgroundColor: color }]} />
      <View style={[localStyles.dotCircle, { backgroundColor: color }]} />
      <View style={[localStyles.dotCircle, { backgroundColor: color }]} />
    </View>
  );
}

// ─── AnimatedChevron ──────────────────────────────────────────────────────────

function AnimatedChevron({
  expanded,
  color,
}: {
  expanded: boolean;
  color: string;
}) {
  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, rotation]);
  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <View style={localStyles.chevronWrap}>
        <View
          style={[
            localStyles.chevronArm,
            localStyles.chevronLeft,
            { backgroundColor: color },
          ]}
        />
        <View
          style={[
            localStyles.chevronArm,
            localStyles.chevronRight,
            { backgroundColor: color },
          ]}
        />
      </View>
    </Animated.View>
  );
}

// ─── CalendarIcon ─────────────────────────────────────────────────────────────

function CalendarIcon({ color }: { color: string }) {
  const s = 14;
  return (
    <View style={{ width: s, height: s }}>
      <View
        style={{
          position: "absolute",
          top: 1,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 2.5,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 1,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: color,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 3,
          width: 1.5,
          height: 3,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 3,
          width: 1.5,
          height: 3,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// ─── DateChip ─────────────────────────────────────────────────────────────────

function DateChip({
  iso,
  expanded,
  onPress,
  onLongPress,
  showCalendarIcon,
  onCalendarPress,
  pickerMode,
  calendarIconActive,
}: {
  iso: string;
  expanded: boolean;
  onPress: () => void;
  onLongPress: () => void;
  showCalendarIcon: boolean;
  onCalendarPress: () => void;
  pickerMode: "day-strip" | "calendar" | "month-strip";
  calendarIconActive: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={localStyles.dateChipRow}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [
          localStyles.dateChip,
          {
            backgroundColor: expanded
              ? theme.colors.primary
              : theme.colors.background,
            borderColor: theme.colors.outlineVariant,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text
          style={[
            localStyles.dateChipText,
            { color: expanded ? palette.black : theme.colors.onSurface },
          ]}
          numberOfLines={1}
        >
          {formatDateChip(iso, pickerMode)}
        </Text>
        <AnimatedChevron
          expanded={expanded}
          color={expanded ? palette.black : theme.colors.onSurface}
        />
      </Pressable>
      {showCalendarIcon && (
        <Pressable
          onPress={onCalendarPress}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
          style={({ pressed }) => [
            localStyles.calendarIconBtn,
            {
              backgroundColor: calendarIconActive
                ? theme.colors.primary
                : theme.colors.background,
              borderColor: calendarIconActive
                ? theme.colors.primary
                : theme.colors.outlineVariant,
            },
            pressed && { opacity: 0.6 },
          ]}
        >
          <CalendarIcon
            color={calendarIconActive ? palette.black : theme.colors.onSurface}
          />
        </Pressable>
      )}
    </View>
  );
}

// ─── ScrollFadePill ───────────────────────────────────────────────────────────

function ScrollFadePill({
  children,
  visible,
}: {
  children: React.ReactNode;
  visible: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const prevVisible = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevVisible.current !== null && prevVisible.current !== visible) {
      Haptics.selectionAsync();
    }
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 200 : 160,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
    prevVisible.current = visible;
  }, [visible, opacity]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

// ─── DayDotIndicators ─────────────────────────────────────────────────────────

function DayDotIndicators({
  hasIncome,
  hasExpense,
}: {
  hasIncome?: boolean;
  hasExpense?: boolean;
}) {
  return (
    <View style={localStyles.dotsRow}>
      {hasIncome && (
        <View style={[localStyles.indicatorDot, localStyles.incomeDot]} />
      )}
      {hasExpense && (
        <View style={[localStyles.indicatorDot, localStyles.expenseDot]} />
      )}
    </View>
  );
}

// ─── DayStripInternal ─────────────────────────────────────────────────────────

const DAY_STRIP_MAX_HEIGHT = 74;

type DayStripInternalProps = {
  selectedDate: string;
  viewYear: number;
  viewMonth: number;
  onDaySelect: (day: number) => void;
  visible: boolean;
  scrollRef?: React.RefObject<ScrollView | null>;
  dayDots?: DayDots;
};

function DayStripInternal({
  selectedDate,
  viewYear,
  viewMonth,
  onDaySelect,
  visible,
  scrollRef,
  dayDots,
}: DayStripInternalProps) {
  const internalRef = useRef<ScrollView>(null);
  const ref = scrollRef ?? internalRef;
  const [viewportWidth, setViewportWidth] = useState(0);
  const scrollX = useRef(0);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(
    () => new Set(),
  );

  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 280,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, visible]);

  const stripDays = useMemo(() => {
    const total = getDaysInMonth(viewYear, viewMonth);
    return Array.from({ length: total }, (_, i) => {
      const day = i + 1;
      return { day, dow: isoWeekday(viewYear, viewMonth, day) };
    });
  }, [viewYear, viewMonth]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      scrollX.current = x;
      setVisibleIndices(
        computeVisibleIndices(
          x,
          viewportWidth,
          DAY_COLUMN_WIDTH,
          stripDays.length,
          DAY_STRIP_LEADING_PADDING,
        ),
      );
    },
    [viewportWidth, stripDays.length],
  );

  useEffect(() => {
    if (viewportWidth > 0) {
      setVisibleIndices(
        computeVisibleIndices(
          scrollX.current,
          viewportWidth,
          DAY_COLUMN_WIDTH,
          stripDays.length,
          DAY_STRIP_LEADING_PADDING,
        ),
      );
    }
  }, [stripDays, viewportWidth]);

  useEffect(() => {
    if (!selectedDate) return;
    const { day } = parseDate(selectedDate);
    setTimeout(() => scrollToItem(ref.current, day - 1, DAY_COLUMN_WIDTH), 100);
  }, [selectedDate, ref]);

  const theme = useTheme();
  const pillBg = theme.colors.primary;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={{
        overflow: "hidden",
        opacity: anim,
        maxHeight: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, DAY_STRIP_MAX_HEIGHT],
        }),
      }}
    >
      <ScrollView
        horizontal
        hitSlop={{ top: 12, bottom: 12, left: 0, right: 0 }}
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.daysContainer}
        ref={ref}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
      >
        {stripDays.map(({ day, dow }, index) => {
          const iso = isoFromParts(viewYear, viewMonth, day);
          const dots = dayDots?.[iso];
          const isActive = iso === selectedDate;
          const isToday = iso === todayIso();
          return (
            <View key={day} style={localStyles.dayColumn}>
              <ScrollFadePill visible={visibleIndices.has(index)}>
                <View style={localStyles.dowLabelWrap}>
                  <Text
                    style={[
                      localStyles.dowLabel,
                      { ...typography.editorial.sectionLabel, fontSize: 12 },
                    ]}
                  >
                    {DAY_NAMES[dow]}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDaySelect(day);
                  }}
                  style={({ pressed }) => [
                    localStyles.dayPill,
                    isActive && { backgroundColor: pillBg },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      localStyles.dayNumber,
                      { color: theme.colors.onSurface },
                      isToday &&
                        !isActive && [
                          localStyles.dayNumberActive,
                          { color: theme.colors.primary },
                        ],
                      isActive && [
                        localStyles.dayNumberActive,
                        { color: palette.black },
                      ],
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
                <DayDotIndicators
                  hasIncome={dots?.hasIncome}
                  hasExpense={dots?.hasExpense}
                />
              </ScrollFadePill>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

// ─── MonthStripInternal ───────────────────────────────────────────────────────

const MONTH_STRIP_MAX_HEIGHT = 74;

type MonthStripInternalProps = {
  selectedDate: string;
  viewYear: number;
  onMonthSelect: (monthIndex: number) => void;
  visible: boolean;
};

function MonthStripInternal({
  selectedDate,
  viewYear,
  onMonthSelect,
  visible,
}: MonthStripInternalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const scrollX = useRef(0);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(
    () => new Set(),
  );

  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 280,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, visible]);

  const { month: selectedMonth, year: selectedYear } = parseDate(selectedDate);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      scrollX.current = x;
      setVisibleIndices(
        computeVisibleIndices(
          x,
          viewportWidth,
          MONTH_COLUMN_WIDTH,
          12,
          DAY_STRIP_LEADING_PADDING,
        ),
      );
    },
    [viewportWidth],
  );

  useEffect(() => {
    if (viewportWidth > 0) {
      setVisibleIndices(
        computeVisibleIndices(
          scrollX.current,
          viewportWidth,
          MONTH_COLUMN_WIDTH,
          12,
          DAY_STRIP_LEADING_PADDING,
        ),
      );
    }
  }, [viewportWidth]);

  useEffect(() => {
    if (!visible) return;
    setTimeout(
      () => scrollToItem(scrollRef.current, selectedMonth, MONTH_COLUMN_WIDTH),
      120,
    );
  }, [visible, selectedMonth, viewYear]);

  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth();
  const theme = useTheme();
  const pillBg = theme.colors.primary;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={{
        overflow: "hidden",
        opacity: anim,
        maxHeight: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, MONTH_STRIP_MAX_HEIGHT],
        }),
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        hitSlop={{ top: 12, bottom: 12, left: 0, right: 0 }}
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.daysContainer}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
      >
        {MONTH_NAMES_SHORT.map((name, index) => {
          const isActive = index === selectedMonth && viewYear === selectedYear;
          const isToday = index === thisMonth && viewYear === thisYear;
          return (
            <View key={index} style={localStyles.monthColumn}>
              <ScrollFadePill visible={visibleIndices.has(index)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onMonthSelect(index);
                  }}
                  style={({ pressed }) => [
                    localStyles.monthPill,
                    isActive && { backgroundColor: pillBg },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      localStyles.monthPillText,
                      { color: theme.colors.onSurface },
                      isToday &&
                        !isActive && [
                          localStyles.monthPillTextToday,
                          { color: theme.colors.primary },
                        ],
                      isActive && [
                        localStyles.monthPillTextActive,
                        { color: palette.black },
                      ],
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
                <View style={{ height: 11 }} />
              </ScrollFadePill>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

// ─── YearStripInternal ────────────────────────────────────────────────────────

const YEAR_STRIP_MAX_HEIGHT = 74;

type YearStripInternalProps = {
  selectedYear: number;
  onYearSelect: (year: number) => void;
  visible: boolean;
};

function YearStripInternal({
  selectedYear,
  onYearSelect,
  visible,
}: YearStripInternalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const scrollX = useRef(0);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(
    () => new Set(),
  );

  const thisYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = thisYear - 50; y <= thisYear + 10; y++) list.push(y);
    return list;
  }, [thisYear]);

  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 280,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, visible]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      scrollX.current = x;
      setVisibleIndices(
        computeVisibleIndices(
          x,
          viewportWidth,
          YEAR_COLUMN_WIDTH,
          years.length,
          DAY_STRIP_LEADING_PADDING,
        ),
      );
    },
    [viewportWidth, years.length],
  );

  useEffect(() => {
    if (viewportWidth > 0) {
      setVisibleIndices(
        computeVisibleIndices(
          scrollX.current,
          viewportWidth,
          YEAR_COLUMN_WIDTH,
          years.length,
          DAY_STRIP_LEADING_PADDING,
        ),
      );
    }
  }, [viewportWidth, years.length]);

  useEffect(() => {
    if (!visible) return;
    const idx = years.indexOf(selectedYear);
    if (idx < 0) return;
    setTimeout(
      () => scrollToItem(scrollRef.current, idx, YEAR_COLUMN_WIDTH),
      120,
    );
  }, [visible, selectedYear, years]);

  const theme = useTheme();
  const pillBg = theme.colors.primary;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={{
        overflow: "hidden",
        opacity: anim,
        maxHeight: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, YEAR_STRIP_MAX_HEIGHT],
        }),
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        hitSlop={{ top: 12, bottom: 12, left: 0, right: 0 }}
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.daysContainer}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
      >
        {years.map((year, index) => {
          const isActive = year === selectedYear;
          const isCurrent = year === thisYear;
          return (
            <View key={year} style={localStyles.yearColumn}>
              <ScrollFadePill visible={visibleIndices.has(index)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onYearSelect(year);
                  }}
                  style={({ pressed }) => [
                    localStyles.yearPill,
                    isActive && { backgroundColor: pillBg },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      localStyles.yearPillText,
                      { color: theme.colors.onSurface },
                      isCurrent && !isActive && { color: theme.colors.primary },
                      isActive && [
                        localStyles.yearPillTextActive,
                        { color: palette.black },
                      ],
                    ]}
                  >
                    {year}
                  </Text>
                </Pressable>
                <View style={{ height: 11 }} />
              </ScrollFadePill>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

// ─── CalendarStripInternal ────────────────────────────────────────────────────

type CalendarStripInternalProps = {
  visible: boolean;
  selectedDate: string;
  calendarMonth: number;
  calendarYear: number;
  onDateChange: (iso: string) => void;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
};

function CalendarStripInternal({
  visible,
  selectedDate,
  calendarMonth,
  calendarYear,
  onDateChange,
  onMonthChange,
  onYearChange,
}: CalendarStripInternalProps) {
  const theme = useTheme<MD3Theme>();
  const calendarTheme = buildCalendarTheme(theme);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const animHeight = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  const animate = useCallback(
    (toHeight: number, toOpacity: number) => {
      Animated.parallel([
        Animated.timing(animHeight, {
          toValue: toHeight,
          duration: 420,
          easing:
            toHeight > 0 ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animOpacity, {
          toValue: toOpacity,
          duration: toOpacity > 0 ? 400 : 320,
          easing:
            toOpacity > 0 ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    },
    [animHeight, animOpacity],
  );

  useEffect(() => {
    if (measuredHeight === 0) return;
    animate(visible ? measuredHeight : 0, visible ? 1 : 0);
  }, [visible, measuredHeight, animate]);

  const handleSizerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = Math.ceil(e.nativeEvent.layout.height);
      if (h === 0 || h === measuredHeight) return;
      setMeasuredHeight(h);
      if (visible) {
        Animated.timing(animHeight, {
          toValue: h,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }
    },
    [measuredHeight, visible, animHeight],
  );

  const currentMonth = toCalendarMonth(calendarYear, calendarMonth);
  const markedDates = selectedDate
    ? { [selectedDate]: { selected: true, disableTouchEvent: true } }
    : {};
  const calendarProps = {
    current: currentMonth,
    markedDates,
    theme: calendarTheme,
    hideExtraDays: false,
    enableSwipeMonths: true,
    style: localStyles.inlineCalendar,
    onDayPress: (day: { dateString: string }) => onDateChange(day.dateString),
    onMonthChange: (month: { month: number; year: number }) => {
      onMonthChange(month.month - 1);
      onYearChange(month.year);
    },
  };

  return (
    <>
      <View
        pointerEvents="none"
        style={localStyles.calendarSizer}
        onLayout={handleSizerLayout}
      >
        <Calendar key={currentMonth} {...calendarProps} />
      </View>
      <Animated.View
        style={{ overflow: "hidden", height: animHeight, opacity: animOpacity }}
      >
        <Calendar key={currentMonth} {...calendarProps} />
      </Animated.View>
    </>
  );
}

// ─── DateAwarePageHeader ──────────────────────────────────────────────────────

function DateAwarePageHeader({
  title,
  selectedDate,
  onDateSelect,
  left = { type: "hamburger", onPress: () => {} },
  right = { type: "date" },
  pickerMode = "day-strip",
  backgroundColor,
  dayDots,
}: DateAwarePageHeaderProps) {
  const theme = useTheme();
  const dayScrollRef = useRef<ScrollView>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [yearStripOpen, setYearStripOpen] = useState(false);
  const [headerWidth, setHeaderWidth] = useState(0);

  const [viewDate, setViewDate] = useState(() => {
    const { year, month } = parseDate(selectedDate);
    return { year, month };
  });
  const [calendarMonth, setCalendarMonth] = useState(
    () => parseDate(selectedDate).month,
  );
  const [calendarYear, setCalendarYear] = useState(
    () => parseDate(selectedDate).year,
  );
  const [stripYear, setStripYear] = useState(
    () => parseDate(selectedDate).year,
  );

  const selectDate = useCallback(
    (iso: string) => {
      const { year, month } = parseDate(iso);
      setViewDate({ year, month });
      setCalendarMonth(month);
      setCalendarYear(year);
      onDateSelect(iso);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [onDateSelect],
  );

  const handleDaySelect = useCallback(
    (day: number) => {
      let d = day,
        month = viewDate.month,
        year = viewDate.year;
      const total = getDaysInMonth(year, month);
      if (d > total) {
        d = 1;
        month += 1;
      } else if (d < 1) {
        month -= 1;
        d = getDaysInMonth(year, month < 0 ? 11 : month);
      }
      if (month > 11) {
        month = 0;
        year += 1;
      } else if (month < 0) {
        month = 11;
        year -= 1;
      }
      setViewDate({ year, month });
      onDateSelect(isoFromParts(year, month, d));
    },
    [onDateSelect, viewDate],
  );

  const handleMonthSelect = useCallback(
    (monthIndex: number) => {
      const iso = isoFromParts(stripYear, monthIndex, 1);
      selectDate(iso);
    },
    [stripYear, selectDate],
  );

  const handleYearSelect = useCallback(
    (year: number) => {
      setStripYear(year);
      setYearStripOpen(false);
      const { month } = parseDate(selectedDate);
      selectDate(isoFromParts(year, month, 1));
    },
    [selectedDate, selectDate],
  );

  const renderLeft = () => {
    if (left.type === "hamburger") {
      return (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            left.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={left.accessibilityLabel ?? "Open menu"}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            localStyles.iconBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <HamburgerIcon color={theme.colors.onSurface} />
        </Pressable>
      );
    }
    if (left.type === "three-dots") {
      return (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            left.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={left.accessibilityLabel ?? "Open menu"}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            localStyles.iconBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <ThreeDotsIcon color={theme.colors.onSurface} />
        </Pressable>
      );
    }
    if (left.type === "custom") return <View>{left.render()}</View>;
    return <View style={localStyles.iconBtn} />;
  };

  const renderRight = () => {
    if (right.type === "date") {
      const showCalIcon =
        pickerMode === "day-strip" || pickerMode === "month-strip";
      return (
        <DateChip
          iso={selectedDate}
          expanded={pickerOpen}
          pickerMode={pickerMode}
          calendarIconActive={
            pickerMode === "month-strip" ? yearStripOpen : calendarModalOpen
          }
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerOpen((v) => !v);
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (pickerMode === "month-strip") {
              const now = new Date();
              setStripYear(now.getFullYear());
              selectDate(isoFromParts(now.getFullYear(), now.getMonth(), 1));
            } else {
              selectDate(todayIso());
            }
          }}
          showCalendarIcon={showCalIcon}
          onCalendarPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (pickerMode === "month-strip") {
              setYearStripOpen((v) => !v);
            } else {
              setCalendarModalOpen(true);
            }
          }}
        />
      );
    }
    if (right.type === "custom") return <View>{right.render()}</View>;
    return <View style={localStyles.iconBtn} />;
  };

  return (
    <View
      onLayout={(e) => setHeaderWidth(e.nativeEvent.layout.width)}
      style={[
        localStyles.container,
        { backgroundColor: backgroundColor ?? theme.colors.elevation.level0 },
      ]}
    >
      <View style={localStyles.navRow}>
        {renderLeft()}
        <View style={localStyles.navTitleWrap} pointerEvents="none">
          <Text style={[localStyles.navTitle, { color: theme.colors.primary }]}>
            {title ?? "Tally"}
          </Text>
        </View>
        {renderRight()}
      </View>

      {pickerMode === "day-strip" ? (
        <DayStripInternal
          selectedDate={selectedDate}
          viewYear={viewDate.year}
          viewMonth={viewDate.month}
          onDaySelect={handleDaySelect}
          visible={pickerOpen}
          scrollRef={dayScrollRef}
          dayDots={dayDots}
        />
      ) : pickerMode === "month-strip" ? (
        <>
          <MonthStripInternal
            selectedDate={selectedDate}
            viewYear={stripYear}
            onMonthSelect={handleMonthSelect}
            visible={pickerOpen}
          />
          <YearStripInternal
            visible={yearStripOpen}
            selectedYear={stripYear}
            onYearSelect={handleYearSelect}
          />
        </>
      ) : pickerMode === "calendar" ? (
        <CalendarStripInternal
          visible={pickerOpen}
          selectedDate={selectedDate}
          calendarMonth={calendarMonth}
          calendarYear={calendarYear}
          onDateChange={selectDate}
          onMonthChange={setCalendarMonth}
          onYearChange={setCalendarYear}
        />
      ) : null}

      {(pickerMode === "day-strip" || pickerMode === "month-strip") && (
        <InlineDatePicker
          visible={calendarModalOpen}
          onDismiss={() => setCalendarModalOpen(false)}
          date={selectedDate}
          onDateChange={(iso) => {
            selectDate(iso);
            setCalendarModalOpen(false);
          }}
          isMobileLayout={true}
          width={headerWidth}
          bottom={0}
          calendarMonth={calendarMonth}
          calendarYear={calendarYear}
          onMonthChange={setCalendarMonth}
          onYearChange={setCalendarYear}
          showSummaryCard={true}
        />
      )}
    </View>
  );
}

// ─── PageHeader (unified entry point) ────────────────────────────────────────

export function PageHeader(props: PageHeaderProps) {
  const { animStyle } = useFadeSlide({
    from: "top",
    distance: 120,
    duration: 750,
  });

  if (isSimple(props)) {
    return (
      <Animated.View style={animStyle}>
        <SimplePageHeader {...props} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animStyle}>
      <DateAwarePageHeader {...props} />
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  container: {
    zIndex: 1,
    paddingBottom: 6,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  navTitleWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  navTitle: {
    ...typography.editorial.sectionLabel,
    fontSize: 24,
    lineHeight: 24,
    letterSpacing: 0.6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  hamburgerWrap: { width: 20, height: 14, justifyContent: "space-between" },
  hamburgerLine: { height: 2, borderRadius: 1, width: "100%" },
  hamburgerLineMid: { width: "70%" },
  threeDotsWrap: {
    height: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  dotCircle: { width: 3, height: 3, borderRadius: 1.5 },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 0.5,
    maxWidth: 140,
  },
  dateChipText: {
    ...typography.editorial.sectionLabel,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
  },
  dateChipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  calendarIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronWrap: {
    width: 10,
    height: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chevronArm: { width: 6, height: 1.5, borderRadius: 1 },
  chevronLeft: { transform: [{ rotate: "35deg" }], marginRight: -0.5 },
  chevronRight: { transform: [{ rotate: "-35deg" }], marginLeft: -0.5 },
  daysContainer: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 6,
    gap: 4,
    flexDirection: "row",
  },
  dayColumn: { width: DAY_PILL_WIDTH, alignItems: "center" },
  dowLabelWrap: {
    width: DAY_PILL_WIDTH,
    alignItems: "center",
    marginBottom: 2,
  },
  dowLabel: {
    color: "#888",
    textAlign: "center",
  },
  dayPill: {
    width: DAY_PILL_WIDTH,
    height: DAY_PILL_WIDTH,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#CCCCCC",
    textAlign: "center",
  },
  dayNumberActive: { fontWeight: "700" },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 8,
    marginTop: 3,
    width: DAY_PILL_WIDTH,
  },
  indicatorDot: { width: 4, height: 4, borderRadius: 2 },
  incomeDot: { backgroundColor: "#4CAF50" },
  expenseDot: { backgroundColor: "#F44336" },
  monthColumn: { width: MONTH_PILL_WIDTH, alignItems: "center" },
  monthPill: {
    width: MONTH_PILL_WIDTH,
    height: DAY_PILL_WIDTH,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  monthPillText: {
    ...typography.editorial.sectionLabel,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  monthPillTextActive: {
    ...typography.editorial.sectionLabel,
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  monthPillTextToday: {
    ...typography.editorial.sectionLabel,
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  yearColumn: { width: YEAR_PILL_WIDTH, alignItems: "center" },
  yearPill: {
    width: YEAR_PILL_WIDTH,
    height: DAY_PILL_WIDTH,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  yearPillText: {
    ...typography.editorial.sectionLabel,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  yearPillTextActive: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  inlineCalendar: { paddingHorizontal: 4 },
  calendarSizer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1,
  },
});
