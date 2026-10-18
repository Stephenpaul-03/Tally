/**
 * Transaction Helper Utilities
 * Formatting and utility functions for transactions
 */

import options from "@/data/management-options.json";

import {
    DEFAULT_ACCOUNTS,
    DEFAULT_EXPENSE_CATEGORIES,
    DEFAULT_INCOME_CATEGORIES,
    Transaction,
    TransactionDatePreset,
    TransactionFilters,
    TransactionType,
} from "./Types";

const INCOME_CATEGORY_ICON_MAP: Record<string, string> =
  options.defaultCategoryIcons.income;
const EXPENSE_CATEGORY_ICON_MAP: Record<string, string> =
  options.defaultCategoryIcons.expense;
const INCOME_FALLBACK_ICONS = options.fallbackCategoryIcons;
const EXPENSE_FALLBACK_ICONS = options.fallbackCategoryIcons;
const ACCOUNT_ICON_MAP: Record<string, string> = options.defaultAccountIcons;
const ACCOUNT_COLOR_MAP: Record<string, string> = options.defaultAccountColors;
const ACCOUNT_PICKER_ICONS = options.accountIcons;

export const CATEGORY_COLOR_OPTIONS = options.colors;

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}
export function getCategoryIconKey(
  type: TransactionType,
  category: string,
): string {
  return `${type}:${category.trim().toLowerCase()}`;
}

export function getCategoryColorOptions(): string[] {
  return [...CATEGORY_COLOR_OPTIONS];
}

export function getAccountKey(account: string): string {
  return account.trim().toLowerCase();
}

export function getAccountColorOptions(): string[] {
  return getCategoryColorOptions();
}

export function getAccountIconOptions(): string[] {
  return [...new Set([...Object.values(ACCOUNT_ICON_MAP), ...options.accountIcons])];
}

export function getCategoryIconOptions(_type: TransactionType): string[] {
  return options.categoryIcons;
}

/**
 * Generate a unique ID for transactions
 */
export function generateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}`;
}

/**
 * Creates a new transaction object with default values.
 * @param data - The form data for the new transaction.
 * @returns A full transaction object.
 */
export const createTransaction = (
  data: Partial<Transaction> & {
    category: string;
    type: TransactionType;
    account: string;
    amount: number;
    date: string;
    category_id?: number;
  },
): Transaction & { category_id: number } => {
  const now = new Date().toISOString();
  const tagsValue = data.tags
    ? Array.isArray(data.tags)
      ? JSON.stringify(data.tags)
      : data.tags
    : "[]";
  return {
    id:
      data.id || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: data.title?.trim() || data.category,
    amount: Math.abs(data.amount),
    date: data.date,
    type: data.type,
    account: data.account,
    currencyCode: data.currencyCode,
    currencySymbol: data.currencySymbol,
    currencyName: data.currencyName,
    notes: data.notes,
    tags: tagsValue as unknown as string[],
    createdBy: data.createdBy || "CurrentUser",
    deleted: data.deleted || false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    category_id: data.category_id || 0,
    category: data.category,
  };
};

/**
 * Format currency for display
 * Uses simple formatting without currency symbol for flexibility
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

/**
 * Format currency with symbol for display
 * @param amount - The amount to format
 * @param symbol - Optional symbol prefix (empty by default)
 * @param isNegative - Whether to show negative sign (true = show minus, false = hide for expense display)
 */
export function formatCurrencyWithSymbol(
  amount: number,
  symbol: string = "",
  isNegative: boolean = true,
): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = isNegative && amount < 0 ? "-" : "";
  return `${sign}${symbol ? `${symbol}` : ""}${formatted}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "Sepember",
    "October",
    "November",
    "December",
  ];
  const d = date.getDate();
  const suffix =
    d >= 11 && d <= 13
      ? "th"
      : d % 10 === 1
        ? "st"
        : d % 10 === 2
          ? "nd"
          : d % 10 === 3
            ? "rd"
            : "th";
  const mon = months[date.getMonth()];
  const yyyy = String(date.getFullYear());
  return `${d}${suffix} ${mon} ${yyyy}`;
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayDate(): string {
  return formatDateForInput(new Date());
}

function getDateAtStartOfDay(value: Date): Date {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Resolve a date range from a relative date preset.
 */
export function getDateRangeFromPreset(
  preset: Exclude<TransactionDatePreset, "custom">,
  referenceDate: Date = new Date(),
): { start: string; end: string } | undefined {
  const today = getDateAtStartOfDay(referenceDate);

  if (preset === "all") {
    return undefined;
  }

  if (preset === "today") {
    const value = formatDateForInput(today);
    return { start: value, end: value };
  }

  if (preset === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return {
      start: formatDateForInput(start),
      end: formatDateForInput(today),
    };
  }

  if (preset === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: formatDateForInput(start),
      end: formatDateForInput(today),
    };
  }

  if (preset === "lastmonth") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      start: formatDateForInput(start),
      end: formatDateForInput(end),
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  start.setMonth(start.getMonth() - 2);
  return {
    start: formatDateForInput(start),
    end: formatDateForInput(today),
  };
}

