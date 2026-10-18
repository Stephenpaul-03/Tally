import options from "@/data/management-options.json";
import type { OnboardingSetup, SetupItem } from "./storage";

export type SetupChoice = SetupItem & { selected: boolean; custom?: boolean };
export type ChoiceKind = "income" | "expense" | "accounts";
export const WORKSPACE_ICONS = ["account-outline", "home-outline", "account-group-outline", "briefcase-outline", "storefront-outline", "school-outline", "airplane", "heart-outline", "wallet-outline", "piggy-bank-outline", "rocket-launch-outline", "star-outline"];
export const SETUP_COLORS = options.colors;
// Onboarding uses a household starter set; existing workspaces keep their categories.
const DEFAULT_PRESETS = {
  income: [
    ["Salary", "briefcase-outline"], ["Freelance", "laptop-account"],
    ["Rental Income", "home-account"], ["Investments", "chart-line-variant"],
    ["Gifts", "gift-outline"], ["Refunds", "cash-refund"], ["Other Income", "wallet-plus-outline"],
  ],
  expense: [
    ["Groceries", "basket-outline"], ["Fruits", "fruit-watermelon"],
    ["Vegetables", "carrot"], ["Meat & Fish", "food-drumstick-outline"],
    ["Milk & Dairy", "cup-water"], ["Food & Dining", "silverware-fork-knife"],
    ["Rent", "home-outline"], ["Bills & Utilities", "lightning-bolt-outline"],
    ["Transportation", "car-outline"], ["Healthcare", "medical-bag"],
    ["Education", "school-outline"], ["Shopping", "cart-outline"], ["Other Expense", "wallet-outline"],
  ],
  accounts: [
    ["Card", "credit-card-outline"], ["Cash", "cash"], ["UPI", "bank-outline"],
    ["Bank transfer", "bank-transfer"], ["Digital wallet", "wallet-outline"],
  ],
} as const;
const EXTRA_PRESETS = {
  income: [
    ["Bonus", "briefcase-check-outline"], ["Interest", "percent-outline"],
    ["Dividends", "chart-line"], ["Side Hustle", "laptop"], ["Pension", "bank-transfer-in"],
    ["Business Income", "storefront-outline"], ["Family Support", "account-group-outline"],
  ],
  expense: [
    ["Eggs", "egg-outline"], ["Bakery", "bread-slice-outline"], ["Snacks", "food-croissant"],
    ["Tea & Coffee", "coffee-outline"], ["Cooking Gas", "gas-cylinder"],
    ["Phone & Internet", "wifi"], ["Domestic Help", "broom"], ["Home Maintenance", "tools"],
    ["Personal Care", "scissors-cutting"], ["Clothing", "tshirt-crew-outline"],
    ["Fuel", "gas-station-outline"], ["Insurance", "shield-check-outline"],
    ["Donations", "hand-heart-outline"], ["Gifts", "gift-open-outline"],
    ["Subscriptions", "repeat"], ["Entertainment", "movie-outline"], ["Travel", "airplane"],
    ["Childcare", "baby-carriage"], ["Fitness", "dumbbell"], ["Pets", "paw-outline"],
  ],
  accounts: [
    ["Debit card", "credit-card-outline"], ["Credit card", "credit-card-outline"],
    ["Savings account", "bank-outline"], ["Current account", "bank-outline"],
    ["Prepaid card", "wallet-membership"], ["Meal card", "silverware-fork-knife"], ["Pay later", "clock-outline"],
  ],
} as const;
export const SETUP_ICONS = [...new Set([...WORKSPACE_ICONS, ...options.categoryIcons, ...options.accountIcons,
  ...Object.values(DEFAULT_PRESETS).flatMap(items => items.map(item => item[1])),
  ...Object.values(EXTRA_PRESETS).flatMap(items => items.map(item => item[1]))])];

export function makePresets(kind: ChoiceKind): SetupChoice[] {
  const defaults = DEFAULT_PRESETS[kind].map(([name, icon], index) => ({ name, icon,
    color: kind === "accounts" ? (options.defaultAccountColors as Record<string, string>)[name.toLowerCase()] ?? SETUP_COLORS[index % SETUP_COLORS.length]
      : SETUP_COLORS[index % SETUP_COLORS.length], selected: kind !== "accounts" || index < 3 }));
  return [...defaults, ...EXTRA_PRESETS[kind].map(([name, icon], index) => ({
    name, icon, color: SETUP_COLORS[(defaults.length + index) % SETUP_COLORS.length], selected: false,
  }))];
}

export function restoreChoices(raw: unknown, kind: ChoiceKind): SetupChoice[] {
  const presets = makePresets(kind);
  if (!Array.isArray(raw)) return presets;
  const valid = raw.filter((item): item is SetupChoice => item && typeof item.name === "string"
    && item.name.trim().length > 0 && item.name.trim().length <= 40 && SETUP_ICONS.includes(item.icon)
    && SETUP_COLORS.includes(item.color) && typeof item.selected === "boolean");
  const merged = presets.map(item => valid.find(saved => saved.name.toLowerCase() === item.name.toLowerCase()) ?? item);
  for (const item of valid) {
    if (!merged.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) merged.push({ ...item, custom: true });
  }
  return merged;
}

/** A fresh default setup, independent of any partially edited onboarding draft. */
export function makeDefaultSetup(currency: { code: string; symbol: string; name: string }): OnboardingSetup {
  return { name: "Personal", icon: "account-outline", color: SETUP_COLORS[0],
    currencyCode: currency.code, currencySymbol: currency.symbol, currencyName: currency.name,
    incomeCategories: makePresets("income").filter(item => item.selected),
    expenseCategories: makePresets("expense").filter(item => item.selected),
    accounts: makePresets("accounts").filter(item => item.selected) };
}
