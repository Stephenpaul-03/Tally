import { formatAccountLabel, formatDateForInput } from "./Helpers";
import type { Transaction, TransactionType } from "./Types";

export function normalizeType(value: unknown): TransactionType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "income" || normalized.startsWith("inc")) return "income";
  if (normalized === "expense" || normalized.startsWith("exp"))
    return "expense";
  return null;
}

export function normalizeAccount(
  value: unknown,
): Transaction["account"] | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "cash" || normalized.includes("cash")) return "Cash";
  if (
    normalized === "card" ||
    normalized.includes("credit") ||
    normalized.includes("debit")
  ) {
    return "Card";
  }
  if (normalized === "upi" || normalized.includes("bank")) return "UPI";
  return formatAccountLabel(value);
}

export function normalizeDate(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatDateForInput(parsed);
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatDateForInput(parsed);
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return formatDateForInput(value);
  }
  return null;
}
