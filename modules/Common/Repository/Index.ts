import {
  DEFAULT_WORKSPACE_ID,
  SQLiteFinanceRepository,
  SQLiteWorkspaceRepository,
} from "./SQLiteRepo";
import type { FinanceRepository } from "./Interface";

let activeWorkspaceId = DEFAULT_WORKSPACE_ID;
let activeRepository = new SQLiteFinanceRepository(activeWorkspaceId);

export function switchWorkspace(workspaceId: string) {
  activeWorkspaceId = workspaceId;
  activeRepository = new SQLiteFinanceRepository(activeWorkspaceId);
}

export function getActiveWorkspaceId() {
  return activeWorkspaceId;
}

export const workspaceRepository = new SQLiteWorkspaceRepository();

export const financeRepository = new Proxy({} as FinanceRepository, {
  get(_target, prop: keyof FinanceRepository) {
    const value = activeRepository[prop];
    return typeof value === "function" ? value.bind(activeRepository) : value;
  },
});
