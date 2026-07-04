import type {
  CalendarDay,
  CalendarMonth,
  DayActivity,
} from "./Types";

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function buildCalendarMonth(
  year: number,
  month: number,
): CalendarMonth {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayStartOffset = (firstDay.getDay() + 6) % 7;

  const cells: CalendarDay[] = [];

  for (let index = 0; index < mondayStartOffset; index += 1) {
    cells.push({ day: null, dateString: null, activity: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      dateString: toIsoDate(year, month, day),
      activity: null,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, dateString: null, activity: null });
  }

  while (cells.length < 35) {
    cells.push({ day: null, dateString: null, activity: null });
  }

  const weeks: CalendarDay[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return { year, month, weeks };
}

export function formatDayLabel(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(toLocalDate(dateString));
}

export function getDayName(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
  }).format(toLocalDate(dateString));
}

export function getActiveDayCount(activities: DayActivity[]) {
  return activities.filter((activity) => activity.transactionCount > 0).length;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isTodayString(dateString: string) {
  const now = new Date();
  const today = toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
  return dateString === today;
}
