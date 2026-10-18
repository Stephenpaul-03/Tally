type DateInput = string | number | Date | { toDate: () => Date } | null | undefined;

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  if (/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) {
    const hex = color.slice(1);
    const hasAlpha = hex.length === 8;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hasAlpha ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    const nextA = Math.round(a * clamped * 1000) / 1000;
    return `rgba(${r}, ${g}, ${b}, ${nextA})`;
  }
  if (color.startsWith("rgba(") || color.startsWith("rgb(")) return color;
  return color;
}

export function parseIsoDateOnlyParts(
  value?: string,
): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const parsed = new Date(year, month, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) {
    return null;
  }
  return { year, month, day };
}

export function parseIsoDateOnlyToDate(value?: string): Date | null {
  if (!value) return null;
  const parts = parseIsoDateOnlyParts(value);
  if (!parts) return null;
  // Interpret as local date (no time) to avoid TZ shifts in month names.
  const parsed = new Date(parts.year, parts.month, parts.day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toIsoDateOnly(
  value: DateInput,
  formatDateForInput: (date: Date) => string,
): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return formatDateForInput(parsed);
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return formatDateForInput(parsed);
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return formatDateForInput(value);
  }
  const maybeToDate = (value as { toDate?: unknown }).toDate;
  if (typeof maybeToDate === "function") {
    const parsed = (value as { toDate: () => Date }).toDate();
    if (Number.isNaN(parsed.getTime())) return undefined;
    return formatDateForInput(parsed);
  }
  return undefined;
}

export function getWeekRowsInMonth(
  year: number,
  month: number,
  firstDayOfWeek: number = 0,
): number {
  const firstDayIndex =
    (new Date(year, month, 1).getDay() - firstDayOfWeek + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.ceil((firstDayIndex + daysInMonth) / 7);
}

