import { getDateRangeFromPreset } from "./Helpers";
import { TransactionFilters } from "./Types";

export type FilterChip = {
  key: "category" | "account" | "period" | "dateStart" | "dateEnd";
  label: string;
};

export function createDefaultFilters(): TransactionFilters {
  return {
    category: "all",
    account: "all",
    date: undefined,
    datePreset: "all",
    search: undefined,
    tags: undefined,
  };
}

export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0;
  if (filters.category && filters.category !== "all") count += 1;
  if (filters.account && filters.account !== "all") count += 1;
  if (filters.datePreset) {
    if (filters.datePreset !== "month") count += 1;
  } else if (filters.date?.start || filters.date?.end) {
    count += 1;
  }
  return count;
}

export function getFilterChips(filters: TransactionFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  const datePresetLabel: Record<string, string> = {
    all: "All Transactions",
    today: "Today",
    week: "This Week",
    month: "This Month",
    lastmonth: "Last Month",
    last3months: "Last 3 Months",
  };

  if (filters.category && filters.category !== "all") {
    chips.push({ key: "category", label: `Category: ${filters.category}` });
  }

  if (filters.account && filters.account !== "all") {
    chips.push({
      key: "account",
      label: `Account: ${filters.account}`,
    });
  }

  if (filters.datePreset && filters.datePreset !== "custom") {
    if (filters.datePreset !== "month") {
      chips.push({
        key: "period",
        label: `Period: ${datePresetLabel[filters.datePreset] ?? "Custom"}`,
      });
    }
    return chips;
  }

  if (filters.date?.start) {
    chips.push({ key: "dateStart", label: `From: ${filters.date.start}` });
  }
  if (filters.date?.end) {
    chips.push({ key: "dateEnd", label: `To: ${filters.date.end}` });
  }

  return chips;
}

export function normalizeFilterPayload(
  filters: TransactionFilters,
): TransactionFilters {
  const nextFilters: TransactionFilters = {
    ...createDefaultFilters(),
    ...filters,
    date: filters.date ? { ...filters.date } : undefined,
    search: undefined,
    tags: undefined,
  };

  if (nextFilters.datePreset === "all") {
    nextFilters.date = undefined;
    return nextFilters;
  }

  if (
    nextFilters.datePreset &&
    nextFilters.datePreset !== "custom" &&
    !nextFilters.date
  ) {
    const range = getDateRangeFromPreset(nextFilters.datePreset);
    nextFilters.date = range ? { ...range } : undefined;
    return nextFilters;
  }

  if (
    !nextFilters.datePreset &&
    (nextFilters.date?.start || nextFilters.date?.end)
  ) {
    nextFilters.datePreset = "custom";
    return nextFilters;
  }

  if (!nextFilters.date && !nextFilters.datePreset) {
    const monthRange = getDateRangeFromPreset("month");
    nextFilters.datePreset = "month";
    nextFilters.date = monthRange ? { ...monthRange } : undefined;
  }

  return nextFilters;
}
