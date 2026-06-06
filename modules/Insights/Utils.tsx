import {
    selectExpenseTransactions,
    selectIncomeTransactions,
} from "@/modules/Common/Slices/TransactionSlice";
import {
    formatAccountLabel,
    getCategoryColor,
    getCategoryIconName,
} from "@/modules/Common/Utils/Helpers";
import type { BreakdownItem, HeatmapCell, MonthSummary } from "./Types";

export const PAYMENT_METHOD_META = {
  upi: { label: "UPI", icon: "bank-transfer" },
  cash: { label: "Cash", icon: "cash" },
  card: { label: "Card", icon: "credit-card-outline" },
} as const;

export function getPaymentMethodMeta(method: string) {
  const normalized = method.trim().toLowerCase();
  const known =
    PAYMENT_METHOD_META[normalized as keyof typeof PAYMENT_METHOD_META];
  if (known) return known;
  return {
    label: formatAccountLabel(method),
    icon: "wallet-outline",
  };
}

export const OTHERS_COLOR = "#8D93A6";

function normalizeHex(color: string) {
  if (!color.startsWith("#")) return null;

  const sanitized = color.length === 9 ? color.slice(0, 7) : color;
  if (sanitized.length !== 7) return null;
  return sanitized;
}

function hexToRgb(color: string) {
  const normalized = normalizeHex(color);
  if (!normalized) return null;

  return {
    b: Number.parseInt(normalized.slice(5, 7), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    r: Number.parseInt(normalized.slice(1, 3), 16),
  };
}

function rgbToHex({ b, g, r }: { b: number; g: number; r: number }) {
  const clamp = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");

  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

export function mixHexColors(base: string, mix: string, weight = 0.5) {
  const baseRgb = hexToRgb(base);
  const mixRgb = hexToRgb(mix);

  if (!baseRgb || !mixRgb) {
    return base;
  }

  return rgbToHex({
    b: baseRgb.b + (mixRgb.b - baseRgb.b) * weight,
    g: baseRgb.g + (mixRgb.g - baseRgb.g) * weight,
    r: baseRgb.r + (mixRgb.r - baseRgb.r) * weight,
  });
}

export function softenInsightColor(
  color: string,
  weight = 0.34,
  neutral = "#A6ADBC",
) {
  return mixHexColors(color, neutral, weight);
}

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

export function monthStart(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  return new Date(year, monthIndex, 1);
}

export function shiftMonth(monthKey: string, delta: number) {
  const start = monthStart(monthKey);
  start.setMonth(start.getMonth() + delta);
  return formatMonthKey(start);
}

export function formatMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(monthStart(monthKey));
}

export function formatShortMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(monthStart(monthKey));
}

export function formatShortDay(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatPercentChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) return null;
  const delta = ((current - previous) / previous) * 100;
  return Number(delta.toFixed(1));
}

