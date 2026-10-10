# Tally insights proposal

The screen should answer three questions in order: What have I spent? Where did it go? What changed? Keep the answer understandable before someone taps anything. Extra detail belongs one tap away, with the original recorded entries available to explain each total.

## What the code already supports

- `modules/Core/DB/Schema.ts` and `utils/Types.ts` store dated income and expense entries, categories, payment accounts, currencies, notes, tags, and workspaces. Budgets are current workspace settings, with optional category allocations.
- `modules/Insights/calculations.ts` already provides monthly totals, category breakdowns, previous-period comparisons, six months of income and spending, daily activity, and activity by account. Deleted entries and future entries in the selected current month are excluded, and currencies are separated.
- `modules/Insights/hooks/useInsights.ts` already compares the current month with the same elapsed dates last month. Completed months use full-month comparisons. Budget comparisons are restricted to the current month and workspace currency.
- The existing `CategorySection` already shows three categories before expanding. This is a useful starting point.
- The 10 existing analytics tests passed on 2 October 2026 with `npm run test:analytics`. The native app itself was not run for this review.

## Recommended first screen

1. **Month and date range.** A familiar previous/next month control. During the current month, state the actual range, such as “1–2 October.” Currency appears only when necessary; retain separate totals for each currency.
2. **One prominent total: “Spent this month.”** Keep this headline consistent whether or not income or budgets are recorded. Beneath it, explain the difference in currency: “₹1,400 less than last month.” State the comparison dates immediately below. A lower total alone does not justify “doing well.”
3. **Optional monthly budget.** Below the spending total, show “Remaining budget ₹11,600,” a single progress bar, and “₹18,400 spent of ₹30,000 budget.” If exceeded, show “₹1,400 over budget.” This is a spending limit comparison, not money available in a bank account or a safe-to-spend recommendation. Omit it when no budget exists or the selected period/currency cannot be compared reliably.
4. **“Where it went.”** Three largest categories, each with its name, exact amount, and a visible way to open details. Offer “See all categories.” Short bars can help compare sizes, but names and amounts must explain the section without them. Keep zero-spend categories out of the default ranking; they may still appear in comparison details.
5. **“What changed.”** One factual sentence about the largest category change in currency, using the same comparison window. For example: “Groceries were ₹1,200 lower. This was the biggest change in your spending.” A relevant budget overrun can take priority. Avoid filling the screen with small changes, percentages, scores, or invented advice. Omit comparisons when there are no earlier recorded entries; absence of entries does not establish zero actual spending.

## Information available on demand

- **Category detail:** category total, one comparison sentence and its date range, optional applicable category budget, then the recorded entries. Add historical detail behind a disclosure rather than presenting the current nine-metric grid before the entries.
- **Income and spending:** recorded income, recorded spending, and “Income minus spending.” If no income is recorded, say that directly. Do not imply zero earnings or a financial shortfall.
- **Past months:** start with directly labelled spending bars or a short monthly list. Mark the current month “so far”; avoid comparing it visually with completed months as if all periods were complete. The preview shows only prior completed months here. A two-series income/expense chart can be an optional later detail.
- **Spent using:** amounts spent through Cash, Card, UPI, or other user-defined accounts. These are payment activity totals, not account balances.
- **Income sources:** useful within income detail, especially for pension, salary, interest, or multiple sources. It need not occupy the initial screen alongside the spending breakdown.

## Boundaries to preserve

The schema has no opening balances, dedicated transfers, scheduled bills, recurring-payment model, savings goals, or budget history. Avoid account balances, net worth, upcoming-bill predictions, subscription detection, historical budget adherence, or guaranteed end-of-month estimates until the required data exists. Transaction titles are user-written, so merchant matching is not reliable by default.

Manual entry can be incomplete. Use “Based on the entries you recorded” and qualify comparisons as recorded spending. Never equate an empty month with actual zero spending or claim to know that the user has entered everything. A first-use state should say “No entries recorded for this month,” with a clear add-entry action, and show neither trend claims nor alarming deficits.

Budget allocations and budget remaining are different quantities: `selectBudgetSummary.remaining` means overall budget minus category allocations; insights remaining means overall budget minus spending. Use distinct labels. Reuse the insights calculation path in budget screens so date cutoffs, amount normalization, and currency handling agree.

## Readability and validation

Use a readable sans-serif, roughly 17–18 pt body text as an initial design choice, generous spacing, and touch targets around 48 logical pixels. Support device text scaling and wrapping; do not truncate category names or squeeze values into smaller text. Keep strong contrast, visible action labels, and text explanations alongside status colors. These choices follow the concerns in [W3C guidance for older users](https://www.w3.org/WAI/older-users/developing/); the proposed text size and touch size are design choices, not claims of a mandatory standard.

Validate the design with a few intended users: ask them to find what they spent, their largest category, whether spending changed, what the budget number means, and the entries behind a category total. Watch whether they can answer without coaching. Also check large text, a first month with no history, spending-only entry, missing income, a budget overrun, long names, large amounts, and multiple currencies.

## Smallest implementation

Refine the existing `InsightsScreen`, `CategorySection`, and `DetailsSheet`; retain the calculation module and add plain-language comparison selection. Move the two-series chart and income sources behind disclosures. No new analytics library, remote service, or AI model is needed for this first version.

The accompanying interactive proposal uses illustrative INR entries. It does not read or modify the user's financial records. Month navigation, category details, disclosures, and design options demonstrate the proposed behavior.

The app implementation now uses its existing Paper theme, Switzer typography, cards, and transaction sheets. Spending leads the summary; income, history, daily activity, and payment accounts use disclosures. Category comparisons use currency differences and explicit date windows. Missing entries are distinguished from recorded zero, category overruns take priority, and Home stays on the current month while Insights preserves historical selections. Verification includes 18 analytics tests, Insights ESLint, and an iOS production bundle. The full TypeScript check still reports the same pre-existing errors outside Insights. A native visual check was attempted but the configured Xcode location has no Simulator app, so on-device appearance remains to be checked.
