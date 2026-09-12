import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { useAppSelector } from "@/hooks/Redux";
import { selectTransactions, selectCategoryBudgets, selectOverallBudget,
  selectCategoryColors, selectCategoryIcons } from "@/modules/Core/Slices/TransactionSlice";
import { calculateInsights, monthKey } from "../calculations";

export function useInsights(workspaceCurrency: string) {
  const transactions = useAppSelector(selectTransactions);
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const overallBudget = useAppSelector(selectOverallBudget);
  const icons = useAppSelector(selectCategoryIcons);
  const colors = useAppSelector(selectCategoryColors);
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [currency, setCurrency] = useState(workspaceCurrency);
  const [matchedDays, setMatchedDays] = useState(true);
  const currencies = useMemo(() => [...new Set([workspaceCurrency,
    ...transactions.filter(row => !row.deleted).map(row => row.currencyCode || workspaceCurrency)])].sort(),
  [transactions, workspaceCurrency]);
  const [today, setToday] = useState(() => new Date().toDateString());
  useEffect(() => {
    const refresh = () => setToday(new Date().toDateString());
    const timer = setInterval(refresh, 60000);
    const listener = AppState.addEventListener("change", state => { if (state === "active") refresh(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);
  const data = useMemo(() => calculateInsights(transactions, month, currency, workspaceCurrency, matchedDays, new Date(today)),
    [transactions, month, currency, workspaceCurrency, matchedDays, today]);
  const canCompareBudget = month === monthKey(new Date()) && currency === workspaceCurrency;
  return { data, transactions, categoryBudgets, overallBudget, icons, colors,
    month, setMonth, currency, setCurrency, currencies, matchedDays, setMatchedDays, canCompareBudget };
}
