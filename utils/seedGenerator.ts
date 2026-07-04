import { addTransactionAsync } from "@/modules/Core/Slices/TransactionSlice";
import { AppDispatch } from "@/modules/Core/Store";
import type { TransactionFormData } from "@/utils/Types";

// ─── Enums & primitives ───────────────────────────────────────────────────────

export type SeedDensity = "light" | "moderate" | "heavy";
export type AmountVariance = "tight" | "medium" | "wide";
export type IncomeFrequency = "weekly" | "biweekly" | "monthly" | "irregular";
export type ExpenseSkew = "balanced" | "start-heavy" | "end-heavy" | "random";
export type Lifestyle = "student" | "salaried" | "freelancer" | "retiree";

// ─── Category & account config ────────────────────────────────────────────────

export type CategoryConfig = {
  name: string;
  type: "income" | "expense";
  enabled: boolean;
  /** Relative weight vs other categories of same type. Default 1. */
  weight: number;
  /** Override global min/max for this category. Null = use global. */
  amountRange: { min: number; max: number } | null;
  /** If true, amount stays the same every occurrence (like rent/subscriptions). */
  isRecurring: boolean;
  /** Fixed amount used when isRecurring = true. */
  recurringAmount: number | null;
};

export type AccountConfig = {
  name: string;
  /** 0–100, will be normalised to a probability. */
  weight: number;
};

// ─── Core SeedConfig ──────────────────────────────────────────────────────────

export type SeedConfig = {
  // ── Date range ──────────────────────────────────────────────────────────────
  dateRange: { from: string; to: string }; // ISO "YYYY-MM-DD"

  // ── Category & account ──────────────────────────────────────────────────────
  categories: CategoryConfig[];
  accounts: AccountConfig[];

  // ── Income ──────────────────────────────────────────────────────────────────
  includeIncome: boolean;
  incomeFrequency: IncomeFrequency;
  /** Which day(s) of month salary lands on. Used when frequency = biweekly/monthly. */
  payDays: number[];
  /** Salary varies slightly each occurrence rather than exact same amount. */
  salaryJitter: boolean;
  /** One random month in range gets an extra lump-sum (bonus / 13th month). */
  bonusMonth: boolean;
  bonusAmountRange: { min: number; max: number };

  // ── Spending patterns ────────────────────────────────────────────────────────
  density: SeedDensity;
  transactionsPerDay: { min: number; max: number };
  expenseSkew: ExpenseSkew;
  weekendMultiplier: number; // 1.0 = no change, 1.5 = 50% higher on weekends
  missedDayProbability: number; // 0–1, chance a day has zero transactions
  burstDayProbability: number;  // 0–1, chance of an unusually high-spend day
  burstMultiplier: number;       // amount multiplier on burst days

  // ── Amount realism ───────────────────────────────────────────────────────────
  globalAmountRange: { min: number; max: number };
  amountVariance: AmountVariance;
  roundNumberBias: number;  // 0–1, chance an amount is rounded to nearest 50/100
  inflationDrift: number;   // % increase per month over date range (e.g. 0.02 = 2%)

  // ── Realism extras ───────────────────────────────────────────────────────────
  anomalyRate: number;        // 0–1, chance any transaction is an outlier (10x amount)
  merchantRepetition: boolean; // reuse the same merchant names realistically
  splitTransactionProbability: number; // 0–1, chance an expense is split into 2–3 entries

  // ── Meta ─────────────────────────────────────────────────────────────────────
  randomSeed: number | null; // null = truly random each time
  locale: "en-IN" | "en-US";
};

// ─── Lifestyle presets ────────────────────────────────────────────────────────

