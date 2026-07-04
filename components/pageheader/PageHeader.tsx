// PageHeader.tsx
import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

type PageHeaderViewProps = PageHeaderProps & {
  resetKey?: string | null;
};

const PANEL_SWITCH_DELAY_MS = 280;

function BasicPageHeader({
  title,
  rightSlot,
  bottomSlot,
  backgroundColor,
}: BasicPageHeaderProps) {
  return (
    <HeaderShell
      title={title}
      right={rightSlot}
      bottom={bottomSlot}
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
  rightSlot,
  bottomSlot,
  externalOverlayVisible = false,
  onExternalOverlayClose,
  onDatePickerVisibilityChange,
  datePickerCloseRequestToken = 0,
  resetKey,
}: DatePageHeaderProps & { resetKey?: string | null }) {
  const theme = useTheme();
  const [pickerMode, setPickerMode] =
    useState<DatePickerMode>(initialPickerMode);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [deferredOpenMode, setDeferredOpenMode] =
    useState<DatePickerMode | null>(null);
  const closeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deferredOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pickerVisibleRef = useRef(false);
  const lastCloseRequestTokenRef = useRef(datePickerCloseRequestToken);
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
      if (deferredOpenTimerRef.current) {
        clearTimeout(deferredOpenTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    pickerVisibleRef.current = pickerVisible;
    onDatePickerVisibilityChange?.(pickerVisible);
  }, [onDatePickerVisibilityChange, pickerVisible]);

  useEffect(() => {
    if (closeResetTimerRef.current) {
      clearTimeout(closeResetTimerRef.current);
      closeResetTimerRef.current = null;
    }
    if (deferredOpenTimerRef.current) {
      clearTimeout(deferredOpenTimerRef.current);
      deferredOpenTimerRef.current = null;
    }
    setPickerVisible(false);
    setPickerMode(initialPickerMode);
    setDeferredOpenMode(null);
  }, [initialPickerMode, resetKey]);

  useEffect(() => {
    if (!externalOverlayVisible) return;
    if (closeResetTimerRef.current) {
      clearTimeout(closeResetTimerRef.current);
      closeResetTimerRef.current = null;
    }
    if (deferredOpenTimerRef.current) {
      clearTimeout(deferredOpenTimerRef.current);
      deferredOpenTimerRef.current = null;
    }
    setPickerVisible(false);
    setPickerMode(initialPickerMode);
  }, [externalOverlayVisible, initialPickerMode]);

  useEffect(() => {
    if (deferredOpenTimerRef.current) {
      clearTimeout(deferredOpenTimerRef.current);
      deferredOpenTimerRef.current = null;
    }
    if (externalOverlayVisible || !deferredOpenMode) return;

    deferredOpenTimerRef.current = setTimeout(() => {
      setPickerMode(deferredOpenMode);
      setPickerVisible(true);
      setDeferredOpenMode(null);
      deferredOpenTimerRef.current = null;
    }, PANEL_SWITCH_DELAY_MS);
  }, [deferredOpenMode, externalOverlayVisible]);

  const handleClose = useCallback(() => {
    setPickerVisible(false);
    if (closeResetTimerRef.current) {
      clearTimeout(closeResetTimerRef.current);
    }
    closeResetTimerRef.current = setTimeout(() => {
      setPickerMode(initialPickerMode);
      closeResetTimerRef.current = null;
    }, PANEL_SWITCH_DELAY_MS);
  }, [initialPickerMode]);

  useEffect(() => {
    if (datePickerCloseRequestToken === lastCloseRequestTokenRef.current) {
      return;
    }
    lastCloseRequestTokenRef.current = datePickerCloseRequestToken;
    if (!pickerVisibleRef.current) {
      return;
    }
    handleClose();
  }, [datePickerCloseRequestToken, handleClose]);

  const selectedDateObj = useMemo(() => {
    const parts = parseIso(selectedDate);
    return new Date(parts.year, parts.month, parts.day);
  }, [selectedDate]);

  const rightLabel = useMemo(() => {
    switch (pickerVisible ? pickerMode : initialPickerMode) {
      case "month-strip":
        return formatMonthChipLabel(selectedDateObj);
      case "calendar":
        return formatDayChipLabel(selectedDateObj);
      case "day-strip":
      default:
        return formatDayChipLabel(selectedDateObj);
    }
  }, [initialPickerMode, pickerMode, pickerVisible, selectedDateObj]);

  const handleLongPress = useCallback(() => {
    if (externalOverlayVisible) {
      setDeferredOpenMode(secondaryPickerMode);
      onExternalOverlayClose?.();
      return;
    }
    setPickerMode(secondaryPickerMode);
    setPickerVisible(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [externalOverlayVisible, onExternalOverlayClose, secondaryPickerMode]);

  return (
    <View>
      <HeaderShell
        title={title}
        backgroundColor={backgroundColor}
        bottom={bottomSlot}
        right={
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            {rightSlot}
            <DateChip
              label={rightLabel}
              expanded={pickerVisible && !externalOverlayVisible}
              onPress={() => {
                if (externalOverlayVisible) {
                  setDeferredOpenMode(initialPickerMode);
                  onExternalOverlayClose?.();
                  return;
                }
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
          </View>
        }
      />
      <DatePickerRail
        visible={pickerVisible}
        selectedDate={selectedDate}
        mode={pickerMode}
        onDateSelect={onDateSelect}
        backgroundColor={theme.colors.surface}
      />
    </View>
  );
}

export function PageHeader({ resetKey, ...props }: PageHeaderViewProps) {
  const { animStyle } = useFadeSlide({
    from: "top",
    distance: 120,
    duration: 750,
  });

  return (
    <Animated.View style={animStyle}>
      {isDateHeader(props) ? (
        <DateAwarePageHeader {...props} resetKey={resetKey} />
      ) : (
        <BasicPageHeader {...props} />
      )}
    </Animated.View>
  );
}
