# Insights

The transaction shell mounts InsightsScreen in its topContent slot. The Home
tab shows a compact overview; the Insights tab expands the scrollable screen.

- calculations.ts contains pure period, currency, grouping and comparison functions.
- hooks/useInsights.ts reads the existing Redux data and owns period/currency selection.
- components/ contains reusable metrics and category sections.
- charts/ contains SVG cash-flow bars and the selectable daily heatmap.
- sheets/ contains transaction drill-down with the existing read-only transaction flow.
- Types.ts and Utils.ts also support the pre-existing quick-share and layout imports.

Calculations exclude deleted entries and never combine currencies. Missing
transaction currency falls back to the workspace currency. Drafts are stored
separately and are not inputs. Current-month totals stop at today. The optional
same-days comparison clamps to the preceding month's last day.

Net cash flow is income minus expenses, not a bank balance. Budget remaining is
the active workspace budget minus expenses. Historical budgets and income
targets are not stored, so the feature does not invent them. Budget comparison
is shown only for the current month in the workspace currency.

Run npm run test:analytics for the pure calculation regression tests.

Native QA: open Insights, switch months and currencies, compare categories,
open day/category/account details, view a transaction, and switch workspaces.
Check the shell gestures alongside scrolling, long labels, light/dark themes,
empty history and large amounts. No third-party chart package was added.