export const LIFESTYLE_PRESETS: Record<Lifestyle, Partial<SeedConfig>> = {
  student: {
    density: "light",
    incomeFrequency: "monthly",
    payDays: [1],
    salaryJitter: false,
    bonusMonth: false,
    expenseSkew: "start-heavy",
    weekendMultiplier: 1.4,
    globalAmountRange: { min: 50, max: 800 },
    amountVariance: "wide",
    transactionsPerDay: { min: 1, max: 3 },
    missedDayProbability: 0.2,
    burstDayProbability: 0.05,
    burstMultiplier: 2,
    roundNumberBias: 0.3,
  },
  salaried: {
    density: "moderate",
    incomeFrequency: "biweekly",
    payDays: [10, 25],
    salaryJitter: true,
    bonusMonth: true,
    expenseSkew: "end-heavy",
    weekendMultiplier: 1.3,
    globalAmountRange: { min: 100, max: 5000 },
    amountVariance: "medium",
    transactionsPerDay: { min: 2, max: 5 },
    missedDayProbability: 0.1,
    burstDayProbability: 0.08,
    burstMultiplier: 3,
    roundNumberBias: 0.5,
  },
  freelancer: {
    density: "moderate",
    incomeFrequency: "irregular",
    payDays: [],
    salaryJitter: true,
    bonusMonth: false,
    expenseSkew: "random",
    weekendMultiplier: 1.0,
    globalAmountRange: { min: 200, max: 20000 },
    amountVariance: "wide",
    transactionsPerDay: { min: 1, max: 4 },
    missedDayProbability: 0.15,
    burstDayProbability: 0.12,
    burstMultiplier: 4,
    roundNumberBias: 0.2,
  },
  retiree: {
    density: "light",
    incomeFrequency: "monthly",
    payDays: [1],
    salaryJitter: false,
    bonusMonth: false,
    expenseSkew: "balanced",
    weekendMultiplier: 1.1,
    globalAmountRange: { min: 100, max: 3000 },
    amountVariance: "tight",
    transactionsPerDay: { min: 1, max: 3 },
    missedDayProbability: 0.05,
    burstDayProbability: 0.03,
    burstMultiplier: 1.5,
    roundNumberBias: 0.7,
  },
};

// ─── Default config ───────────────────────────────────────────────────────────

const today = new Date();
const threeMonthsAgo = new Date(today);
threeMonthsAgo.setMonth(today.getMonth() - 3);

export const DEFAULT_SEED_CONFIG: SeedConfig = {
  dateRange: {
    from: threeMonthsAgo.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  },
  categories: [],  // populated at runtime from user's category list
  accounts: [],    // populated at runtime from user's account list
  includeIncome: true,
  incomeFrequency: "biweekly",
  payDays: [10, 25],
  salaryJitter: true,
  bonusMonth: false,
  bonusAmountRange: { min: 10000, max: 50000 },
  density: "moderate",
  transactionsPerDay: { min: 2, max: 5 },
  expenseSkew: "end-heavy",
  weekendMultiplier: 1.3,
  missedDayProbability: 0.1,
  burstDayProbability: 0.08,
  burstMultiplier: 3,
  globalAmountRange: { min: 100, max: 5000 },
  amountVariance: "medium",
  roundNumberBias: 0.5,
  inflationDrift: 0.01,
  anomalyRate: 0.02,
  merchantRepetition: true,
  splitTransactionProbability: 0.05,
  randomSeed: null,
  locale: "en-IN",
};

// ─── Merchant name pools ──────────────────────────────────────────────────────

const MERCHANT_POOLS: Record<string, Record<"en-IN" | "en-US", string[]>> = {
  "Food & Dining": {
    "en-IN": ["Swiggy", "Zomato", "Domino's", "McDonald's", "Haldiram's", "Café Coffee Day", "Starbucks", "Biryani Blues", "Paradise Restaurant", "Saravana Bhavan"],
    "en-US": ["DoorDash", "Uber Eats", "Chipotle", "McDonald's", "Starbucks", "Panera Bread", "Olive Garden", "Chick-fil-A", "Subway", "Domino's"],
  },
  "Transportation": {
    "en-IN": ["Ola", "Uber", "Rapido", "BMTC", "Metro Card", "Indian Oil", "HP Petrol", "Shell"],
    "en-US": ["Uber", "Lyft", "Shell", "BP", "Chevron", "ExxonMobil", "Metro Transit", "MTA"],
  },
  "Shopping": {
    "en-IN": ["Amazon", "Flipkart", "Myntra", "Meesho", "Reliance Fresh", "DMart", "BigBasket", "Nykaa"],
    "en-US": ["Amazon", "Target", "Walmart", "Costco", "Best Buy", "Home Depot", "Macy's", "Nordstrom"],
  },
  "Bills & Utilities": {
    "en-IN": ["BESCOM", "Airtel", "Jio", "BWSSB", "Netflix", "Amazon Prime", "Hotstar", "Tata Sky"],
    "en-US": ["AT&T", "Verizon", "Comcast", "Netflix", "Spotify", "PG&E", "Con Edison", "T-Mobile"],
  },
  "Entertainment": {
    "en-IN": ["PVR Cinemas", "INOX", "BookMyShow", "PlayStation Store", "Steam", "Spotify"],
    "en-US": ["AMC Theatres", "Regal Cinemas", "Ticketmaster", "PlayStation Store", "Steam", "Spotify"],
  },
  "Healthcare": {
    "en-IN": ["Apollo Pharmacy", "MedPlus", "Practo", "1mg", "Max Healthcare", "Fortis"],
    "en-US": ["CVS Pharmacy", "Walgreens", "UnitedHealth", "Kaiser Permanente", "Rite Aid"],
  },
  "Education": {
    "en-IN": ["Coursera", "Udemy", "BYJU'S", "Unacademy", "Vedantu", "upGrad"],
    "en-US": ["Coursera", "Udemy", "Chegg", "Khan Academy Plus", "LinkedIn Learning"],
  },
  "Travel": {
    "en-IN": ["MakeMyTrip", "Goibibo", "IRCTC", "Air India", "IndiGo", "Oyo Rooms"],
    "en-US": ["Expedia", "Booking.com", "Delta Airlines", "United Airlines", "Marriott", "Airbnb"],
  },
  "Salary": {
    "en-IN": ["Employer Payroll", "Salary Credit"],
    "en-US": ["Employer Payroll", "Direct Deposit"],
  },
  "Freelance": {
    "en-IN": ["Upwork", "Fiverr", "Toptal", "Client Payment", "Direct Transfer"],
    "en-US": ["Upwork", "Fiverr", "Toptal", "Client Payment", "Wire Transfer"],
  },
  "Investments": {
    "en-IN": ["Zerodha", "Groww", "Kuvera", "HDFC Securities", "Dividend Credit"],
    "en-US": ["Fidelity", "Vanguard", "Charles Schwab", "Robinhood", "Dividend Credit"],
  },
};

