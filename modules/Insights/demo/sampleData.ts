import type { TransactionFormData } from "@/utils/Types";

export const demoCategories = [
  { name: "Salary", type: "income", icon: "briefcase-outline", color: "#428569" },
  { name: "Freelance", type: "income", icon: "laptop", color: "#527DB0" },
  { name: "Interest", type: "income", icon: "bank-outline", color: "#9A79B0" },
  { name: "Groceries", type: "expense", icon: "basket-outline", color: "#6C9A65" },
  { name: "Dining", type: "expense", icon: "silverware-fork-knife", color: "#C78954" },
  { name: "Transport", type: "expense", icon: "bus", color: "#527DB0" },
  { name: "Rent", type: "expense", icon: "home-outline", color: "#9A79B0" },
  { name: "Shopping", type: "expense", icon: "shopping-outline", color: "#B66F86" },
  { name: "Health", type: "expense", icon: "heart-outline", color: "#4D9C94" },
] as const;
export const demoAccounts = ["Bank", "Card", "Cash"];
export const demoBudgets = [
  { category: "Groceries", amount: 7000 }, { category: "Dining", amount: 1200 },
  { category: "Transport", amount: 2500 }, { category: "Rent", amount: 16000 },
  { category: "Shopping", amount: 4000 }, { category: "Health", amount: 2000 },
];
export function buildSampleTransactions(now = new Date()): TransactionFormData[] {
  const rows: TransactionFormData[] = [];
  for (let offset = -5; offset <= 0; offset++) {
    const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const last = offset === 0 ? now.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const add = (day: number, title: string, amount: number, category: string,
      type: "income" | "expense", account: string) => {
      if (day > last) return;
      rows.push({ date: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        title, amount, category, type, account, currencyCode: "INR", currencySymbol: "₹",
        currencyName: "Indian Rupee", notes: "Sample transaction" });
    };
    const phase = offset + 5;
    add(1, "Monthly salary", 56000 + phase * 1500, "Salary", "income", "Bank");
    add(8, "Design project", 6500 + (phase % 3) * 2300, "Freelance", "income", "Bank");
    add(24, "Savings interest", 240 + phase * 35, "Interest", "income", "Bank");
    add(2, "Monthly rent", 16000, "Rent", "expense", "Bank");
    for (let day = 1; day <= last; day++) {
      if (day % 4 === 0) add(day, "Weekly groceries", 620 + (day * 37 + phase * 83) % 850, "Groceries", "expense", "Card");
      if (day % 3 === 0) add(day, "Lunch with friends", 240 + (day * 19 + phase * 97) % 550, "Dining", "expense", "Card");
      if (day % 5 === 0) add(day, "Bus and taxi", 120 + (day * 11) % 200, "Transport", "expense", "Cash");
    }
    add(6, "Clothes", 1800 + phase * 450, "Shopping", "expense", "Card");
    if (phase % 2 === 0) add(11, "Pharmacy", 650 + phase * 90, "Health", "expense", "Cash");
  }
  return rows;
}