/**
 * Resolve an icon for a category.
 * Known categories get fixed icons; custom categories get deterministic icons.
 */
export function getCategoryIconName(
  category: string,
  type: TransactionType,
  categoryIcons?: Record<string, string>,
): string {
  const normalizedCategory = category.trim().toLowerCase();
  const customIcon =
    categoryIcons?.[getCategoryIconKey(type, normalizedCategory)];
  if (customIcon) return customIcon;

  const iconMap =
    type === "income" ? INCOME_CATEGORY_ICON_MAP : EXPENSE_CATEGORY_ICON_MAP;
  const fallbackIcons =
    type === "income" ? INCOME_FALLBACK_ICONS : EXPENSE_FALLBACK_ICONS;

  const directIcon = iconMap[normalizedCategory];
  if (directIcon) return directIcon;

  if (
    normalizedCategory.includes("food") ||
    normalizedCategory.includes("meal")
  ) {
    return "silverware-fork-knife";
  }
  if (
    normalizedCategory.includes("rent") ||
    normalizedCategory.includes("bill")
  ) {
    return "home-lightning-bolt-outline";
  }
  if (
    normalizedCategory.includes("tax") ||
    normalizedCategory.includes("fee")
  ) {
    return "file-document-outline";
  }
  if (normalizedCategory.includes("gift")) {
    return "gift-outline";
  }
  if (
    normalizedCategory.includes("pay") ||
    normalizedCategory.includes("salary") ||
    normalizedCategory.includes("income")
  ) {
    return "briefcase-outline";
  }

  const fallbackIndex =
    hashString(`${type}:${normalizedCategory || "category"}`) %
    fallbackIcons.length;
  return fallbackIcons[fallbackIndex];
}

export function getCategoryColor(
  category: string,
  type: TransactionType,
  categoryColors?: Record<string, string>,
): string {
  const normalizedCategory = category.trim().toLowerCase();
  const customColor =
    categoryColors?.[getCategoryIconKey(type, normalizedCategory)];
  if (customColor) return customColor;

  const fallbackIndex =
    hashString(`${type}:${normalizedCategory || "category"}:color`) %
    CATEGORY_COLOR_OPTIONS.length;
  return CATEGORY_COLOR_OPTIONS[fallbackIndex];
}

export function getAccountIconName(
  account: string,
  accountIcons?: Record<string, string>,
): string {
  const normalizedAccount = getAccountKey(account);
  const customIcon = accountIcons?.[normalizedAccount];
  if (customIcon) return customIcon;

  const mappedIcon = ACCOUNT_ICON_MAP[normalizedAccount];
  if (mappedIcon) return mappedIcon;

  const fallbackIndex =
    hashString(`${normalizedAccount || "account"}:icon`) %
    ACCOUNT_PICKER_ICONS.length;
  return ACCOUNT_PICKER_ICONS[fallbackIndex];
}

export function getAccountColor(
  account: string,
  accountColors?: Record<string, string>,
): string {
  const normalizedAccount = getAccountKey(account);
  const customColor = accountColors?.[normalizedAccount];
  if (customColor) return customColor;

  const mappedColor = ACCOUNT_COLOR_MAP[normalizedAccount];
  if (mappedColor) return mappedColor;

  const fallbackIndex =
    hashString(`${normalizedAccount || "account"}:color`) %
    CATEGORY_COLOR_OPTIONS.length;
  return CATEGORY_COLOR_OPTIONS[fallbackIndex];
}

export function formatAccountLabel(account: string | null | undefined): string {
  const trimmed = account?.trim() ?? "";
  if (!trimmed) return "";
  const normalized = trimmed.toLowerCase();
  const known = DEFAULT_ACCOUNTS.find(
    (item) => item.toLowerCase() === normalized,
  );
  if (known) return known;
  return trimmed;
}

export function withOpacity(color: string, opacityHex: string): string {
  if (!color.startsWith("#")) return color;

  const normalized = color.length === 9 ? color.slice(0, 7) : color;
  return `${normalized}${opacityHex}`;
}

