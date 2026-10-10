export function formatAmount(amount: number, currencyCode = "INR", currencySymbol = "") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencySymbol || currencyCode} ${amount.toFixed(2)}`;
  }
}
// Retain currency precision for purchases, but omit trailing zeroes in summaries.
export function formatInsightAmount(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency: currencyCode, minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return formatAmount(amount, currencyCode);
  }
}
export function formatShortDay(date: Date | string) {
  const parsed = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
