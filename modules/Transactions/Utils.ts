import { Transaction } from "@/modules/Common/Utils/Types";

export type SectionMetric = "expense" | "income";

export function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

export function formatSectionDateLabel(iso: string) {
  const { year, month, day } = parseIso(iso);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function totalForType(transactions: Transaction[], type: SectionMetric) {
  return transactions.reduce((sum, transaction) => {
    return transaction.type === type ? sum + transaction.amount : sum;
  }, 0);
}
