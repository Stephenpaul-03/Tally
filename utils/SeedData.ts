import { addTransactionAsync } from "@/modules/Core/Slices/TransactionSlice";
import { AppDispatch } from "@/modules/Core/Store";
import type { TransactionFormData } from "@/utils/Types";

export type SeedDensity = "light" | "moderate" | "heavy";

export type SeedConfig = {
  months: number[];          // 0-based, e.g. [0, 1, 2] = Jan–Mar
  transport: { max: number };
  food: { max: number };
  misc: { max: number };
  salary: { max: number };
  includeIncome: boolean;
  includeWeekendTravel: boolean;
  density: SeedDensity;
};

export const DEFAULT_SEED_CONFIG: SeedConfig = {
  months: [0, 1, 2, 3],
  transport: { max: 600 },
  food: { max: 700 },
  misc: { max: 2300 },
  salary: { max: 60000 },
  includeIncome: true,
  includeWeekendTravel: true,
  density: "light",
};

const DENSITY_MISC_CHANCE: Record<SeedDensity, number> = {
  light: 0.4,
  moderate: 0.65,
  heavy: 0.9,
};

const rand = (min: number, max: number) =>
  Math.round((min + Math.random() * (max - min)) * 100) / 100;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function generateTestTransactions(
  config: SeedConfig = DEFAULT_SEED_CONFIG
): TransactionFormData[] {
  const incomeCategories = ["Salary", "Freelance", "Investments", "Gifts", "Refunds", "Other Income"];
  const expenseCategories = [
    "Food & Dining", "Transportation", "Shopping", "Bills & Utilities",
    "Entertainment", "Healthcare", "Education", "Travel", "Other Expense",
  ];
  const accounts = ["Cash", "Card", "UPI"];
  const transactions: TransactionFormData[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const miscChance = DENSITY_MISC_CHANCE[config.density];

  for (const month of config.months) {
    const m1 = month + 1;                          // 1-based for Date
    const daysInMonth = new Date(year, m1, 0).getDate();
    const isCurrentMonth = m1 === now.getMonth() + 1;
    const maxDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
    const monthStr = String(m1).padStart(2, "0");

    for (let day = 1; day <= maxDay; day++) {
      const date = `${year}-${monthStr}-${String(day).padStart(2, "0")}`;

      // Transport
      transactions.push({
        title: "Daily commute",
        date,
        amount: rand(50, config.transport.max),
        type: "expense",
        category: expenseCategories[1],
        account: pick(accounts),
      });

      // Food
      for (const meal of ["Lunch", "Dinner"]) {
        transactions.push({
          title: meal,
          date,
          amount: rand(100, config.food.max),
          type: "expense",
          category: expenseCategories[0],
          account: pick(accounts),
        });
      }

      // Misc expenses
      if (Math.random() < miscChance) {
        const miscOptions = [
          { cat: expenseCategories[2], title: "Shopping" },
          { cat: expenseCategories[5], title: "Medical / Health" },
          { cat: expenseCategories[6], title: "Education" },
          { cat: expenseCategories[4], title: "Entertainment" },
        ];
        const chosen = pick(miscOptions);
        transactions.push({
          title: chosen.title,
          date,
          amount: rand(200, config.misc.max),
          type: "expense",
          category: chosen.cat,
          account: pick(accounts),
        });
      }

      // Weekend travel
      if (config.includeWeekendTravel) {
        const dow = new Date(year, month, day).getDay();
        if (dow === 0 || dow === 6) {
          transactions.push({
            title: "Weekend outing",
            date,
            amount: rand(800, 3000),
            type: "expense",
            category: expenseCategories[7],
            account: pick(accounts),
          });
        }
      }
    }

    // Bills on 15th and last day
    for (const billDay of [15, maxDay]) {
      if (billDay > maxDay) continue;
      const billDate = `${year}-${monthStr}-${String(billDay).padStart(2, "0")}`;
      for (const title of ["Electricity Bill", "Internet / WiFi", "Phone Recharge", "Streaming Subscription"]) {
        transactions.push({
          title,
          date: billDate,
          amount: rand(500, 2500),
          type: "expense",
          category: expenseCategories[3],
          account: pick(accounts),
        });
      }
    }

    if (!config.includeIncome) continue;

    // Bi-weekly salary
    for (const salaryDay of [10, 25]) {
      if (salaryDay <= maxDay) {
        const salaryDate = `${year}-${monthStr}-${String(salaryDay).padStart(2, "0")}`;
        transactions.push({
          title: "Salary",
          date: salaryDate,
          amount: rand(45000, config.salary.max),
          type: "income",
          category: incomeCategories[0],
          account: pick(accounts),
        });
      }
    }

    // Occasional freelance
    if (Math.random() < 0.08) {
      const lastDate = `${year}-${monthStr}-${String(maxDay).padStart(2, "0")}`;
      transactions.push({
        title: "Freelance project",
        date: lastDate,
        amount: rand(5000, 20000),
        type: "income",
        category: incomeCategories[1],
        account: pick(accounts),
      });
    }
  }

  return transactions;
}

export async function seedTestData(
  dispatch: AppDispatch,
  config: SeedConfig = DEFAULT_SEED_CONFIG
): Promise<void> {
  const data = generateTestTransactions(config);
  for (const tx of data) {
    await dispatch(addTransactionAsync(tx));
  }
  dispatch({ type: "filters/setDatePreset", payload: "all" } as any);
  dispatch({ type: "filters/resetDateRange" } as any);
}