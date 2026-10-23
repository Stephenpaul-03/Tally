import type { calculateInsights } from "./calculations";
import type { Detail } from "./sheets/DetailsSheet";
export function dailyActivityDetail(
  day: ReturnType<typeof calculateInsights>["days"][number],
  type: "income" | "expense",
  money: (value: number) => string,
): Detail {
  return {
    title: new Date(day.date + "T00:00:00").toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    description: type === "income" ? "Income recorded" : "Spending recorded",
    summary: {
      label: type === "income" ? "Income" : "Spent",
      value: money(day[type]),
    },
    transactions: day.transactions.filter((row) => row.type === type),
  };
}
