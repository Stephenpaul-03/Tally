// ============================================================
// TALLY - Query Engine v2
// Fully offline. No AI. Just your data.
// ============================================================

import { getCategoryIconName } from "@/utils/Helpers";

// ============================================================
// TYPES
// ============================================================

export type QueryStep =
  | "greeting"
  | "select_path"
  | "select_title"
  | "select_category"
  | "select_month"
  | "select_compare_month"
  | "result"
  | "result_breakdown"
  | "result_comparison";

export type Path = "title" | "category";

export interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text: string;
  options?: Option[];
  optionStyle?:
    | "tile"
    | "chip"
    | "list"
    | "search_list"
    | "category_grid"
    | "actions";
  resultCard?: ResultCard;
}

export interface Option {
  label: string;
  value: string;
  sublabel?: string;
  icon?: string;
  color?: string;
}

// ── Result card types ────────────────────────────────────────

export type ResultCardKind = "summary" | "breakdown" | "comparison";

export interface ResultCard {
  kind: ResultCardKind;
  // summary / breakdown fields
  amount?: string;
  label?: string;
  sublabel?: string;
  transactions?: ResultTransaction[];
  // comparison fields
  comparison?: ComparisonData;
}

export interface ComparisonData {
  thisLabel: string;
  thisAmount: string;
  prevLabel: string;
  prevAmount: string;
  deltaAmount: string;
  deltaPercent: string;
  direction: "up" | "down" | "same";
  subContext: string; // e.g. "3 vs 5 transactions"
}

export interface ResultTransaction {
  title: string;
  amount: string;
  date: string;
  account: string;
}

export interface QueryState {
  step: QueryStep;
  path?: Path;
  title?: string;
  category_id?: number;
  category_name?: string;
  monthStr?: string;
  year?: string;
  lastResult?: { total: number; count: number; transactions?: any[] };
  // for month summary path
  lastMonthResult?: {
    expense: number;
    income: number;
    expenseCount: number;
    incomeCount: number;
  };
}

// ============================================================
// MONTH HELPERS
// ============================================================

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function parseMonthValue(value: string): {
  year: string;
  monthStr: string;
} {
  const [year, monthStr] = value.split("-");
  return { year, monthStr };
}

export function friendlyMonth(year: string, monthStr: string): string {
  return `${MONTH_NAMES[parseInt(monthStr)]} ${year}`;
}

export function prevMonthOf(
  year: string,
  monthStr: string,
): { year: string; monthStr: string } {
  const m = parseInt(monthStr);
  const y = parseInt(year);
  if (m === 1) return { year: String(y - 1), monthStr: "12" };
  return { year, monthStr: String(m - 1).padStart(2, "0") };
}

// ============================================================
// PATH OPTIONS
// ============================================================

export const PATH_OPTIONS: Option[] = [
  {
    label: "A title",
    value: "title",
    sublabel: "e.g. Swiggy, maid",
    icon: "magnify",
  },
  {
    label: "A category",
    value: "category",
    sublabel: "e.g. groceries, bills",
    icon: "shape-outline",
  },
];

// ============================================================
// QUERY FUNCTIONS
// ============================================================

/**
 * All unique titles sorted by most recently used.
 * Loads everything in one shot — filtering is done client-side.
 */
export async function getTitleOptions(db: any): Promise<Option[]> {
  const rows = await db.getAllAsync(
    `SELECT title,
            COUNT(*) as payment_count,
            MAX(date) as last_paid
     FROM transactions
     WHERE is_deleted = 0 AND type = 'expense'
     GROUP BY title
     ORDER BY payment_count DESC, last_paid DESC`,
  );

  return rows.map((row: any) => ({
    label: row.title,
    value: row.title,
    sublabel: `${row.payment_count} transaction${row.payment_count > 1 ? "s" : ""}`,
  }));
}

/**
 * Expense categories sorted by usage.
 */
