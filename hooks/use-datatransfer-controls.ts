import React from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import {
    type ExportScope,
    type ImportExportOptions,
    useImportExport,
} from "@/hooks/use-import-export";
import {
    selectActiveExpenseCategories,
    selectActiveIncomeCategories,
    selectNonDeletedTransactions,
} from "@/modules/Data/Slices/TransactionSlice";
import type { TransactionFilters } from "@/utils/Types";

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, (month || 1) - 1, 1));
}

function defaultExportFileName(monthKey?: string) {
  if (!monthKey) {
    return `nest-transactions-${new Date().toISOString().split("T")[0]}`;
  }
  return `nest-transactions-${monthKey}`;
}

type ApplyFiltersHandler = (filters: TransactionFilters) => void;

const noopApplyFilters: ApplyFiltersHandler = () => {};

export function useDataTransferControls(
  handleApplyFilters: ApplyFiltersHandler = noopApplyFilters,
  options?: ImportExportOptions,
) {
  const dispatch = useAppDispatch();
  const nonDeletedTransactions = useAppSelector(selectNonDeletedTransactions);
  const incomeCategories = useAppSelector(selectActiveIncomeCategories);
  const expenseCategories = useAppSelector(selectActiveExpenseCategories);

  const {
    importTransactions,
    exportTransactions,
    buildImportPreview,
    confirmImportPreview,
  } = useImportExport(
    dispatch,
    handleApplyFilters,
    nonDeletedTransactions,
    incomeCategories,
    expenseCategories,
    options,
  );

  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [exportScope, setExportScope] = React.useState<ExportScope>("all");

  const availableMonths = React.useMemo(() => {
    const months = Array.from(
      new Set(nonDeletedTransactions.map((tx) => tx.date.slice(0, 7))),
    ).sort((a, b) => b.localeCompare(a));
    return months.map((value) => ({
      value,
      label: formatMonthLabel(value),
    }));
  }, [nonDeletedTransactions]);

  const latestMonth = availableMonths[0]?.value ?? "";
  const [singleMonth, setSingleMonth] = React.useState(latestMonth);
  const [rangeStartMonth, setRangeStartMonth] = React.useState(latestMonth);
  const [rangeEndMonth, setRangeEndMonth] = React.useState(latestMonth);
  const [exportFileName, setExportFileName] = React.useState(
    defaultExportFileName(latestMonth),
  );

  const getExportPreviewCount = React.useCallback(
    (
      scope: ExportScope,
      month?: string,
      startMonth?: string,
      endMonth?: string,
    ) => {
      if (scope === "all") return nonDeletedTransactions.length;
      if (scope === "month") {
        if (!month) return 0;
        return nonDeletedTransactions.filter((tx) => tx.date.startsWith(month))
          .length;
      }
      if (!startMonth || !endMonth) return 0;
      const [from, to] =
        startMonth <= endMonth
          ? [startMonth, endMonth]
          : [endMonth, startMonth];
      return nonDeletedTransactions.filter((tx) => {
        const monthKey = tx.date.slice(0, 7);
        return monthKey >= from && monthKey <= to;
      }).length;
    },
    [nonDeletedTransactions],
  );

  React.useEffect(() => {
    if (!availableMonths.length) return;
    setSingleMonth((prev) => prev || availableMonths[0].value);
    setRangeStartMonth((prev) => prev || availableMonths[0].value);
    setRangeEndMonth((prev) => prev || availableMonths[0].value);
  }, [availableMonths]);

  const resetExportForm = React.useCallback(() => {
    const fallbackMonth = availableMonths[0]?.value ?? "";
    setExportScope("all");
    setSingleMonth(fallbackMonth);
    setRangeStartMonth(fallbackMonth);
    setRangeEndMonth(fallbackMonth);
    setExportFileName(defaultExportFileName(fallbackMonth));
  }, [availableMonths]);

  const openExportModal = React.useCallback(() => {
    resetExportForm();
    setIsExportModalOpen(true);
  }, [resetExportForm]);

  const closeExportModal = React.useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const handleConfirmExport = React.useCallback(async () => {
    const result = await exportTransactions({
      scope: exportScope,
      month: exportScope === "month" ? singleMonth : undefined,
      startMonth: exportScope === "range" ? rangeStartMonth : undefined,
      endMonth: exportScope === "range" ? rangeEndMonth : undefined,
      fileName: exportFileName,
    });

    if (result) {
      setIsExportModalOpen(false);
    }

    return result;
  }, [
    exportFileName,
    exportScope,
    exportTransactions,
    rangeEndMonth,
    rangeStartMonth,
    singleMonth,
  ]);

  return {
    importTransactions,
    buildImportPreview,
    confirmImportPreview,
    resetExportForm,
    openExportModal,
    closeExportModal,
    handleConfirmExport,
    isExportModalOpen,
    exportScope,
    setExportScope,
    availableMonths,
    singleMonth,
    setSingleMonth,
    rangeStartMonth,
    setRangeStartMonth,
    rangeEndMonth,
    setRangeEndMonth,
    exportFileName,
    setExportFileName,
    getExportPreviewCount,
    exportTransactions,
  };
}
