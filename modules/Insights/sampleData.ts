import type { TransactionFormData } from "../../utils/Types";

// Reserved IDs keep samples identifiable even after their titles or tags are edited.
export const SAMPLE_ID_PREFIX = "tally-insights-sample:";

type Example = readonly [title: string, amount: number];
const expenseExamples: Record<string, readonly Example[]> = {
  groceries: [["Supermarket groceries", 850], ["Pantry essentials", 640]],
  fruits: [["Seasonal fruits", 180], ["Apples and bananas", 240]],
  vegetables: [["Fresh vegetables", 160], ["Weekly vegetable basket", 280]],
  "meat & fish": [["Fresh fish", 420], ["Chicken for dinner", 360]],
  "milk & dairy": [["Milk and curd", 95], ["Milk and yogurt", 120]],
  "food & dining": [["Lunch at the cafe", 280], ["Family dinner", 950]],
  food: [["Breakfast", 120], ["Lunch", 240]],
  rent: [["Monthly rent", 15000]],
  "bills & utilities": [["Electricity and water bills", 2400]],
  bills: [["Monthly utility bills", 2400]],
  transportation: [["Auto ride", 140], ["Bus fare", 60]],
  transport: [["Bus fare", 60], ["Cab ride", 260]],
  healthcare: [["Pharmacy essentials", 340], ["Doctor consultation", 600]],
  education: [["School fees", 2500], ["Books and stationery", 380]],
  shopping: [["Household essentials", 720], ["New bedsheets", 1100]],
  entertainment: [["Movie tickets", 650], ["Weekend outing", 900]],
  leisure: [["Movie tickets", 650], ["Weekend outing", 900]],
  travel: [["Train tickets", 1200], ["Hotel booking", 2800]],
  eggs: [["Eggs", 90]], bakery: [["Bread and buns", 110]], snacks: [["Evening snacks", 90]],
  "tea & coffee": [["Morning coffee", 80], ["Afternoon tea", 40]],
  "cooking gas": [["Cooking gas refill", 950]],
  "phone & internet": [["Phone recharge", 299], ["Broadband bill", 799]],
  "domestic help": [["Monthly housekeeping", 3000]],
  "home maintenance": [["Plumbing repair", 650], ["Appliance servicing", 900]],
  "personal care": [["Haircut", 250], ["Personal care essentials", 320]],
  clothing: [["Everyday clothing", 850]], fuel: [["Fuel refill", 1000]],
  insurance: [["Insurance premium", 1800]], donations: [["Community donation", 500]],
  gifts: [["Birthday gift", 750]], subscriptions: [["Streaming subscription", 199]],
  childcare: [["Childcare essentials", 450]], fitness: [["Gym membership", 1200]],
  pets: [["Pet food", 650]], "other expense": [["Miscellaneous expense", 150]],
};
const incomeExamples: Record<string, readonly Example[]> = {
  salary: [["Monthly salary", 69000]], freelance: [["Freelance project payment", 7500]],
  "rental income": [["Rent received", 12000]], investments: [["Investment payout", 1800]],
  gifts: [["Gift received", 1500]], refunds: [["Purchase refund", 650]],
  bonus: [["Performance bonus", 5000]], interest: [["Savings interest", 350]],
  dividends: [["Dividend payment", 1200]], "side hustle": [["Side project payment", 3500]],
  pension: [["Monthly pension", 18000]], "business income": [["Customer payment", 8500]],
  "family support": [["Family contribution", 3000]], "other income": [["Additional income", 1000]],
};
const key = (name: string) => name.trim().toLowerCase();

export function createSampleTransactions({ now = new Date(), incomeCategories, expenseCategories, accounts, currency }: {
  now?: Date;
  incomeCategories: string[];
  expenseCategories: string[];
  accounts: string[];
  currency: { currencyCode: string; currencySymbol: string; currencyName: string };
}): TransactionFormData[] {
  if (!incomeCategories.length || !expenseCategories.length || !accounts.length) {
    throw new Error("Add an income category, an expense category, and an account before loading sample data.");
  }
  const rows: TransactionFormData[] = [];
  const find = (categories: string[], names: string[]) => categories.find(category => names.includes(key(category)));
  const salary = find(incomeCategories, ["salary", "pension"]) ?? incomeCategories[0];
  const sideIncome = find(incomeCategories, ["freelance", "side hustle", "business income"]) ?? incomeCategories[1] ?? salary;
  const rental = find(incomeCategories, ["rental income"]);
  const recurring = expenseCategories.filter(category => ["rent", "bills & utilities", "bills", "domestic help", "insurance", "cooking gas", "education", "subscriptions", "fitness"].includes(key(category)));
  const everyday = expenseCategories.filter(category => !recurring.includes(category));
  const dailyCategories = everyday;
  for (let offset = -2; offset <= 0; offset++) {
    const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const lastDay = offset === 0 ? now.getDate() : new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const month = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`;
    const add = (day: number, type: "income" | "expense", category: string, variation: number) => {
      const examples = (type === "income" ? incomeExamples : expenseExamples)[key(category)] ??
        [[`${category} ${type === "income" ? "income" : "expense"}`, type === "income" ? 2000 : 250]];
      const [title, amount] = examples[variation % examples.length];
      const date = `${month}-${String(day).padStart(2, "0")}`;
      if (rows.some(row => row.date === date && row.type === type && row.category === category && row.title === title)) return;
      rows.push({ title, amount, type, date, category,
        account: accounts[(day + variation) % accounts.length],
        ...currency, notes: "Sample data for testing Insights", tags: ["tally-sample"],
      });
    };
    for (let day = 1; day <= lastDay; day++) {
      if (day === 1) add(day, "income", salary, offset + 2);
      if (day === 12 || day === 24) add(day, "income", sideIncome, day);
      if (day === 5 && rental && rental !== salary && rental !== sideIncome) add(day, "income", rental, 0);
      if (day === 1) {
        if (recurring.length) recurring.forEach((category) => add(day, "expense", category, 0));
        else add(day, "expense", dailyCategories[0], offset + 2);
      }
      // Quiet days and multiple small purchases make the activity calendar useful.
      if (dailyCategories.length && day % 7 !== 0) {
        const index = (day + (offset + 2) * 3) % dailyCategories.length;
        add(day, "expense", dailyCategories[index], day + offset + 2);
        if (day % 3 === 0) add(day, "expense", dailyCategories[(index + 1) % dailyCategories.length], day + 1);
      }
      if (day === 18) {
        const outing = find(expenseCategories, ["entertainment", "leisure", "food & dining", "food", "shopping"]);
        if (outing) add(day, "expense", outing, 1);
      }
    }
  }
  return rows;
}
