import type React from "react";

export type BasicPageHeaderProps = {
  variant?: "basic";
  title: string;
  rightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  backgroundColor?: string;
};

export type DatePickerMode = "day-strip" | "month-strip" | "calendar";

export type DatePageHeaderProps = {
  variant: "date";
  title: string;
  selectedDate: string;
  onDateSelect: (iso: string) => void;
  initialPickerMode?: DatePickerMode;
  backgroundColor?: string;
  rightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  externalOverlayVisible?: boolean;
  onExternalOverlayClose?: () => void;
  onDatePickerVisibilityChange?: (visible: boolean) => void;
  datePickerCloseRequestToken?: number;
};

export type PageHeaderProps = BasicPageHeaderProps | DatePageHeaderProps;

export type StripItem =
  | {
      key: string;
      type: "day";
      date: Date;
      width: number;
    }
  | {
      key: string;
      type: "month";
      date: Date;
      width: number;
    }
  | {
      key: string;
      type: "label";
      label: string;
      width: number;
    };

export function isDateHeader(
  props: PageHeaderProps,
): props is DatePageHeaderProps {
  return props.variant === "date";
}
