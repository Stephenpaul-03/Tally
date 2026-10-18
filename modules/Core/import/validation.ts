import type { TransactionFormData, TransactionType } from "@/utils/Types";

export type ImportCatalog = { incomeCategories: string[]; expenseCategories: string[]; accounts: string[]; categoryIcons?: Record<string, string>; categoryColors?: Record<string, string>; accountIcons?: Record<string, string>; accountColors?: Record<string, string> };
export type ImportRow = {
  rowNumber: number;
  transaction: TransactionFormData;
  originalCategory: string;
  originalAccount: string;
  createCategory?: boolean;
  createAccount?: boolean;
};
export type ImportProblem = { rowNumber: number; message: string };
export class ImportValidationError extends Error {
  constructor(public problems: ImportProblem[]) {
    super(`Nothing was imported. Fix ${problems.length} issue${problems.length === 1 ? "" : "s"} in the file and choose it again.`);
    this.name = "ImportValidationError";
  }
}
export class ImportSavedError extends Error {
  constructor(count: number) {
    super(`${count} transactions were saved, but the list could not refresh. Restart the app; do not import the file again.`);
    this.name = "ImportSavedError";
  }
}
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
export function exactName(value: string, choices: string[]) {
  return choices.find(name => name.toLocaleLowerCase() === value.toLocaleLowerCase());
}
export function categoryNames(type: TransactionType, catalog: ImportCatalog) {
  return type === "income" ? catalog.incomeCategories : catalog.expenseCategories;
}
export function needsCategory(row: ImportRow, catalog: ImportCatalog) {
  return !row.transaction.category || (!row.createCategory && !exactName(row.transaction.category, categoryNames(row.transaction.type, catalog)));
}
export function needsAccount(row: ImportRow, catalog: ImportCatalog) {
  if (!row.transaction.account) return true;
  return !row.createAccount && !exactName(row.transaction.account, catalog.accounts);
}
export function needsReview(row: ImportRow, catalog: ImportCatalog) {
  return needsCategory(row, catalog) || needsAccount(row, catalog);
}

// Validate the whole file. Never drop bad rows or silently replace unknown names.
export function validateImport(raw: unknown, catalog: ImportCatalog): ImportRow[] {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const data = raw as Record<string, unknown>;
    raw = [data.transactions, data.transaction, data.items, data.data, data.rows].find(Array.isArray);
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ImportValidationError([{ rowNumber: 0, message: "Expected a non-empty transactions array in a JSON file." }]);
  }
  const problems: ImportProblem[] = [];
  const rows = raw.map((item, index): ImportRow | null => {
    const rowNumber = index + 1;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      problems.push({ rowNumber, message: "Transaction must be an object." });
      return null;
    }
    const t = item as Record<string, unknown>;
    const title = text(t.title ?? t.name ?? t.transactionName);
    const type = text(t.type ?? t.transactionType).toLowerCase();
    const dateRaw = text(t.date ?? t.transactionDate);
    const date = dateRaw.slice(0, 10);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Number.isFinite(Date.parse(date + "T12:00:00Z")) && new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date &&
      (dateRaw === date || (/^\d{4}-\d{2}-\d{2}T/.test(dateRaw) && Number.isFinite(Date.parse(dateRaw))));
    const amountRaw = t.amount ?? t.value;
    const amountText = typeof amountRaw === "string" ? amountRaw.trim().replace(/,/g, "") : "";
    const amount = typeof amountRaw === "number" ? amountRaw : /^-?\d+(\.\d+)?$/.test(amountText) ? Number(amountText) : NaN;
    if (!title) problems.push({ rowNumber, message: "Description/title is missing." });
    if (type !== "income" && type !== "expense") problems.push({ rowNumber, message: "Type must be income or expense." });
    if (!validDate) problems.push({ rowNumber, message: "Date is missing or invalid. Use YYYY-MM-DD." });
    if (!Number.isFinite(amount) || amount === 0) problems.push({ rowNumber, message: "Amount must be a finite, non-zero number." });
    if (t.tags != null && (!Array.isArray(t.tags) || !t.tags.every(tag => typeof tag === "string"))) {
      problems.push({ rowNumber, message: "Tags must be a list of text values." });
    }
    const category = text(t.category ?? t.Category ?? t.categoryName);
    const account = text(t.account ?? t.accountType ?? t.paymentMethod);
    const transactionType = type as TransactionType;
    return {
      rowNumber, originalCategory: category, originalAccount: account,
      transaction: {
        title, type: transactionType, date, amount: Math.abs(amount),
        category: exactName(category, categoryNames(transactionType, catalog)) ?? category,
        account: exactName(account, catalog.accounts) ?? account,
        ...(typeof t.notes === "string" ? { notes: t.notes } : {}),
        ...(Array.isArray(t.tags) ? { tags: t.tags as string[] } : {}),
        ...(typeof t.currencyCode === "string" ? { currencyCode: t.currencyCode } : {}),
        ...(typeof t.currencySymbol === "string" ? { currencySymbol: t.currencySymbol } : {}),
        ...(typeof t.currencyName === "string" ? { currencyName: t.currencyName } : {}),
      },
    };
  });
  if (problems.length) throw new ImportValidationError(problems);
  return rows as ImportRow[];
}

export function applyImportChoice(rows: ImportRow[], selected: ImportRow, field: "category" | "account", name: string, create: boolean, matching: boolean): ImportRow[] {
  const updated = rows.map(row => {
    const matches = field === "category"
      ? row.transaction.type === selected.transaction.type && row.originalCategory === selected.originalCategory
      : row.originalAccount === selected.originalAccount;
    if (row.rowNumber !== selected.rowNumber && !(matching && matches)) return row;
    return { ...row, transaction: { ...row.transaction, [field]: name },
      ...(field === "category" ? { createCategory: create } : { createAccount: create }) };
  });
  // A newly created category belongs to the workspace, so every row already
  // using that name can use it without a separate review decision.
  if (field !== "category" || !create || !name.trim()) return updated;
  return updated.map(row => row.transaction.type === selected.transaction.type &&
    row.transaction.category.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase()
    ? { ...row, transaction: { ...row.transaction, category: name }, createCategory: true }
    : row);
}
