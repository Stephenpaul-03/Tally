export type ReportSelection = {
  includeIncome: boolean;
  includeExpenses: boolean;
  includeAccounts: boolean;
  compareBudget: boolean;
  compareMonth: boolean;
  layout: "sage" | "classic";
  expanded: string[];
};
export type ReportSectionKey = "includeIncome" | "includeExpenses" | "includeAccounts";
export function hasReportSections(value: Pick<ReportSelection, ReportSectionKey>) {
  return value.includeIncome || value.includeExpenses || value.includeAccounts;
}
export function toggleReportSection(value: ReportSelection, key: ReportSectionKey): ReportSelection {
  const next = { ...value, [key]: !value[key] };
  return hasReportSections(next) ? next : value;
}
export const reportDetailKey = (type: "income" | "expense" | "account", name: string) => JSON.stringify([type, name]);
export function reportComparisonMode(value: ReportSelection): "none" | "lastMonth" | "budget" | "both" {
  const budget = value.compareBudget && value.includeExpenses;
  return value.compareMonth ? (budget ? "both" : "lastMonth") : budget ? "budget" : "none";
}

export const REPORT_SECTIONS: ReportSectionKey[] = ["includeIncome", "includeExpenses", "includeAccounts"];
/** Ignore unavailable sections before validating the last remaining selection. */
export function availableReportSelection(value: ReportSelection, sections: Record<ReportSectionKey, boolean>, previous: Record<ReportSectionKey, boolean>, budget: boolean): ReportSelection {
  const next = { ...value };
  for (const key of REPORT_SECTIONS) next[key] = value[key] && sections[key];
  if (!hasReportSections(next)) {
    const fallback = REPORT_SECTIONS.find(key => sections[key]);
    if (fallback) next[fallback] = true;
  }
  next.compareMonth = value.compareMonth && REPORT_SECTIONS.some(key => next[key] && previous[key]);
  next.compareBudget = value.compareBudget && next.includeExpenses && budget;
  return next;
}
