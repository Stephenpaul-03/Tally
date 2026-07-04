import {
    addAccountAsync,
    addCategoryAsync,
    fetchAccounts,
    fetchCategories,
    fetchTransactions,
} from "@/modules/Core/Slices/TransactionSlice";
import {
    createWorkspaceAndSwitch,
    deleteWorkspaceAsync,
    fetchWorkspaces,
} from "@/modules/Core/Slices/WorkspaceSlice";
import type { AppDispatch } from "@/modules/Core/Store";
import type { TransactionType } from "@/utils/Types";
import type { OnboardingDraft, StarterPill } from "./Types";

type StarterCategory = {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
};

const DEFAULT_SEEDED_WORKSPACE_IDS = ["personal", "family"] as const;

function toCategory(type: TransactionType, pill: StarterPill): StarterCategory {
  return { ...pill, type };
}

export async function completeSimpleSetup(
  dispatch: AppDispatch,
  draft: OnboardingDraft,
) {
  const dispatchAny = dispatch as any;
  const workspace = await dispatchAny(
    createWorkspaceAndSwitch({
      name: draft.workspaceName,
      icon: draft.workspaceIcon,
      color: draft.workspaceColor,
      ownerName: draft.workspaceOwnerName,
      currencyCode: draft.workspaceCurrencyCode,
      currencySymbol: draft.workspaceCurrencySymbol,
      currencyName: draft.workspaceCurrencyName,
      seedDefaults: false,
    }),
  );

  const workspaces = await dispatch(fetchWorkspaces()).unwrap();
  const workspaceIds = new Set(workspaces.map((item) => item.id));

  for (const workspaceId of DEFAULT_SEEDED_WORKSPACE_IDS) {
    if (workspaceId === workspace.id || !workspaceIds.has(workspaceId)) {
      continue;
    }
    await dispatch(deleteWorkspaceAsync(workspaceId)).unwrap();
  }

  await dispatch(fetchWorkspaces()).unwrap();

  const categories = [
    ...draft.quickStart.income.map((pill) => toCategory("income", pill)),
    ...draft.quickStart.expense.map((pill) => toCategory("expense", pill)),
  ];

  for (const category of categories) {
    await dispatch(addCategoryAsync(category)).unwrap();
  }

  for (const account of draft.quickStart.accounts) {
    await dispatch(addAccountAsync(account)).unwrap();
  }

  await Promise.all([
    dispatch(fetchTransactions()).unwrap(),
    dispatch(fetchCategories("income")).unwrap(),
    dispatch(fetchCategories("expense")).unwrap(),
    dispatch(fetchAccounts()).unwrap(),
  ]);
}
