import type { MonthSummary } from "@/modules/Insights/Types";

export type HeaderMenuButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
};

export type HeaderMenuSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  showViewSection?: boolean;
  monthMode?: boolean;
  onToggleMonthMode?: () => void;
  showDatePickerSection?: boolean;
  datePickerCalendarMode?: boolean;
  onToggleDatePickerStyle?: () => void;
  isPrefsHydrated?: boolean;
  showMonthSection?: boolean;
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
  onOpenCategories?: () => void;
  onOpenAccounts?: () => void;
  insightsSummary?: MonthSummary;
  insightsMonthLabel?: string;
};