export function formatTransactionTime(timestamp?: string): string {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getOrdinalSuffix(day: number): string {
  const remainder = day % 100;
  if (remainder >= 11 && remainder <= 13) return "th";

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatTransactionDate(dateOnly?: string): string {
  if (!dateOnly) return "";

  const parts = dateOnly.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return "";

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return "";

  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(date);

  return `${day}${getOrdinalSuffix(day)} ${monthLabel}`;
}

export function formatTransactionDateTime(
  dateOnly?: string,
  timestamp?: string,
  monthMode = false,
): string {
  const timeLabel = formatTransactionTime(timestamp);
  if (!monthMode) return timeLabel;

  const dateLabel = formatTransactionDate(dateOnly);
  if (dateLabel && timeLabel) return `${dateLabel}, ${timeLabel}`;
  if (dateLabel) return dateLabel;
  return timeLabel;
}

/**
 * Check if transaction matches filters
 */
export function matchesFilters(
  transaction: Transaction,
  filters: TransactionFilters,
): boolean {
  // Skip deleted transactions
  if (transaction.deleted) return false;

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch =
      transaction.category.toLowerCase().includes(searchLower) ||
      (transaction.notes &&
        transaction.notes.toLowerCase().includes(searchLower)) ||
      (transaction.tags &&
        transaction.tags.some((tag) =>
          tag.toLowerCase().includes(searchLower),
        ));
    if (!matchesSearch) return false;
  }

  // Date range filter
  if (filters.date?.start) {
    if (transaction.date < filters.date.start) return false;
  }
  if (filters.date?.end) {
    if (transaction.date > filters.date.end) return false;
  }

  // Category filter
  if (filters.category && filters.category !== "all") {
    if (transaction.category !== filters.category) return false;
  }

  // Account filter
  if (filters.account && filters.account !== "all") {
    if (transaction.account !== filters.account) return false;
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    const hasAllTags = filters.tags.every((tag) =>
      transaction.tags?.includes(tag),
    );
    if (!hasAllTags) return false;
  }

  return true;
}

/**
 * Get unique categories from transactions and default categories
 */
export function getUniqueCategories(
  transactions: Transaction[],
  type: TransactionType,
  defaultCategories: readonly string[],
): string[] {
  // Get categories from transactions
  const transactionCategories = transactions
    .filter((t) => t.type === type && !t.deleted)
    .map((t) => t.category);

  // Combine with defaults and get unique values
  const allCategories = [...defaultCategories, ...transactionCategories];
  const uniqueCategories = [...new Set(allCategories)];

  return uniqueCategories.sort();
}

/**
 * Get unique tags from transactions
 */
export function getUniqueTags(transactions: Transaction[]): string[] {
  const tags = transactions
    .filter((t) => t.tags && t.tags.length > 0 && !t.deleted)
    .flatMap((t) => t.tags!);

  return [...new Set(tags)].sort();
}

/**
 * Get last transaction (most recent by date)
 */
export function getLastTransaction(
  transactions: Transaction[],
  type?: TransactionType,
): Transaction | null {
  const filtered = type
    ? transactions.filter((t) => t.type === type && !t.deleted)
    : transactions.filter((t) => !t.deleted);

  if (filtered.length === 0) return null;

  // Sort by date descending, then by createdAt descending
  const sorted = [...filtered].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return sorted[0];
}

/**
 * Validate amount
 */
export function validateAmount(amount: number): {
  valid: boolean;
  error?: string;
} {
  if (isNaN(amount)) {
    return { valid: false, error: "Amount must be a number" };
  }
  if (!isFinite(amount)) {
    return { valid: false, error: "Invalid number" };
  }
  if (amount === 0) {
    return { valid: false, error: "Amount cannot be zero" };
  }
  return { valid: true };
}

/**
 * Format tags array to comma-separated string
 */
export function formatTagsForDisplay(tags?: string[]): string {
  if (!tags || tags.length === 0) return "";
  return tags.join(", ");
}

/**
 * Parse tags from comma-separated string
 */
export function parseTagsFromString(tagString: string): string[] {
  if (!tagString.trim()) return [];
  return tagString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Get default categories for a transaction type
 */
export function getDefaultCategories(type: TransactionType): string[] {
  if (type === "income") {
    return [...DEFAULT_INCOME_CATEGORIES];
  }
  return [...DEFAULT_EXPENSE_CATEGORIES];
}

/**
 * Calculate total for a list of transactions
 */
export function calculateTotal(transactions: Transaction[]): number {
  return transactions
    .filter((t) => !t.deleted)
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total by type
 */
export function calculateTotalByType(
  transactions: Transaction[],
  type: TransactionType,
): number {
  return transactions
    .filter((t) => t.type === type && !t.deleted)
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Sort transactions by date (newest first)
 */
export function sortByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    // Handle missing dates
    if (!a.date) return 1;
    if (!b.date) return -1;
    // First sort by date descending
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    // Then by createdAt descending for same-date transactions
    const aCreatedAt = a.createdAt || "";
    const bCreatedAt = b.createdAt || "";
    return bCreatedAt.localeCompare(aCreatedAt);
  });
}

/**
 * Group transactions by date
 */
export function groupByDate(
  transactions: Transaction[],
): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {};

  for (const transaction of transactions) {
    if (!grouped[transaction.date]) {
      grouped[transaction.date] = [];
    }
    grouped[transaction.date].push(transaction);
  }

  return grouped;
}

/**
 * Get transactions for the current month
 */
export function getCurrentMonthTransactions(
  transactions: Transaction[],
): Transaction[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return transactions.filter((t) => {
    const [year, month] = t.date.split("-").map(Number);
  return year === currentYear && month === currentMonth;
});
}
