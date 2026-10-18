import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { useAppSelector } from "@/hooks/Redux";
import { selectTransactions, selectCategoryBudgets, selectOverallBudget,
  selectCategoryColors, selectCategoryIcons } from "@/modules/Core/Slices/TransactionSlice";
import { availableComparisonMonths, calculateInsights, monthKey } from "../calculations";

export function useInsights(workspaceCurrency: string, expanded = true) {
  const transactions = useAppSelector(selectTransactions);
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const overallBudget = useAppSelector(selectOverallBudget);
  const icons = useAppSelector(selectCategoryIcons);
  const colors = useAppSelector(selectCategoryColors);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedComparisonMonth, setComparisonMonth] = useState<string | null>(null);
  const [selectedCurrency, setCurrency] = useState(workspaceCurrency);
  const matchedDays = true;
  const currencies = useMemo(() => [...new Set([workspaceCurrency,
    ...transactions.filter(row => !row.deleted).map(row => row.currencyCode || workspaceCurrency)])].sort(),
  [transactions, workspaceCurrency]);
  const [today, setToday] = useState(() => new Date().toDateString());
  const currentMonth = monthKey(new Date(today));
  // Home always shows the current month. A historical selection is retained
  // for Insights, while an unselected current month follows date rollovers.
  const month = expanded && selectedMonth ? selectedMonth : currentMonth;
  const currency = currencies.includes(selectedCurrency) ? selectedCurrency : workspaceCurrency;
  const setMonth = (key: string) => setSelectedMonth(key === currentMonth ? null : key);
  useEffect(() => {
    const refresh = () => setToday(new Date().toDateString());
    const timer = setInterval(refresh, 60000);
    const listener = AppState.addEventListener("change", state => { if (state === "active") refresh(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);
  const comparisonMonths = useMemo(() => availableComparisonMonths(transactions, month, currency, workspaceCurrency, new Date(today)),
    [transactions, month, currency, workspaceCurrency, today]);
  const comparisonMonth = selectedComparisonMonth && comparisonMonths.includes(selectedComparisonMonth) ? selectedComparisonMonth : null;
  const data = useMemo(() => calculateInsights(transactions, month, currency, workspaceCurrency, matchedDays, new Date(today), comparisonMonth ?? undefined),
    [transactions, month, currency, workspaceCurrency, matchedDays, today, comparisonMonth]);
  const canCompareBudget = month === currentMonth && currency === workspaceCurrency;
  return { data, transactions, categoryBudgets, overallBudget, icons, colors,
    comparisonMonths, comparisonMonth, setComparisonMonth,
    month, setMonth, currency, setCurrency, currencies, matchedDays, currentMonth, canCompareBudget };
}
