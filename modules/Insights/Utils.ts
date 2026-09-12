export function formatAmount(amount: number, currencyCode = "INR", currencySymbol = "") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencySymbol || currencyCode} ${amount.toFixed(2)}`;
  }
}
export function formatShortDay(date: Date | string) {
  const parsed = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
