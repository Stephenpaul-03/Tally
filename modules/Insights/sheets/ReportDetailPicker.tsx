import React from "react";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
import type { ReportSectionKey } from "../reportSelection";
import type { ExpandableReportGroup } from "./ShareInsightsSheet";

/** The same catalog pickers as Add Transaction, scoped to this report's entries. */
export function ReportDetailPicker({ section: requestedSection, visible, groups, selected, onToggle, onClose }: {
  section: ReportSectionKey | null; visible: boolean; groups: ExpandableReportGroup[]; selected: string[];
  onToggle: (key: string) => void; onClose: () => void;
}) {
  const retainedSection = React.useRef<ReportSectionKey>(requestedSection ?? "includeExpenses");
  if (requestedSection) retainedSection.current = requestedSection;
  const section = retainedSection.current;
  const type = section === "includeIncome" ? "income" : "expense";
  const categories = useCategoryManagement(type);
  const accounts = useAccountManagement();
  React.useEffect(() => {
    if (categories.selectedType !== type) categories.handleSelectType(type);
  }, [categories, type]);
  const rows = groups.filter(group => group.section === section);
  const names = new Set(rows.map(group => group.label));
  const selectedNames = rows.filter(group => selected.includes(group.key)).map(group => group.label);
  const toggle = (name: string) => {
    const row = rows.find(group => group.label === name);
    if (row) onToggle(row.key);
  };
  if (section === "includeAccounts") return <AccountManagementModal
    isOpen={visible && requestedSection !== null} onClose={onClose} onSelectAccount={toggle} selectedAccounts={selectedNames}
    management={{ ...accounts, activeAccounts: accounts.activeAccounts.filter(name => names.has(name)),
      counts: { ...accounts.counts, accounts: rows.length } }} />;
  const incomeCategories = categories.incomeCategories.filter(name => section === "includeIncome" && names.has(name));
  const expenseCategories = categories.expenseCategories.filter(name => section === "includeExpenses" && names.has(name));
  return <CategoryManagementModal isOpen={visible && requestedSection !== null} onClose={onClose} pickerMode
    selectedValues={selectedNames} onSelectCategory={toggle}
    management={{ ...categories, incomeCategories, expenseCategories,
      counts: { ...categories.counts, income: incomeCategories.length, expense: expenseCategories.length } }} />;
}