export async function getCategoryOptions(db: any): Promise<Option[]> {
  const rows = await db.getAllAsync(
    `SELECT c.id, c.name, c.icon, c.color, COUNT(t.id) as use_count
     FROM categories c
     LEFT JOIN transactions t
       ON t.category_id = c.id AND t.is_deleted = 0 AND t.type = 'expense'
     WHERE c.type = 'expense' AND c.is_deleted = 0
     GROUP BY c.id
     ORDER BY use_count DESC, c.name ASC`,
  );
  return rows.map((row: any) => ({
    label: row.name,
    value: String(row.id),
    sublabel: row.use_count > 0 ? `${row.use_count} transactions` : undefined,
    icon: row.icon || getCategoryIconName(row.name, "expense"),
    color: row.color || undefined,
  }));
}

export async function getAvailableMonthOptions(
  db: any,
  filters?: {
    title?: string;
    categoryId?: number;
    excludeValue?: string;
  },
): Promise<Option[]> {
  const conditions = ["is_deleted = 0", "type = 'expense'"];
  const params: (string | number)[] = [];

  if (filters?.title) {
    conditions.push("title = ?");
    params.push(filters.title);
  }

  if (filters?.categoryId != null) {
    conditions.push("category_id = ?");
    params.push(filters.categoryId);
  }

  const rows = await db.getAllAsync(
    `SELECT
        strftime('%Y', date) as year,
        strftime('%m', date) as monthStr,
        COUNT(*) as txn_count
     FROM transactions
     WHERE ${conditions.join(" AND ")}
     GROUP BY year, monthStr
     ORDER BY year DESC, monthStr DESC`,
    params,
  );

  return rows
    .map((row: any) => {
      const value = `${row.year}-${row.monthStr}`;
      return {
        label: friendlyMonth(row.year, row.monthStr),
        value,
        sublabel:
          row.txn_count > 0
            ? `${row.txn_count} transaction${row.txn_count > 1 ? "s" : ""}`
            : undefined,
      };
    })
    .filter((option: Option) => option.value !== filters?.excludeValue);
}

/**
 * Monthly totals (expense + income).
 */
export async function queryMonthlySummary(
  db: any,
  monthStr: string,
  year: string,
): Promise<{
  expense: number;
  income: number;
  expenseCount: number;
  incomeCount: number;
}> {
  const rows = await db.getAllAsync(
    `SELECT type, SUM(amount) as total, COUNT(*) as cnt
     FROM transactions
     WHERE is_deleted = 0
       AND strftime('%m', date) = ?
       AND strftime('%Y', date) = ?
     GROUP BY type`,
    [monthStr, year],
  );

  let expense = 0,
    income = 0,
    expenseCount = 0,
    incomeCount = 0;
  for (const row of rows as any[]) {
    if (row.type === "expense") {
      expense = row.total;
      expenseCount = row.cnt;
    }
    if (row.type === "income") {
      income = row.total;
      incomeCount = row.cnt;
    }
  }
  return { expense, income, expenseCount, incomeCount };
}

/**
 * Payments matching a title in a month.
 */
export async function queryPaymentsTo(
  db: any,
  title: string,
  monthStr: string,
  year: string,
): Promise<{ total: number; count: number; transactions: any[] }> {
  const rows = await db.getAllAsync(
    `SELECT title, amount, date, account
     FROM transactions
     WHERE is_deleted = 0
       AND type = 'expense'
       AND title LIKE ?
       AND strftime('%m', date) = ?
       AND strftime('%Y', date) = ?
     ORDER BY date DESC`,
    [`%${title}%`, monthStr, year],
  );
  const total = rows.reduce((s: number, r: any) => s + r.amount, 0);
  return { total, count: rows.length, transactions: rows };
}

/**
 * Spend by category in a month.
 */
export async function queryCategorySpend(
  db: any,
  categoryId: number,
  monthStr: string,
  year: string,
): Promise<{ total: number; count: number; transactions: any[] }> {
  const rows = await db.getAllAsync(
    `SELECT t.title, t.amount, t.date, t.account
     FROM transactions t
     WHERE t.is_deleted = 0
       AND t.type = 'expense'
       AND t.category_id = ?
       AND strftime('%m', t.date) = ?
       AND strftime('%Y', t.date) = ?
     ORDER BY t.date DESC`,
    [categoryId, monthStr, year],
  );
  const total = rows.reduce((s: number, r: any) => s + r.amount, 0);
  return { total, count: rows.length, transactions: rows };
}

