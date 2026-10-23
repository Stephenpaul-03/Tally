import type { Transaction, TransactionDraft } from "@/utils/Types";
type Row = Transaction | TransactionDraft;
export const EXPRESSIVE_TABS = [
  "calendar",
  "transactions",
  "insights",
] as const;
// Reuse expensive Intl formatters when a transaction list mounts.
const decimalFormatters = new Map<string, Intl.NumberFormat>();
const currencyFormatters = new Map<string, Intl.NumberFormat>();
export function ledgerMoney(
  amount: number,
  currencyCode: string,
  symbol?: string,
) {
  const locale = currencyCode === "INR" ? "en-IN" : undefined;
  const localeKey = locale ?? "default";
  let decimal = decimalFormatters.get(localeKey);
  if (!decimal) {
    decimal = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    decimalFormatters.set(localeKey, decimal);
  }
  const number = decimal.format(Math.abs(amount));
  if (symbol) return symbol + number;
  try {
    let formatter = currencyFormatters.get(currencyCode);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
      });
      if (currencyFormatters.size >= 32) currencyFormatters.clear();
      currencyFormatters.set(currencyCode, formatter);
    }
    return formatter.format(Math.abs(amount));
  } catch {
    return `${currencyCode} ${number}`;
  }
}
export function signedLedgerTotals(
  rows: Row[],
  currency: string,
  symbol: string,
) {
  const totals = new Map<string, { amount: number; symbol?: string }>();
  rows
    .filter((row) => !("isDraft" in row))
    .forEach((row) => {
      const code = row.currencyCode || currency;
      const value = totals.get(code) ?? {
        amount: 0,
        symbol: row.currencySymbol || (code === currency ? symbol : undefined),
      };
      value.amount += (row.type === "income" ? 1 : -1) * Math.abs(row.amount);
      totals.set(code, value);
    });
  return (
    [...totals]
      .map(
        ([code, value]) =>
          `${value.amount < 0 ? "−" : "+"}${ledgerMoney(value.amount, code, value.symbol)}`,
      )
      .join(" · ") || ledgerMoney(0, currency, symbol)
  );
}

/** Never net incoming and outgoing money together in a day heading. */
export function separateLedgerTotals(
  rows: Row[],
  currency: string,
  symbol: string,
) {
  return {
    income: rows.some(
      (row) =>
        !("isDraft" in row) &&
        row.type === "income" &&
        Math.abs(row.amount) > 0,
    )
      ? signedLedgerTotals(
          rows.filter((row) => row.type === "income"),
          currency,
          symbol,
        )
      : null,
    expense: signedLedgerTotals(
      rows.filter((row) => row.type === "expense"),
      currency,
      symbol,
    ),
  };
}
