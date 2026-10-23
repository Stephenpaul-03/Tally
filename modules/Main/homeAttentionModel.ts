import { categoryBudgetTotal } from "@/utils/budget-total";
import type { Transaction, TransactionDraft } from "@/utils/Types";

export function sortedHomeDrafts(drafts: TransactionDraft[]) {
  return [...drafts].sort(
    (a, b) =>
      b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
  );
}
export function latestHomeDraft(drafts: TransactionDraft[]) {
  return sortedHomeDrafts(drafts)[0] ?? null;
}

export type BudgetRisk = "safe" | "watch" | "nearlyEmpty" | "empty" | "over";
const riskOrder: Record<BudgetRisk, number> = {
  safe: 0,
  watch: 1,
  nearlyEmpty: 2,
  empty: 3,
  over: 4,
};
export function budgetRisk(
  percent: number,
  safeBelowPercent: number,
  nearlyEmptyFromPercent: number,
): BudgetRisk {
  const safe = Math.max(0, Math.min(100, safeBelowPercent));
  const nearly = Math.max(safe, Math.min(100, nearlyEmptyFromPercent));
  if (percent > 100) return "over";
  if (percent >= 100) return "empty";
  if (percent >= nearly) return "nearlyEmpty";
  if (percent >= safe) return "watch";
  return "safe";
}

export type HomeBudgetOptions = {
  rows: Transaction[];
  month: string;
  today: string;
  currency: string;
  workspaceCurrency: string;
  expenseCategories?: string[];
  categoryBudgets: Record<string, number>;
  safeBelowPercent: number;
  nearlyEmptyFromPercent: number;
};

/** Limits belong to the workspace currency/current month; amounts include all posted spending. */
function homeBudgetCandidates({
  rows,
  month,
  today,
  currency,
  workspaceCurrency,
  expenseCategories,
  categoryBudgets,
  safeBelowPercent,
  nearlyEmptyFromPercent,
}: HomeBudgetOptions) {
  if (month !== today.slice(0, 7) || currency !== workspaceCurrency)
    return null;
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    if (
      row.deleted ||
      (row as Transaction & { isDraft?: boolean }).isDraft ||
      row.type !== "expense" ||
      !row.date?.startsWith(month) ||
      row.date > today ||
      (row.currencyCode || workspaceCurrency) !== currency ||
      !Number.isFinite(row.amount)
    )
      continue;
    const amount = Math.abs(row.amount);
    total += amount;
    byCategory[row.category] = (byCategory[row.category] || 0) + amount;
  }
  const categories = expenseCategories ?? Object.keys(categoryBudgets);
  const overallBudget = categoryBudgetTotal(categoryBudgets, categories);
  const candidates = [
    {
      key: "overall",
      category: null,
      label: "Monthly budget",
      budget: overallBudget,
      spent: total,
    },
    ...categories.map((label) => ({
      key: `category:${label}`,
      category: label,
      label,
      budget: categoryBudgets[label],
      spent: byCategory[label] || 0,
    })),
  ];
  return candidates
    .filter(({ budget }) => Number.isFinite(budget) && budget > 0)
    .map((item) => {
      const percent = (item.spent / item.budget) * 100;
      return {
        ...item,
        percent,
        remaining: item.budget - item.spent,
        risk: budgetRisk(percent, safeBelowPercent, nearlyEmptyFromPercent),
      };
    });
}

export type HomeBudgetNudge = NonNullable<
  ReturnType<typeof homeBudgetCandidates>
>[number];
function rankedHomeNudges(candidates: HomeBudgetNudge[]) {
  return candidates
    .filter((item) => item.spent > 0 && item.risk !== "safe")
    .sort(
      (a, b) =>
        riskOrder[b.risk] - riskOrder[a.risk] ||
        b.percent - a.percent ||
        a.remaining - b.remaining,
    );
}
export function homeBudgetNudges(options: HomeBudgetOptions) {
  return rankedHomeNudges(homeBudgetCandidates(options) ?? []);
}

export function homeBudgetPanel(options: HomeBudgetOptions) {
  const candidates = homeBudgetCandidates(options);
  if (!candidates) return null;
  const categories =
    options.expenseCategories ?? Object.keys(options.categoryBudgets);
  const unbudgetedCategories = categories.filter(
    (name) =>
      !Number.isFinite(options.categoryBudgets[name]) ||
      options.categoryBudgets[name] <= 0,
  );
  return {
    needsSetup: !candidates.some((item) => item.category !== null),
    overall: candidates.find((item) => item.category === null) ?? null,
    hasCategoryBudgets: candidates.some((item) => item.category !== null),
    unbudgetedCategories,
    nudges: candidates
      .filter((item) => item.category !== null)
      .sort(
        (a, b) =>
          riskOrder[b.risk] - riskOrder[a.risk] || b.percent - a.percent,
      ),
  };
}
export type HomeBudgetPanelData = NonNullable<
  ReturnType<typeof homeBudgetPanel>
>;
