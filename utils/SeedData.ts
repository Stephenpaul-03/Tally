import { addTransactionAsync } from "@/modules/Data/Slices/TransactionSlice";
import { AppDispatch } from "@/modules/Data/Store";
import type { TransactionFormData } from "@/utils/Types";

/**
 * Generate realistic test transaction data in INR from January through today.
 * Mix of income and expense categories with varied amounts.
 * All amounts are rounded to 2 decimal places.
 */
export function generateTestTransactions(): TransactionFormData[] {
  const incomeCategories = [
    "Salary",
    "Freelance",
    "Investments",
    "Gifts",
    "Refunds",
    "Other Income",
  ];
  const expenseCategories = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Healthcare",
    "Education",
    "Travel",
    "Other Expense",
  ];
  const accounts = ["Cash", "Card", "UPI"];

  const transactions: TransactionFormData[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based
  const currentDay = now.getDate();

  for (let month = 1; month <= currentMonth; month += 1) {
    const y = year;
    const daysInMonth = new Date(y, month, 0).getDate();
    const monthStr = String(month).padStart(2, "0");
    const maxDay =
      month === currentMonth ? Math.min(currentDay, daysInMonth) : daysInMonth;

    for (let day = 1; day <= maxDay; day++) {
      const date = `${y}-${monthStr}-${String(day).padStart(2, "0")}`;

      // Morning commute / transport
      transactions.push({
        title: "Daily commute",
        date,
        amount: Math.round((150 + Math.random() * 200) * 100) / 100,
        type: "expense",
        category: expenseCategories[1],
        account: accounts[Math.floor(Math.random() * 3)],
      });

      // Food (lunch + dinner)
      ["Lunch", "Dinner"].forEach((meal) => {
        const amt = Math.round((200 + Math.random() * 500) * 100) / 100;
        transactions.push({
          title: meal,
          date,
          amount: amt,
          type: "expense",
          category: expenseCategories[0],
          account: accounts[Math.floor(Math.random() * 3)],
        });
      });

      // Miscellaneous expenses
      if (Math.random() < 0.6) {
        const misc = [
          {
            cat: expenseCategories[2],
            title: "Shopping",
            amt: Math.round((300 + Math.random() * 2000) * 100) / 100,
          },
          {
            cat: expenseCategories[5],
            title: "Medical / Health",
            amt: Math.round((200 + Math.random() * 1500) * 100) / 100,
          },
          {
            cat: expenseCategories[6],
            title: "Education",
            amt: Math.round((100 + Math.random() * 800) * 100) / 100,
          },
          {
            cat: expenseCategories[4],
            title: "Entertainment",
            amt: Math.round((250 + Math.random() * 1000) * 100) / 100,
          },
        ];
        const pick = misc[Math.floor(Math.random() * misc.length)];
        transactions.push({
          title: pick.title,
          date,
          amount: pick.amt,
          type: "expense",
          category: pick.cat,
          account: accounts[Math.floor(Math.random() * 3)],
        });
      }

      // Weekend travel
      const dayOfWeek = new Date(y, month - 1, day).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        transactions.push({
          title: "Weekend outing",
          date,
          amount: Math.round((800 + Math.random() * 3000) * 100) / 100,
          type: "expense",
          category: expenseCategories[7],
          account: accounts[Math.floor(Math.random() * 3)],
        });
      }
    }

    // Mid-month bill payments (15th) and end-of-month
    [15, maxDay].forEach((billDay) => {
      if (billDay > maxDay) return;
      const billDate = `${y}-${monthStr}-${String(billDay).padStart(2, "0")}`;
      const bills = [
        "Electricity Bill",
        "Internet / WiFi",
        "Phone Recharge",
        "Streaming Subscription",
      ];
      bills.forEach((billTitle) => {
        transactions.push({
          title: billTitle,
          date: billDate,
          amount: Math.round((500 + Math.random() * 2500) * 100) / 100,
          type: "expense",
          category: expenseCategories[3],
          account: accounts[Math.floor(Math.random() * 3)],
        });
      });
    });

    // Bi-weekly salary / freelance
    [10, 25].forEach((salaryDay) => {
      const salaryDate = `${y}-${monthStr}-${String(salaryDay).padStart(2, "0")}`;
      if (salaryDay <= maxDay) {
        transactions.push({
          title: "Salary",
          date: salaryDate,
          amount: Math.round((45000 + Math.random() * 15000) * 100) / 100,
          type: "income",
          category: incomeCategories[0],
          account: accounts[Math.floor(Math.random() * 3)],
        });
      }
    });

    // Occasional freelance income
    if (Math.random() < 0.08) {
      const lastDay = `${y}-${monthStr}-${String(maxDay).padStart(2, "0")}`;
      transactions.push({
        title: "Freelance project",
        date: lastDay,
        amount: Math.round((5000 + Math.random() * 20000) * 100) / 100,
        type: "income",
        category: incomeCategories[1],
        account: accounts[Math.floor(Math.random() * 3)],
      });
    }
  }

  return transactions;
}

/**
 * Dispatch all generated test transactions to the store, and reset filters
 * to show all dates after import.
 */
export async function seedTestData(dispatch: AppDispatch): Promise<void> {
  const data = generateTestTransactions();

  // Seed transactions sequentially
  for (const tx of data) {
    await dispatch(addTransactionAsync(tx));
  }

  // Reset date filters to show all data
  dispatch({
    type: "filters/setDatePreset",
    payload: "all",
  } as any);
  dispatch({
    type: "filters/resetDateRange",
  } as any);
}
