import type { ShellTab } from "@/components/AppShellContext";
export type TourTarget = "overview" | "entry-controls" | "transaction-heading" | "insights-controls" | "settings-management";
export type TourStep = { page: ShellTab | "settings"; target: TourTarget; title: string; description: string; points: string[] };
export const TOUR_STEPS: TourStep[] = [
  { page: "transactions", target: "overview", title: "Home: your month at a glance", description: "Keep the big picture in view while you record the day to day.",
    points: ["Balance, Income and Spent summarise the selected month.", "Use the navigation bar to open your full timeline or Insights."] },
  { page: "transactions", target: "overview", title: "Move around Tally", description: "Home keeps the essentials close while Transactions has the full ledger tools.",
    points: ["Use Transactions for adding, finding and organising entries.", "Budget and workspace options are available in Settings."] },
  { page: "calendar", target: "transaction-heading", title: "Transactions: every entry", description: "This view gives your timeline more room.",
    points: ["Entries are grouped by day. Tap an entry to view or edit it.", "The controls above sort, filter and search your records."] },
  { page: "insights", target: "overview", title: "Insights: understand your month", description: "Categories, accounts and daily activity take shape as you record entries.",
    points: ["Tap a category, account or day to explore its transactions.", "Use the month selector at the top to revisit earlier months."] },
  { page: "insights", target: "insights-controls", title: "Explore another month", description: "Use the header to move between periods and Settings.",
    points: ["The month selector opens your recorded periods.", "Currency selection is available when you have entries in multiple currencies."] },
  { page: "settings", target: "settings-management", title: "Settings: make Tally yours", description: "Your setup can change whenever your needs do.",
    points: ["Workspaces: separate sets of records.", "Categories & Accounts: what it was for and how you paid.", "Budget & Defaults: spending limits and quicker entry.", "Data: backups. Preferences: looks, reminders and security."] },
];
export type SpotlightRect = { x: number; y: number; width: number; height: number };
export function fitSpotlightRect(rect: SpotlightRect, width: number, height: number): SpotlightRect {
  const x = Math.max(4, rect.x - 6);
  const y = Math.max(0, rect.y - 6);
  return { x, y, width: Math.max(0, Math.min(width - x - 4, rect.width + 12)), height: Math.max(0, Math.min(height - y, rect.height + 12)) };
}
export function tooltipTop(rect: SpotlightRect | null, height: number, topInset: number, bottomInset: number, cardHeight: number) {
  const min = topInset + 12;
  const max = Math.max(min, height - bottomInset - cardHeight - 12);
  if (!rect) return Math.max(min, Math.min(max, (height - cardHeight) / 2));
  const below = rect.y + rect.height + 16;
  const above = rect.y - cardHeight - 16;
  const belowRoom = height - bottomInset - below - 12;
  const aboveRoom = rect.y - min - 16;
  const desired = belowRoom >= cardHeight ? below : aboveRoom >= cardHeight ? above : belowRoom >= aboveRoom ? below : above;
  return Math.max(min, Math.min(max, desired));
}
