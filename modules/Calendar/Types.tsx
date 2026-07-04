export interface DayActivity {
  date: string;
  hasIncome: boolean;
  hasExpense: boolean;
  incomeTotal: number;
  expenseTotal: number;
  transactionCount: number;
}

export interface CalendarDay {
  day: number | null;
  dateString: string | null;
  activity: DayActivity | null;
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarDay[][];
}

export interface SelectedDaySummary {
  dateString: string;
  label: string;
  dayName: string;
  income: number;
  expense: number;
  monthToDateBalance: number;
  transactionCount: number;
  hasActivity: boolean;
}