const DEFAULT_MERCHANTS: Record<"en-IN" | "en-US", string[]> = {
  "en-IN": ["Local Store", "Kirana Shop", "General Merchant", "Online Store"],
  "en-US": ["Local Store", "Corner Shop", "General Merchant", "Online Store"],
};

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────

function makePRNG(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateTestTransactions(config: SeedConfig): TransactionFormData[] {
  const rng = config.randomSeed !== null ? makePRNG(config.randomSeed) : Math.random;

  const randFloat = (min: number, max: number) => min + rng() * (max - min);
  const randInt = (min: number, max: number) => Math.floor(randFloat(min, max + 1));
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  // Variance multiplier: affects how wide the random range is
  const varianceMap: Record<AmountVariance, [number, number]> = {
    tight: [0.8, 1.0],
    medium: [0.4, 1.0],
    wide: [0.1, 1.0],
  };
  const [vMin, vMax] = varianceMap[config.amountVariance];

  function makeAmount(min: number, max: number, monthIndex: number): number {
    const drift = Math.pow(1 + config.inflationDrift, monthIndex);
    const lo = min + (max - min) * vMin;
    const hi = min + (max - min) * vMax;
    let amount = randFloat(lo, hi) * drift;
    // Round number bias
    if (rng() < config.roundNumberBias) {
      amount = Math.round(amount / 50) * 50;
    }
    return Math.round(amount * 100) / 100;
  }

  function getMerchant(categoryName: string): string {
    if (!config.merchantRepetition) return categoryName;
    const pool = MERCHANT_POOLS[categoryName]?.[config.locale] ?? DEFAULT_MERCHANTS[config.locale];
    return pick(pool);
  }

  // Weighted random pick
  function weightedPick<T extends { weight: number }>(items: T[]): T {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = rng() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }

  // Normalise account weights to probabilities
  const enabledAccounts = config.accounts.filter((a) => a.weight > 0);
  function pickAccount(): string {
    if (enabledAccounts.length === 0) return "Cash";
    return weightedPick(enabledAccounts).name;
  }

  const expenseCategories = config.categories.filter((c) => c.type === "expense" && c.enabled);
  const incomeCategories = config.categories.filter((c) => c.type === "income" && c.enabled);

  const transactions: TransactionFormData[] = [];

  // Build list of dates in range
  const fromDate = new Date(config.dateRange.from);
  const toDate = new Date(config.dateRange.to);
  const totalMonths =
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
    (toDate.getMonth() - fromDate.getMonth());

  // Bonus month: pick one random month index in range
  const bonusMonthIndex = config.bonusMonth ? randInt(0, Math.max(totalMonths, 0)) : -1;

  // Iterate day by day
  let monthIndex = 0;
  let prevMonth = fromDate.getMonth();
  const cursor = new Date(fromDate);

  while (cursor <= toDate) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const day = cursor.getDate();
    const dow = cursor.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dow === 0 || dow === 6;
    const dateStr = cursor.toISOString().split("T")[0];

    // Track month transitions for inflation drift
    if (month !== prevMonth) {
      monthIndex++;
      prevMonth = month;
    }

    // Missed day
    if (rng() < config.missedDayProbability) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    // Burst day multiplier
    const isBurst = rng() < config.burstDayProbability;
    const burstMult = isBurst ? config.burstMultiplier : 1;

    // Skew: probability of spending on this day
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayFraction = day / daysInMonth;
    let skewProb = 1.0;
    if (config.expenseSkew === "start-heavy") skewProb = 1.5 - dayFraction;
    else if (config.expenseSkew === "end-heavy") skewProb = 0.5 + dayFraction;
    else if (config.expenseSkew === "random") skewProb = rng() * 1.5;
    // balanced = 1.0 always

    if (rng() > skewProb) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    // Weekend multiplier applied to transaction count
    const weekendMult = isWeekend ? config.weekendMultiplier : 1.0;
    const txCount = Math.round(
      randInt(config.transactionsPerDay.min, config.transactionsPerDay.max) * weekendMult
    );

    for (let t = 0; t < txCount; t++) {
      if (expenseCategories.length === 0) break;

      const cat = weightedPick(expenseCategories);
      let amount: number;

      if (cat.isRecurring && cat.recurringAmount !== null) {
        amount = cat.recurringAmount;
      } else {
        const range = cat.amountRange ?? config.globalAmountRange;
        amount = makeAmount(range.min, range.max, monthIndex) * burstMult;
      }

      // Anomaly
      if (rng() < config.anomalyRate) {
        amount = amount * (5 + rng() * 10);
      }

      const title = getMerchant(cat.name);

      // Split transaction
      if (rng() < config.splitTransactionProbability) {
        const parts = randInt(2, 3);
        for (let p = 0; p < parts; p++) {
          transactions.push({
            title: `${title} (split ${p + 1}/${parts})`,
            date: dateStr,
            amount: Math.round((amount / parts) * 100) / 100,
            type: "expense",
            category: cat.name,
            account: pickAccount(),
          });
        }
      } else {
        transactions.push({
          title,
          date: dateStr,
          amount: Math.round(amount * 100) / 100,
          type: "expense",
          category: cat.name,
          account: pickAccount(),
        });
      }
    }

    // ── Income ───────────────────────────────────────────────────────────────
    if (config.includeIncome && incomeCategories.length > 0) {
      const shouldAddIncome = (() => {
        if (config.incomeFrequency === "weekly") return dow === 5; // Friday
        if (config.incomeFrequency === "biweekly") return config.payDays.includes(day);
        if (config.incomeFrequency === "monthly") return config.payDays.includes(day);
        if (config.incomeFrequency === "irregular") return rng() < 0.03; // ~once/month
        return false;
      })();

      if (shouldAddIncome) {
        const incomeCat = weightedPick(incomeCategories);
        const range = incomeCat.amountRange ?? config.globalAmountRange;
        let amount = makeAmount(range.min, range.max, monthIndex);

        if (config.salaryJitter) {
          amount = amount * (0.92 + rng() * 0.16); // ±8%
        }

        transactions.push({
          title: getMerchant(incomeCat.name),
          date: dateStr,
          amount: Math.round(amount * 100) / 100,
          type: "income",
          category: incomeCat.name,
          account: pickAccount(),
        });
      }

      // Bonus month lump sum
      if (monthIndex === bonusMonthIndex && day === 1) {
        const bonusCat = incomeCategories[0];
        transactions.push({
          title: config.locale === "en-IN" ? "Annual Bonus" : "Year-End Bonus",
          date: dateStr,
          amount: makeAmount(config.bonusAmountRange.min, config.bonusAmountRange.max, monthIndex),
          type: "income",
          category: bonusCat.name,
          account: pickAccount(),
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return transactions;
}

// ─── Seed dispatcher ──────────────────────────────────────────────────────────

export async function seedTestData(
  dispatch: AppDispatch,
  config: SeedConfig
): Promise<void> {
  const data = generateTestTransactions(config);
  for (const tx of data) {
    await dispatch(addTransactionAsync(tx));
  }
  dispatch({ type: "filters/setDatePreset", payload: "all" } as any);
  dispatch({ type: "filters/resetDateRange" } as any);
}

// ─── Helper: build config from user's categories & accounts ──────────────────

export function buildCategoryConfigs(
  userCategories: { name: string; type: "income" | "expense" }[]
): CategoryConfig[] {
  return userCategories.map((c) => ({
    name: c.name,
    type: c.type,
    enabled: true,
    weight: 1,
    amountRange: null,
    isRecurring: false,
    recurringAmount: null,
  }));
}

export function buildAccountConfigs(userAccounts: { name: string }[]): AccountConfig[] {
  return userAccounts.map((a) => ({ name: a.name, weight: 1 }));
}

export function applyLifestylePreset(
  config: SeedConfig,
  lifestyle: Lifestyle
): SeedConfig {
  return { ...config, ...LIFESTYLE_PRESETS[lifestyle] };
}