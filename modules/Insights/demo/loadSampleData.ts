import { financeDb } from "@/modules/Core/Repository/SQLiteRepo";
import { buildSampleTransactions, demoAccounts, demoBudgets, demoCategories } from "./sampleData";

const DEMO_MARKER = "__tally_insights_demo_v1__";
let pending: Promise<string> | null = null;
export function loadSampleData(): Promise<string> {
  if (!__DEV__) return Promise.reject(new Error("Sample data is available in development builds only."));
  if (pending) return pending;
  pending = seed().finally(() => { pending = null; });
  return pending;
}
async function seed(): Promise<string> {
  let workspaceId = "";
  // Commit the workspace and all its data together. A failed import leaves no partial demo.
  await financeDb.withExclusiveTransactionAsync(async db => {
    const existing = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM workspaces WHERE owner_name = ? LIMIT 1", [DEMO_MARKER]);
    if (existing) { workspaceId = existing.id; return; }
    workspaceId = "insights-demo-" + Date.now();
    await db.runAsync(
      "INSERT INTO workspaces (id, name, icon, color, owner_name, currency_code, currency_symbol, currency_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [workspaceId, "Insights Demo", "chart-bar", "#527DB0", DEMO_MARKER, "INR", "₹", "Indian Rupee"]);
    const categoryIds = new Map<string, number>();
    for (const category of demoCategories) {
      const result = await db.runAsync(
        "INSERT INTO categories (workspace_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)",
        [workspaceId, category.name, category.type, category.icon, category.color]);
      categoryIds.set(category.name, result.lastInsertRowId);
    }
    for (const [index, name] of demoAccounts.entries()) {
      await db.runAsync("INSERT INTO accounts (workspace_id, name, icon, sort_order) VALUES (?, ?, ?, ?)",
        [workspaceId, name, ["bank-outline", "credit-card-outline", "cash"][index], index]);
    }
    await db.runAsync("INSERT INTO budgets (workspace_id, monthly_amount) VALUES (?, ?)", [workspaceId, 35000]);
    for (const budget of demoBudgets) {
      await db.runAsync("INSERT INTO category_budgets (workspace_id, category_id, amount) VALUES (?, ?, ?)",
        [workspaceId, categoryIds.get(budget.category)!, budget.amount]);
    }
    for (const [index, row] of buildSampleTransactions().entries()) {
      await db.runAsync(
        "INSERT INTO transactions (id, workspace_id, title, amount, date, category_id, type, account, currency_code, currency_symbol, currency_name, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [workspaceId + "-" + index, workspaceId, row.title, row.amount, row.date,
          categoryIds.get(row.category)!, row.type, row.account, "INR", "₹", "Indian Rupee",
          "Sample transaction", "Demo"]);
    }
  });
  return workspaceId;
}
