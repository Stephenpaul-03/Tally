import type { TransactionFormData } from "@/utils/Types";
export type Frequency = "weekly" | "monthly" | "yearly";
export type OccurrenceStatus = "pending" | "confirmed" | "skipped" | "missed";
export type RecurringConfig = { enabled: boolean; frequency: Frequency };
export type RecurringTemplate = {
  id: string; workspaceId: string; sourceTransactionId: string; form: TransactionFormData;
  icon: string; color: string; frequency: Frequency; startDate: string; nextDate: string;
  paused: boolean; deleted: boolean; createdAt: string; updatedAt: string;
};
export type RecurringOccurrence = { templateId: string; dueDate: string; status: OccurrenceStatus; transactionId: string | null; resolvedAt: string | null };
export const REMINDER_WINDOW = { before: 5, after: 5 } as const;
export const frequencyLabel = (frequency: Frequency) => ({ weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" })[frequency];
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && localDate(date) === value;
}
export function shiftDays(value: string, count: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + count);
  return localDate(date);
}
/** Always calculate from the original anchor, so February never moves March off the 31st. */
export function occurrenceDate(anchor: string, index: number, frequency: Frequency): string {
  if (!validDate(anchor) || !Number.isInteger(index) || index < 0) throw Error("Invalid recurring date");
  if (frequency === "weekly") return shiftDays(anchor, index * 7);
  const [year, month, day] = anchor.split("-").map(Number);
  const offset = frequency === "monthly" ? index : index * 12;
  const date = new Date(`${anchor}T12:00:00`);
  date.setDate(1);
  date.setFullYear(year, month - 1 + offset, 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, last));
  return localDate(date);
}
export function nextOccurrence(anchor: string, frequency: Frequency, after: string): string {
  if (!validDate(after)) throw Error("Invalid recurring date");
  if (anchor > after) return anchor;
  const [ay, am] = anchor.split("-").map(Number), [by, bm] = after.split("-").map(Number);
  const dayDifference = Math.floor((Date.parse(`${after}T12:00:00Z`) - Date.parse(`${anchor}T12:00:00Z`)) / 86400000);
  let index = Math.max(0, frequency === "weekly" ? Math.floor(dayDifference / 7) : frequency === "monthly" ? (by-ay)*12+bm-am : by-ay);
  while (occurrenceDate(anchor, index, frequency) <= after) index++;
  return occurrenceDate(anchor, index, frequency);
}
export function windowStatus(dueDate: string, today: string): "future" | "pending" | "missed" {
  if (today < shiftDays(dueDate, -REMINDER_WINDOW.before)) return "future";
  return today > shiftDays(dueDate, REMINDER_WINDOW.after) ? "missed" : "pending";
}
export function validateRecurringForm(form: TransactionFormData) {
  if (!form.title.trim() || !form.category || !form.account || !validDate(form.date) || !["income","expense"].includes(form.type) || !Number.isFinite(form.amount) || form.amount <= 0 || form.amount >= 1e15)
    throw Error("Choose a title, valid date, category, account and an amount greater than zero.");
}
export function monthlyEstimate(templates: RecurringTemplate[]) {
  const amounts: Record<string, number> = {};
  for (const template of templates) {
    if (template.paused || template.deleted || template.form.type !== "expense") continue;
    const code = template.form.currencyCode || "INR";
    const value = template.form.amount * (template.frequency === "weekly" ? 52/12 : template.frequency === "yearly" ? 1/12 : 1);
    amounts[code] = (amounts[code] || 0) + value;
  }
  return amounts;
}