export function formatTrendSummary(
  current: number,
  previous: number,
  monthKey: string,
) {
  if (previous <= 0 && current <= 0) {
    return "Not enough historical data available.";
  }

  if (previous <= 0) {
    return `Spending started in ${formatMonthLabel(monthKey)}.`;
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded =
    Math.abs(delta) >= 10
      ? Math.round(Math.abs(delta))
      : Number(Math.abs(delta).toFixed(1));

  return `Spending ${delta > 0 ? "increased" : "decreased"} ${rounded}% compared to last month.`;
}

export function formatChange(
  current: number,
  previous: number,
  monthKey: string,
) {
  if (previous <= 0 && current <= 0)
    return { direction: "flat" as const, text: "No expense in either month" };
  if (previous <= 0)
    return {
      direction: "up" as const,
      text: `Started spending in ${formatMonthLabel(monthKey)}`,
    };
  const delta = current - previous;
  if (delta === 0)
    return {
      direction: "flat" as const,
      text: `Same as ${formatMonthLabel(shiftMonth(monthKey, -1))}`,
    };
  const pct = Math.abs((delta / previous) * 100);
  const rounded = pct >= 10 ? Math.round(pct) : Number(pct.toFixed(1));
  return {
    direction: delta > 0 ? ("up" as const) : ("down" as const),
    text: `${rounded}% ${delta > 0 ? "more" : "less"} than ${formatMonthLabel(shiftMonth(monthKey, -1))}`,
    previousLabel: formatInr(previous),
  };
}

export function getSpendingLevel(amount: number, maxAmount: number) {
  if (amount <= 0) return "none";
  if (maxAmount <= 0) return "low";
  const ratio = amount / maxAmount;
  if (ratio >= 0.66) return "high";
  if (ratio >= 0.33) return "medium";
  return "low";
}

export function groupBreakdown(items: BreakdownItem[], total: number) {
  const topFive = items.slice(0, 5);
  const rest = items.slice(5);
  if (rest.length === 0) return items;
  const othersAmount = rest.reduce((sum, item) => sum + item.amount, 0);
  return [
    ...topFive,
    {
      category: "Others",
      amount: othersAmount,
      percentage: total > 0 ? (othersAmount / total) * 100 : 0,
      color: OTHERS_COLOR,
      icon: "dots-horizontal",
    },
  ];
}

export function getMonthSummary(
  monthKey: string,
  expenses: ReturnType<typeof selectExpenseTransactions>,
  incomes: ReturnType<typeof selectIncomeTransactions>,
  categoryIcons: Record<string, string>,
  categoryColors: Record<string, string>,
): MonthSummary {
  const thisMonthExpenses = expenses.filter((tx) =>
    tx.date.startsWith(monthKey),
  );
  const thisMonthIncomes = incomes.filter((tx) => tx.date.startsWith(monthKey));
  const previousMonthKey = shiftMonth(monthKey, -1);
  const previousMonthExpenses = expenses.filter((tx) =>
    tx.date.startsWith(previousMonthKey),
  );

  const expenseTotal = thisMonthExpenses.reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0,
  );
  const incomeTotal = thisMonthIncomes.reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0,
  );

  const expenseCategoryTotals = new Map<string, number>();
  const incomeCategoryTotals = new Map<string, number>();
  const paymentMethodTotals = new Map<string, number>();
  const dailyTotals = new Map<string, number>();

  thisMonthExpenses.forEach((tx) => {
    const amount = Math.abs(tx.amount);
    expenseCategoryTotals.set(
      tx.category,
      (expenseCategoryTotals.get(tx.category) ?? 0) + amount,
    );
    paymentMethodTotals.set(
      tx.account,
      (paymentMethodTotals.get(tx.account) ?? 0) + amount,
    );
    dailyTotals.set(tx.date, (dailyTotals.get(tx.date) ?? 0) + amount);
  });

  thisMonthIncomes.forEach((tx) => {
    const amount = Math.abs(tx.amount);
    incomeCategoryTotals.set(
      tx.category,
      (incomeCategoryTotals.get(tx.category) ?? 0) + amount,
    );
  });

  const fullExpenseBreakdown = Array.from(expenseCategoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
      color: getCategoryColor(category, "expense", categoryColors),
      icon: getCategoryIconName(category, "expense", categoryIcons),
    }));

  const fullIncomeBreakdown = Array.from(incomeCategoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: incomeTotal > 0 ? (amount / incomeTotal) * 100 : 0,
      color: getCategoryColor(category, "income", categoryColors),
      icon: getCategoryIconName(category, "income", categoryIcons),
    }));

  const paymentMethodBreakdown = Array.from(paymentMethodTotals.entries())
    .map(([method, amount]) => {
      const meta = getPaymentMethodMeta(method);
      return {
        method: meta.label,
        amount,
        percentage: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const daysInMonth = new Date(
    monthStart(monthKey).getFullYear(),
    monthStart(monthKey).getMonth() + 1,
    0,
  ).getDate();

  const trend = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    return { date, day, amount: dailyTotals.get(date) ?? 0 };
  });

  const firstDay = monthStart(monthKey);
  const firstWeekday = firstDay.getDay();
  const mondayOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const padded: HeatmapCell[] = [];
  for (let index = 0; index < mondayOffset; index += 1) {
    padded.push({ date: null, day: null, amount: 0 });
  }
  trend.forEach((entry) => {
    padded.push({ date: entry.date, day: entry.day, amount: entry.amount });
  });
  while (padded.length % 7 !== 0) {
    padded.push({ date: null, day: null, amount: 0 });
  }
  const weeks = Array.from({ length: padded.length / 7 }, (_, weekIndex) =>
    padded.slice(weekIndex * 7, weekIndex * 7 + 7),
  );

  let longestNoSpendStreak = 0;
  let currentNoSpendStreak = 0;
  trend.forEach((entry) => {
    if (entry.amount <= 0) {
      currentNoSpendStreak += 1;
      longestNoSpendStreak = Math.max(
        longestNoSpendStreak,
        currentNoSpendStreak,
      );
    } else {
      currentNoSpendStreak = 0;
    }
  });

  const topSpendingDay = trend.reduce<{ date: string | null; amount: number }>(
    (best, entry) => (entry.amount > best.amount ? entry : best),
    { date: null, amount: 0 },
  );

  return {
    monthKey,
    incomeTotal,
    expenseTotal,
    balanceInHand: incomeTotal - expenseTotal,
    previousMonthExpenseTotal: previousMonthExpenses.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0,
    ),
    fullExpenseBreakdown,
    groupedExpenseBreakdown: groupBreakdown(fullExpenseBreakdown, expenseTotal),
    fullIncomeBreakdown,
    groupedIncomeBreakdown: groupBreakdown(fullIncomeBreakdown, incomeTotal),
    paymentMethodBreakdown,
    heatmap: {
      dayLabel: formatMonthLabel(monthKey),
      topSpendingDayLabel: topSpendingDay.date
        ? formatShortDay(topSpendingDay.date)
        : null,
      longestNoSpendStreak,
      weeks,
    },
  };
}
