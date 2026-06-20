// PageHeader.tsx
import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useTheme } from "react-native-paper";

import { DateChip } from "./DateChip";
import {
  formatDayChipLabel,
  formatMonthChipLabel,
  parseIso,
} from "./Dateutils";
import { HeaderShell } from "./HeaderShell";
import { DatePickerRail } from "./Strip";
import type {
  BasicPageHeaderProps,
  DatePageHeaderProps,
  DatePickerMode,
  PageHeaderProps,
} from "./types";
import { isDateHeader } from "./types";

function BasicPageHeader({
  title,
  rightSlot,
  backgroundColor,
}: BasicPageHeaderProps) {
  return (
    <HeaderShell
      title={title}
      right={rightSlot}
      backgroundColor={backgroundColor}
    />
  );
}

function DateAwarePageHeader({
  title,
  selectedDate,
  onDateSelect,
  initialPickerMode = "day-strip",
  backgroundColor,
}: DatePageHeaderProps) {
  const theme = useTheme();
  const [pickerMode, setPickerMode] =
    useState<DatePickerMode>(initialPickerMode);
  const [pickerVisible, setPickerVisible] = useState(false);
  const closeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondaryPickerMode: DatePickerMode =
    initialPickerMode === "calendar" ? "day-strip" : "calendar";

  useEffect(() => {
    setPickerMode(initialPickerMode);
  }, [initialPickerMode]);

  useEffect(() => {
    return () => {
      if (closeResetTimerRef.current) {
        clearTimeout(closeResetTimerRef.current);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    setPickerVisible(false);
    if (closeResetTimerRef.current) {
      clearTimeout(closeResetTimerRef.current);
    }
    closeResetTimerRef.current = setTimeout(() => {
      setPickerMode(initialPickerMode);
      closeResetTimerRef.current = null;
    }, 280);
  }, [initialPickerMode]);

  const selectedDateObj = useMemo(() => {
    const parts = parseIso(selectedDate);
    return new Date(parts.year, parts.month, parts.day);
  }, [selectedDate]);

  const rightLabel = useMemo(() => {
    switch (pickerVisible ? pickerMode : initialPickerMode) {
      case "month-strip":
        return formatMonthChipLabel(selectedDateObj);
      case "calendar":
        return new Intl.DateTimeFormat("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(selectedDateObj);
      case "day-strip":
      default:
        return formatDayChipLabel(selectedDateObj);
    }
  }, [initialPickerMode, pickerMode, pickerVisible, selectedDateObj]);

  const handleLongPress = useCallback(() => {
    setPickerMode(secondaryPickerMode);
    setPickerVisible(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [secondaryPickerMode]);

  return (
    <View>
      <HeaderShell
        title={title}
        backgroundColor={backgroundColor}
        right={
          <DateChip
            label={rightLabel}
            expanded={pickerVisible}
            onPress={() => {
              if (pickerVisible) {
                handleClose();
                return;
              }
              setPickerMode(initialPickerMode);
              setPickerVisible(true);
            }}
            onLongPress={handleLongPress}
            backgroundColor={backgroundColor ?? theme.colors.elevation.level0}
          />
        }
      />
      <DatePickerRail
        visible={pickerVisible}
        selectedDate={selectedDate}
        mode={pickerMode}
        onDateSelect={onDateSelect}
        backgroundColor={backgroundColor ?? theme.colors.elevation.level0}
      />
    </View>
  );
}

export function PageHeader(props: PageHeaderProps) {
  const { animStyle } = useFadeSlide({
    from: "top",
    distance: 120,
    duration: 750,
  });

  return (
    <Animated.View style={animStyle}>
      {isDateHeader(props) ? (
        <DateAwarePageHeader {...props} />
      ) : (
        <BasicPageHeader {...props} />
      )}
    </Animated.View>
  );
}
