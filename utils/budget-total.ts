/** Overall budget is derived from valid limits on active expense categories. */
export function categoryBudgetTotal(
  budgets: Record<string, number>,
  categories = Object.keys(budgets),
) {
  return categories.reduce((total, category) => {
    const amount = budgets[category];
    return total + (Number.isFinite(amount) && amount > 0 ? amount : 0);
  }, 0);
}
