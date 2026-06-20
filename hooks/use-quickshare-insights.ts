import type {
  BreakdownItem,
  CategoryComparisonRow,
  MonthSummary,
} from "@/modules/Insights/Types";
import { cacheDirectory, copyAsync } from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildRows(
  items: BreakdownItem[],
  comparisonMap: Record<string, CategoryComparisonRow>,
  showComparison: boolean,
): string {
  return items
    .map((item) => {
      const prev = comparisonMap[item.category];
      const prevCell = showComparison
        ? `<td style="text-align:right;color:#6b7280">${
            prev
              ? formatCurrency(prev.previousAmount)
              : "<span style='color:#9ca3af'>—</span>"
          }</td>`
        : "";

      return `
      <tr>
        <td>
          <span class="dot" style="background:${item.color}"></span>
          ${item.category}
        </td>
        <td style="text-align:right;font-weight:600">${formatCurrency(item.amount ?? 0)}</td>
        ${prevCell}
      </tr>`;
    })
    .join("");
}

function buildTotalsRow(
  items: BreakdownItem[],
  comparisonMap: Record<string, CategoryComparisonRow>,
  showComparison: boolean,
): string {
  const total = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const prevTotal = showComparison
    ? items.reduce((sum, item) => {
        const prev = comparisonMap[item.category];
        return sum + (prev ? prev.previousAmount : 0);
      }, 0)
    : 0;

  return `
    <tr class="totals-row">
      <td style="font-weight:700">Total</td>
      <td style="text-align:right;font-weight:700">${formatCurrency(total)}</td>
      ${
        showComparison
          ? `<td style="text-align:right;font-weight:700;color:#6b7280">${formatCurrency(prevTotal)}</td>`
          : ""
      }
    </tr>`;
}

function buildTable(
  items: BreakdownItem[],
  comparisonMap: Record<string, CategoryComparisonRow>,
  showComparison: boolean,
  emptyMessage: string,
): string {
  if (items.length === 0) {
    return `<div class="empty">${emptyMessage}</div>`;
  }
  return `
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th style="text-align:right">This Month</th>
          ${showComparison ? '<th style="text-align:right">Last Month</th>' : ""}
        </tr>
      </thead>
      <tbody>
        ${buildRows(items, comparisonMap, showComparison)}
        ${buildTotalsRow(items, comparisonMap, showComparison)}
      </tbody>
    </table>`;
}

function buildHTML(
  summary: MonthSummary,
  monthLabel: string,
  categoryComparison?: CategoryComparisonRow[],
  incomeCategoryComparison?: CategoryComparisonRow[],
  logoBase64?: string,
): string {
  const {
    incomeTotal,
    expenseTotal,
    balanceInHand,
    fullExpenseBreakdown,
    fullIncomeBreakdown,
  } = summary;

  const expenseCompMap: Record<string, CategoryComparisonRow> =
    categoryComparison
      ? Object.fromEntries(categoryComparison.map((r) => [r.category, r]))
      : {};

  const incomeCompMap: Record<string, CategoryComparisonRow> =
    incomeCategoryComparison
      ? Object.fromEntries(incomeCategoryComparison.map((r) => [r.category, r]))
      : {};

  const logoImg = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f8f9fa;
            color: #1a1a2e;
            padding: 40px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 32px;
          }
          .header-text h1 { font-size: 28px; font-weight: 700; color: #1a1a2e; }
          .header-text p { font-size: 14px; color: #6b7280; margin-top: 4px; }
          .header-logo {
            height: 64px;
            width: auto;
            object-fit: contain;
            flex-shrink: 0;
          }
          .cards {
            display: flex;
            gap: 16px;
            margin-bottom: 32px;
          }
          .card {
            flex: 1;
            background: #ffffff;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }
          .card .label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .card .value { font-size: 22px; font-weight: 700; }
          .card.income .value { color: #10b981; }
          .card.expense .value { color: #ef4444; }
          .card.balance .value { color: #6366f1; }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 12px;
            margin-top: 28px;
            color: #1a1a2e;
          }
          .section-title.first { margin-top: 0; }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }
          th {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            padding: 12px 16px;
            background: #f3f4f6;
            text-align: left;
          }
          td {
            padding: 12px 16px;
            font-size: 14px;
            border-top: 1px solid #f3f4f6;
          }
          .dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
          }
          tr.totals-row td {
            background: #f3f4f6;
            border-top: 2px solid #e5e7eb;
            font-size: 14px;
          }
          .empty {
            padding: 16px;
            font-size: 13px;
            color: #9ca3af;
            text-align: center;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }
          .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-text">
            <h1>${monthLabel} Insights</h1>
            <p>Generated by Tally</p>
          </div>
          ${logoImg}
        </div>

        <div class="cards">
          <div class="card income">
            <div class="label">Income</div>
            <div class="value">${formatCurrency(incomeTotal)}</div>
          </div>
          <div class="card expense">
            <div class="label">Expenses</div>
            <div class="value">${formatCurrency(expenseTotal)}</div>
          </div>
          <div class="card balance">
            <div class="label">Balance</div>
            <div class="value">${formatCurrency(balanceInHand)}</div>
          </div>
        </div>

        <div class="section-title first">Expense Breakdown</div>
        ${buildTable(
          fullExpenseBreakdown,
          expenseCompMap,
          !!categoryComparison,
          "No expenses recorded",
        )}

        <div class="section-title">Income Breakdown</div>
        ${buildTable(
          fullIncomeBreakdown,
          incomeCompMap,
          !!incomeCategoryComparison,
          "No income recorded",
        )}

        <div class="footer">
          Generated on ${new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </body>
    </html>
  `;
}

function buildFileName(workspaceName: string): string {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `Tally-${workspaceName.trim()}-${dateStr}.pdf`;
}

export function useQuickShareInsights(
  summary: MonthSummary | undefined,
  monthLabel: string | undefined,
  workspaceName: string | undefined,
  categoryComparison?: CategoryComparisonRow[],
  incomeCategoryComparison?: CategoryComparisonRow[],
  logoBase64?: string,
) {
  const [isGenerating, setIsGenerating] = useState(false);

  const shareInsights = useCallback(async () => {
    if (isGenerating || !summary || !monthLabel) return;
    try {
      setIsGenerating(true);

      const html = buildHTML(
        summary,
        monthLabel,
        categoryComparison,
        incomeCategoryComparison,
        logoBase64,
      );

      const fileName = buildFileName(workspaceName ?? "Tally");

      const { uri: tmpUri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const dest = `${cacheDirectory}${fileName}`;
      await copyAsync({ from: tmpUri, to: dest });

      const available = await Sharing.isAvailableAsync();
      if (!available) return;

      await Sharing.shareAsync(dest, {
        mimeType: "application/pdf",
        dialogTitle: `Share ${fileName}`,
        UTI: "com.adobe.pdf",
      });
    } catch (err) {
      console.error("PDF share failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [
    summary,
    monthLabel,
    workspaceName,
    categoryComparison,
    incomeCategoryComparison,
    logoBase64,
    isGenerating,
  ]);

  return { shareInsights, isGenerating };
}
