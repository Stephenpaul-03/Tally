import { notifyRecurring } from "@/modules/Recurring/events";
import { notificationStorage } from "@/src/services/notifications/notification.storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  workspaceRepository,
  getActiveWorkspaceId,
} from "@/modules/Core/Repository/Index";
import { GOALS_KEY, loadGoals, refreshGoals } from "@/modules/Goals/store";
import { store } from "@/modules/Core/Store";
import {
  fetchAccounts,
  fetchBudget,
  fetchCategories,
  fetchTransactions,
  restoreDrafts,
} from "@/modules/Core/Slices/TransactionSlice";
import {
  fetchWorkspaces,
  switchWorkspaceAndReload,
} from "@/modules/Core/Slices/WorkspaceSlice";
import { PREFERENCE_KEYS, validateBackup, type AppBackup } from "./model";
export async function collectAppBackup(): Promise<AppBackup> {
  await loadGoals();
  const database = await workspaceRepository.getDatabaseBackup();
  const preferences = Object.fromEntries(
    (
      await AsyncStorage.multiGet([
        ...PREFERENCE_KEYS,
        "tallyWorkspaceDefaults",
      ])
    ).filter((entry): entry is [string, string] => entry[1] !== null),
  );
  return {
    format: "tally-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    activeWorkspaceId: getActiveWorkspaceId(),
    sections: [
      "transactions",
      "catalogs",
      "budgets",
      "goals",
      "recurring",
      "workspaces",
      "preferences",
      "drafts",
    ],
    database,
    preferences,
    reminders: {
      daily: notificationStorage.getDailyFinanceReminder().config,
      monthly: notificationStorage.getMonthlyInsightPrompt().config,
    },
    goals: JSON.parse((await AsyncStorage.getItem(GOALS_KEY)) || "[]").filter(
      (goal: { workspaceId: string }) =>
        database.workspaces.some((w) => w.id === goal.workspaceId),
    ),
    drafts: {
      workspaceId: getActiveWorkspaceId(),
      entries: store.getState().transactions.transactionDrafts || [],
    },
  };
}
export async function restoreAppBackup(raw: unknown) {
  const backup = validateBackup(raw);
  const entries: [string, string][] = Object.entries(backup.preferences);
  if (backup.goals) {
    await loadGoals();
    const existing = JSON.parse(
      (await AsyncStorage.getItem(GOALS_KEY)) || "[]",
    );
    const merged = new Map(existing.map((goal: any) => [goal.id, goal]));
    backup.goals.forEach((goal) => merged.set(goal.id, goal));
    entries.push([GOALS_KEY, JSON.stringify([...merged.values()])]);
  }
  const previous = await AsyncStorage.multiGet(entries.map(([key]) => key));
  try {
    if (entries.length) await AsyncStorage.multiSet(entries);
    await workspaceRepository.restoreAppDatabase(backup.database, {
      workspaces: backup.sections.includes("workspaces"),
      catalogs: backup.sections.includes("catalogs"),
    });
  } catch (error) {
    await AsyncStorage.multiSet(
      previous.filter((entry): entry is [string, string] => entry[1] !== null),
    );
    await AsyncStorage.multiRemove(
      previous.filter(([, value]) => value === null).map(([key]) => key),
    );
    throw error;
  }
  if (backup.reminders) {
    notificationStorage.setDailyFinanceReminder({
      config: backup.reminders.daily,
      schedule: notificationStorage.getDailyFinanceReminder().schedule,
    });
    notificationStorage.setMonthlyInsightPrompt({
      config: backup.reminders.monthly,
      schedule: notificationStorage.getMonthlyInsightPrompt().schedule,
    });
  }
  // The data is committed. Refresh errors must not be reported as a failed import.
  try {
    notifyRecurring();
    await refreshGoals();
    await store.dispatch(fetchWorkspaces()).unwrap();
    if (backup.activeWorkspaceId)
      await store.dispatch(switchWorkspaceAndReload(backup.activeWorkspaceId));
    if (backup.drafts) {
      if (getActiveWorkspaceId() !== backup.drafts.workspaceId)
        await store.dispatch(
          switchWorkspaceAndReload(backup.drafts.workspaceId),
        );
      store.dispatch(restoreDrafts(backup.drafts.entries));
    }
    await Promise.all([
      store.dispatch(fetchTransactions()).unwrap(),
      store.dispatch(fetchAccounts()).unwrap(),
      store.dispatch(fetchCategories("income")).unwrap(),
      store.dispatch(fetchCategories("expense")).unwrap(),
      store.dispatch(fetchBudget()).unwrap(),
    ]);
  } catch {
    throw Error("Backup restored. Reopen Tally to refresh the restored data.");
  }
}
