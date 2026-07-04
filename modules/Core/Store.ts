import { configureStore } from "@reduxjs/toolkit";

import transactionsReducer, {
    fetchAccounts,
    fetchBudget,
    fetchCategories,
    fetchTransactions,
} from "./Slices/TransactionSlice";
import workspaceReducer, { fetchWorkspaces } from "./Slices/WorkspaceSlice";

export const store = configureStore({
  reducer: {
    transactions: transactionsReducer,
    workspace: workspaceReducer,
  },
});

// Initialize data from SQLite on store creation
if (store) {
  store.dispatch(fetchWorkspaces());
  store.dispatch(fetchTransactions());
  store.dispatch(fetchCategories("income"));
  store.dispatch(fetchCategories("expense"));
  store.dispatch(fetchAccounts());
  store.dispatch(fetchBudget());
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