// ============================================================
// FORMATTERS
// ============================================================

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatTransactionDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ============================================================
// RESULT CARD BUILDERS
// ============================================================

export function buildResultCard(
  intent: "title" | "category" | "month",
  state: QueryState,
  result: any,
): ResultCard {
  const period = friendlyMonth(state.year!, state.monthStr!);

  if (intent === "month") {
    const net = result.income - result.expense;
    return {
      kind: "summary",
      amount: formatINR(result.expense),
      label: `Spent in ${period}`,
      sublabel: `Earned ${formatINR(result.income)} · Net ${net >= 0 ? "+" : ""}${formatINR(net)}`,
    };
  }

  if (intent === "title") {
    return {
      kind: "summary",
      amount: formatINR(result.total),
      label: `Paid to ${state.title} in ${period}`,
      sublabel:
        result.count === 0
          ? "No payments found"
          : `Across ${result.count} transaction${result.count > 1 ? "s" : ""}`,
    };
  }

  return {
    kind: "summary",
    amount: formatINR(result.total),
    label: `${state.category_name} in ${period}`,
    sublabel:
      result.count === 0
        ? "No transactions found"
        : `Across ${result.count} transaction${result.count > 1 ? "s" : ""}`,
  };
}

/**
 * Build a comparison card between two periods for the same query.
 */
export function buildComparisonCard(
  intent: "title" | "category" | "month",
  state: QueryState,
  thisResult: any,
  prevResult: any,
  prevYear: string,
  prevMonthStr: string,
): ResultCard {
  const thisLabel = friendlyMonth(state.year!, state.monthStr!);
  const prevLabel = friendlyMonth(prevYear, prevMonthStr);

  const thisAmt = intent === "month" ? thisResult.expense : thisResult.total;
  const prevAmt = intent === "month" ? prevResult.expense : prevResult.total;

  const delta = thisAmt - prevAmt;
  const deltaPercent =
    prevAmt === 0 ? "—" : `${Math.abs(Math.round((delta / prevAmt) * 100))}%`;

  const direction: ComparisonData["direction"] =
    delta > 0 ? "up" : delta < 0 ? "down" : "same";

  const thisCount =
    intent === "month" ? thisResult.expenseCount : thisResult.count;
  const prevCount =
    intent === "month" ? prevResult.expenseCount : prevResult.count;

  const subContext =
    thisCount !== undefined
      ? `${thisCount} vs ${prevCount} transaction${prevCount !== 1 ? "s" : ""}`
      : "";

  return {
    kind: "comparison",
    comparison: {
      thisLabel,
      thisAmount: formatINR(thisAmt),
      prevLabel,
      prevAmount: formatINR(prevAmt),
      deltaAmount: formatINR(Math.abs(delta)),
      deltaPercent,
      direction,
      subContext,
    },
  };
}

// ============================================================
// CONTEXTUAL FOLLOW-UP BUILDER
// ============================================================

/**
 * Builds the follow-up option list after a result or comparison,
 * based on what path was taken and what data came back.
 */
export function buildFollowUps(
  step: QueryStep,
  result: any,
  path?: Path,
): Option[] {
  const options: Option[] = [];

  if (step === "result" || step === "result_comparison") {
    const txns = result?.transactions ?? [];
    if (txns.length > 0) {
      options.push({ label: "View all", value: "__view_all__" });
    }
  }

  if (step === "result" || step === "result_breakdown") {
    options.push({
      label: "Compare to another month",
      value: "__compare__",
    });
  }

  if (step === "result" || step === "result_comparison") {
    options.push({
      label: "Check a different month",
      value: "__pick_month__",
    });
  }

  // Always available
  options.push({ label: "Ask something else", value: "__reset__" });

  return options;
}

// ============================================================
// GREETING VARIANTS
// ============================================================

export function getGreeting(name: string = "there"): string {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const variants = [
    `${time}, ${name}! What are you looking for?`,
    `Hey ${name}! What would you like to check?`,
    `${time}, ${name}. What can I look up for you?`,
    `Hi ${name}! What do you need to know?`,
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}
