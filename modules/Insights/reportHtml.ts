import type { Transaction } from "@/utils/Types";
import { reportDetailKey } from "./reportSelection";
import type {
  MonthSummary,
  CategoryComparisonRow,
  BreakdownItem,
} from "./Types";
export type ReportOptions = {
  mode: "none" | "lastMonth" | "budget" | "both";
  includeIncome?: boolean;
  includeExpenses?: boolean;
  includeAccounts?: boolean;
  expanded?: string[];
  transactions?: Transaction[];
  accounts?: { name: string; income: number; expense: number; previousIncome: number; previousExpense: number }[];
  currencyCode: string;
  currrencySymbol: string;
  currentMonthLabel: string;
  previousMonthLabel: string;
  overallBudget?: number;
  categoryBudgets?: Record<string, number>;
  workspaceName?: string;
  layout?: "classic" | "sage";
  accent?: string;
  container?: string;
  onContainer?: string;
  periodDescription?: string;
  bodyFont?: string;
  boldFont?: string;
  headingFont?: string;
  generatedAt?: string;
};
export const escapeReportText = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ]!,
  );
const safeColor = (value: string | undefined, fallback: string) =>
  value && /^#[\da-f]{6}$/i.test(value) ? value : fallback;
export function buildInsightsHTML(
  summary: MonthSummary,
  month: string,
  options: ReportOptions,
  expenses: CategoryComparisonRow[] = [],
  income: CategoryComparisonRow[] = [],
  logo?: string,
) {
  const expressive = options.layout === "sage";
  const accent = safeColor(options.accent, "#006B5B"),
    container = safeColor(options.container, "#A2F2DC"),
    onContainer = safeColor(options.onContainer, "#00201A");
  const esc = escapeReportText;
  const money = (n: number) =>
    esc(
      `${options.currrencySymbol}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
    );
  const includeIncome = options.includeIncome !== false;
  const includeExpenses = options.includeExpenses !== false;
  const includeAccounts = options.includeAccounts === true;
  if (!includeIncome && !includeExpenses && !includeAccounts) throw Error("Select at least one report section");
  const compare = options.mode === "lastMonth" || options.mode === "both";
  const budget = includeExpenses && (options.mode === "budget" || options.mode === "both");
  const totalBudget =
    Object.values(options.categoryBudgets || {})
      .filter(Number.isFinite)
      .reduce((a, b) => a + Math.max(0, b), 0) ||
    options.overallBudget ||
    0;
  const fontFace = (name: string, value?: string, weight = 400) =>
    value && /^data:font\/(ttf|opentype);base64,[A-Za-z0-9+/=]+$/.test(value)
      ? `@font-face{font-family:${name};src:url('${value}');font-weight:${weight};}`
      : "";
  const donut = (items: BreakdownItem[], label: string, total: number) => {
    let offset = 0;
    const segments = items
      .filter((i) => i.amount > 0)
      .map((item) => {
        const share = total > 0 ? (item.amount / total) * 100 : 0;
        const circle = `<circle cx="70" cy="70" r="54" pathLength="100" fill="none" stroke="${safeColor(item.color, accent)}" stroke-width="14" stroke-dasharray="${share} ${100 - share}" stroke-dashoffset="${-offset}" transform="rotate(-90 70 70)"/>`;
        offset += share;
        return circle;
      })
      .join("");
    return `<div class="chart"><svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="${esc(label)}"><circle cx="70" cy="70" r="54" fill="none" stroke="#E5E8E6" stroke-width="14"/>${segments}<text x="70" y="69" text-anchor="middle" fill="#161D1A" style="font:700 13px ReportBody,Arial">${money(total)}</text><text x="70" y="85" text-anchor="middle" fill="#5C6561" style="font:10px ReportBody,Arial">${esc(label)}</text></svg></div>`;
  };
  const section = (
    title: string,
    items: BreakdownItem[],
    comparison: CategoryComparisonRow[],
    isIncome: boolean,
  ) => {
    const values = items.filter((item) => item.amount > 0);
    const total = values.reduce((a, b) => a + b.amount, 0);
    const previous = new Map(
      comparison.map((item) => [item.category, item.previousAmount]),
    );
    const previousTotal = comparison.reduce((a, b) => a + b.previousAmount, 0);
    const all = [...values];
    if (compare)
      comparison.forEach((item) => {
        if (
          item.previousAmount > 0 &&
          !all.some((v) => v.category === item.category)
        )
          all.push({ category: item.category, amount: 0, color: accent });
      });
    const hasBudget = budget && !isIncome;
    const rows = all
      .map(
        (item) =>
          `<tr><td><span class="dot" style="background:${safeColor(item.color, accent)}"></span>${esc(item.category)}</td><td class="num strong">${money(item.amount)}</td><td class="num muted">${total ? ((item.amount / total) * 100).toFixed(1) : "0"}%</td>${compare ? `<td class="num muted">${money(previous.get(item.category) || 0)}</td>` : ""}${hasBudget ? `<td class="num muted">${(options.categoryBudgets?.[item.category] || 0) > 0 ? money(options.categoryBudgets![item.category]) : "-"}</td>` : ""}</tr>`,
      )
      .join("");
    return `<section class="section ${isIncome ? "income-section" : "expense-section"}"><div class="section-head"><span class="eyebrow">${isIncome ? "02 / MONEY IN" : "01 / MONEY OUT"}</span><h2>${title}</h2></div><div class="breakdown">${expressive ? "" : donut(values, isIncome ? "Total income" : "Total spent", total)}<div class="table-wrap">${all.length ? `<table><thead><tr><th>Category</th><th class="num">${esc(options.currentMonthLabel)}</th><th class="num">Share</th>${compare ? `<th class="num">${esc(options.previousMonthLabel)}</th>` : ""}${hasBudget ? '<th class="num">Budget</th>' : ""}</tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Total</td><td class="num">${money(total)}</td><td class="num">${total ? "100%" : "-"}</td>${compare ? `<td class="num">${money(previousTotal)}</td>` : ""}${hasBudget ? `<td class="num">${totalBudget ? money(totalBudget) : "-"}</td>` : ""}</tr></tfoot></table>` : `<p class="empty">No ${isIncome ? "income" : "spending"} recorded in this period.</p>`}</div></div></section>`;
  };
  const accounts = options.accounts ?? [];
  const accountSection = includeAccounts ? `<section class="section accounts-section"><div class="section-head"><h2>Accounts</h2><p class="period">Income and spending by account</p></div><table><thead><tr><th>Account</th><th class="num">Income</th><th class="num">Spent</th>${compare ? `<th class="num">Income · ${esc(options.previousMonthLabel)}</th><th class="num">Spent · ${esc(options.previousMonthLabel)}</th>` : ""}</tr></thead><tbody>${accounts.map(account => `<tr><td>${esc(account.name || "Unspecified account")}</td><td class="num">${money(account.income)}</td><td class="num">${money(account.expense)}</td>${compare ? `<td class="num">${money(account.previousIncome)}</td><td class="num">${money(account.previousExpense)}</td>` : ""}</tr>`).join("")}</tbody></table>${accounts.length ? "" : '<p class="empty">No account entries recorded.</p>'}</section>` : "";
  const expanded = new Set(options.expanded ?? []);
  const detailGroups: { type: "income" | "expense" | "account"; name: string }[] = [
    ...(includeExpenses ? summary.fullExpenseBreakdown.map(item => ({ type: "expense" as const, name: item.category })) : []),
    ...(includeIncome ? summary.fullIncomeBreakdown.map(item => ({ type: "income" as const, name: item.category })) : []),
    ...(includeAccounts ? accounts.map(account => ({ type: "account" as const, name: account.name })) : []),
  ];
  const expandedSections = (type: "expense" | "income" | "account") => detailGroups.filter(group => group.type === type && expanded.has(reportDetailKey(group.type, group.name))).map(group => {
    const rows = (options.transactions ?? []).filter(row => group.type === "account" ? row.account === group.name : row.type === group.type && row.category === group.name)
      .slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    return `<section class="section expanded"><div class="section-head"><span class="eyebrow">${esc(group.type === "account" ? "ACCOUNT" : group.type.toUpperCase())} DETAILS</span><h2>${esc(group.name || "Unspecified account")}</h2><p class="period">${rows.length} entries</p></div><table><thead><tr><th>Date</th><th>Transaction</th><th>${group.type === "account" ? "Category" : "Account"}</th><th class="num">Amount</th></tr></thead><tbody>${rows.map(row => `<tr><td>${esc(row.date)}</td><td><strong>${esc(row.title || row.category)}</strong>${row.notes ? `<div class="muted">${esc(row.notes)}</div>` : ""}</td><td>${esc(group.type === "account" ? row.category : row.account)}</td><td class="num">${row.type === "income" ? "+" : "−"}${money(row.amount)}</td></tr>`).join("")}</tbody></table></section>`;
  }).join("");
  const logoHtml =
    logo && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(logo)
      ? `<img class="logo" src="${logo}" alt=""/>`
      : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    ${fontFace("ReportBody", options.bodyFont)}${fontFace("ReportBody", options.boldFont, 700)}${fontFace("ReportHeading", options.headingFont)}
    @page{size:A4;margin:32px 30px 36px}*{box-sizing:border-box}body{margin:0;color:#161D1A;background:#FFF;font:12px/1.5 ReportBody,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-variant-numeric:tabular-nums}h1,h2,p{margin:0}.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid #DDE3DF}.wordmark{font-size:24px;font-weight:700;color:${accent}}.workspace{color:#5C6561;font-size:11px}.logo{height:38px;width:38px;object-fit:contain}.intro{margin:22px 0 18px}.eyebrow{font-size:9px;font-weight:700;letter-spacing:1.4px;color:${accent}}h1{font:normal 40px/1.1 ReportHeading,ReportBody,Arial;margin:6px 0 8px;letter-spacing:-1px}h2{font:normal 25px/1.15 ReportHeading,ReportBody,Arial;margin-top:5px}.period{font-size:11px;color:#5C6561}.hero{display:flex;gap:10px;margin:18px 0 22px}.metric{flex:1;padding:16px;border:1px solid #E3E7E4;border-radius:16px;background:#F5F7F5}.metric.balance{background:${container};color:${onContainer};border-color:${container}}.label{font-size:10px;font-weight:700;letter-spacing:.5px}.value{font-size:24px;font-weight:700;line-height:1.3;margin-top:4px;white-space:nowrap}.metric.income .label{color:#16733C}.metric.expense .label{color:#AF2828}.budget{padding:14px 16px;border-radius:16px;background:#F4F6F4;margin-bottom:22px;break-inside:avoid}.budget-top{display:flex;justify-content:space-between;font-weight:700}.track{height:7px;background:#E0E6E2;border-radius:4px;margin:10px 0;overflow:hidden}.fill{height:100%;background:${summary.expenseTotal > totalBudget ? "#BA1A1A" : accent}}.section{margin-top:24px;border:1px solid #E0E5E1;border-radius:18px;padding:16px}.section-head{break-inside:avoid;break-after:avoid;margin-bottom:14px}.accounts-section{break-inside:avoid}.breakdown{display:flex;align-items:flex-start;gap:16px}.chart{width:140px;flex:0 0 140px;break-inside:avoid}.income-section .breakdown{flex-direction:row-reverse}.table-wrap{flex:1;min-width:0}table{width:100%;border-collapse:collapse;table-layout:auto}thead{display:table-header-group}th{font-size:8px;font-weight:700;color:#5C6561;padding:8px 4px;text-align:left;border-bottom:1px solid #CAD4CD}td{font-size:10px;padding:9px 4px;border-bottom:1px solid #EDF0EE;overflow-wrap:anywhere}tr{break-inside:avoid}tfoot td{font-weight:700;background:#F1F5F2;border-bottom:0}.num{text-align:right;white-space:nowrap}.strong{font-weight:700}.muted{color:#5C6561}.dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}.empty{padding:18px 0;color:#5C6561}.footer{margin-top:24px;border-top:1px solid #DDE3DF;padding-top:10px;color:#5C6561;font-size:9px;display:flex;justify-content:space-between}
    ${expressive ? `h1{font:700 38px/1.1 ReportBody,Arial;letter-spacing:-1.4px}h2{font:700 23px/1.2 ReportBody,Arial}.intro{margin-top:22px}.hero{background:${container};border-radius:30px 30px 30px 10px;padding:10px}.metric{border:0;border-radius:20px;background:#FFFFFFC9;padding:14px}.metric.balance{background:transparent}.section{background:#F3F7F3;border:0;border-radius:28px 28px 12px 28px;padding:20px}.income-section{border-radius:28px 12px 28px 28px}.budget{border-radius:24px}.wordmark{letter-spacing:-1px}` : `.wordmark{text-transform:uppercase;font-family:ReportHeading,ReportBody,Arial;font-size:30px}.metric{border-radius:14px}.section{border-radius:18px}`}
  </style></head><body>
    <header class="header"><div><div class="wordmark">tally</div><div class="workspace">${esc(options.workspaceName || "Personal")}</div></div><div class="workspace">${esc(options.currencyCode)} · ${expressive ? "Simple" : "Detailed"} report</div>${logoHtml}</header>
    <div class="intro"><div class="eyebrow">YOUR MONEY, AT A GLANCE</div><h1>${esc(month)} Insights</h1><p class="period">${esc((compare ? options.periodDescription || `Compared with ${options.previousMonthLabel}` : budget ? "Spending against your category limits" : "Recorded activity for this month"))}</p></div>
    ${includeIncome || includeExpenses ? `<div class="hero">${includeIncome && includeExpenses ? `<div class="metric balance"><div class="label">Balance</div><div class="value">${money(summary.balanceInHand)}</div></div>` : ""}${includeIncome ? `<div class="metric income"><div class="label">Income</div><div class="value">${money(summary.incomeTotal)}</div></div>` : ""}${includeExpenses ? `<div class="metric expense"><div class="label">Spent</div><div class="value">${money(summary.expenseTotal)}</div></div>` : ""}</div>` : ""}
    ${budget ? `<div class="budget"><div class="budget-top"><span>Budget</span><span>${totalBudget ? money(totalBudget) : "Not set"}</span></div>${totalBudget ? `<div class="track"><div class="fill" style="width:${Math.min(100, (summary.expenseTotal / totalBudget) * 100)}%"></div></div><div class="period">${money(Math.abs(totalBudget - summary.expenseTotal))} ${summary.expenseTotal > totalBudget ? "over budget" : "remaining"} · sum of category limits</div>` : '<p class="period">No category limits configured for this period.</p>'}</div>` : ""}
    ${includeExpenses ? section("Spending", summary.fullExpenseBreakdown, expenses, false) + expandedSections("expense") : ""}${includeIncome ? section("Income", summary.fullIncomeBreakdown, income, true) + expandedSections("income") : ""}${accountSection}${expandedSections("account")}
    <footer class="footer"><span>Recorded cash flow · balance = income minus spending</span><span>Generated ${esc(options.generatedAt || new Date().toLocaleDateString("en-IN"))}</span></footer>
  </body></html>`;
}
