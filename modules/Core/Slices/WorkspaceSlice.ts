import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import {
  getActiveWorkspaceId,
  switchWorkspace,
  workspaceRepository,
} from "../Repository/Index";
import {
  DEFAULT_WORKSPACE_ID,
  type Workspace,
  type WorkspaceInput,
} from "../Repository/SQLiteRepo";
import {
  fetchAccounts,
  fetchBudget,
  fetchCategories,
  fetchTransactions,
} from "./TransactionSlice";

export interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  activeWorkspaceId: getActiveWorkspaceId() || DEFAULT_WORKSPACE_ID,
  isLoading: false,
  error: null,
};

const reloadWorkspaceData = async (dispatch: any) => {
  await Promise.all([
    dispatch(fetchTransactions()),
    dispatch(fetchCategories("income")),
    dispatch(fetchCategories("expense")),
    dispatch(fetchAccounts()),
    dispatch(fetchBudget()),
  ]);
};

export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  async () => workspaceRepository.getWorkspaces(),
);

export const createWorkspaceAsync = createAsyncThunk(
  "workspace/createWorkspace",
  async (input: WorkspaceInput) => workspaceRepository.createWorkspace(input),
);

export const updateWorkspaceAsync = createAsyncThunk(
  "workspace/updateWorkspace",
  async ({ id, data }: { id: string; data: Partial<WorkspaceInput> }) =>
    workspaceRepository.updateWorkspace(id, data),
);

export const deleteWorkspaceAsync = createAsyncThunk(
  "workspace/deleteWorkspace",
  async (id: string, { getState, rejectWithValue }) => {
    const state = getState() as { workspace: WorkspaceState };
    if (state.workspace.workspaces.length <= 1) {
      return rejectWithValue("Tally needs at least one workspace.");
    }
    await workspaceRepository.deleteWorkspace(id);
    return id;
  },
);

export const switchWorkspaceAndReload =
  (workspaceId: string) => async (dispatch: any) => {
    dispatch(setActiveWorkspace(workspaceId));
    await workspaceRepository.markWorkspaceUsed(workspaceId);
    await dispatch(fetchWorkspaces());
    await reloadWorkspaceData(dispatch);
  };

export const createWorkspaceAndSwitch =
  (input: WorkspaceInput) => async (dispatch: any) => {
    const result = await dispatch(createWorkspaceAsync(input));
    if (!createWorkspaceAsync.fulfilled.match(result)) {
      throw new Error(result.payload || result.error?.message);
    }
    await dispatch(switchWorkspaceAndReload(result.payload.id));
    return result.payload as Workspace;
  };

export const deleteWorkspaceAndReload =
  (workspaceId: string) => async (dispatch: any, getState: any) => {
    const state = getState() as { workspace: WorkspaceState };
    const remaining = state.workspace.workspaces.filter(
      (workspace) => workspace.id !== workspaceId,
    );
    if (remaining.length === 0) {
      throw new Error("Tally needs at least one workspace.");
    }

    const deletingActive = state.workspace.activeWorkspaceId === workspaceId;
    const nextWorkspaceId = deletingActive
      ? remaining[0].id
      : state.workspace.activeWorkspaceId;

    const result = await dispatch(deleteWorkspaceAsync(workspaceId));
    if (!deleteWorkspaceAsync.fulfilled.match(result)) {
      throw new Error(result.payload || result.error?.message);
    }

    if (deletingActive) {
      await dispatch(switchWorkspaceAndReload(nextWorkspaceId));
    } else {
      await dispatch(fetchWorkspaces());
    }
  };

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setActiveWorkspace: {
      reducer: (state, action: PayloadAction<string>) => {
        state.activeWorkspaceId = action.payload;
      },
      prepare: (workspaceId: string) => {
        switchWorkspace(workspaceId);
        return { payload: workspaceId };
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workspaces = action.payload;
        if (
          action.payload.length > 0 &&
          !action.payload.some(
            (workspace) => workspace.id === state.activeWorkspaceId,
          )
        ) {
          state.activeWorkspaceId = action.payload[0].id;
          switchWorkspace(action.payload[0].id);
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? "Failed to load workspaces";
      })
      .addCase(createWorkspaceAsync.fulfilled, (state, action) => {
        state.workspaces.push(action.payload);
      })
      .addCase(updateWorkspaceAsync.fulfilled, (state, action) => {
        const index = state.workspaces.findIndex(
          (workspace) => workspace.id === action.payload.id,
        );
        if (index !== -1) {
          state.workspaces[index] = action.payload;
        }
      })
      .addCase(deleteWorkspaceAsync.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter(
          (workspace) => workspace.id !== action.payload,
        );
      });
  },
});

export const { setActiveWorkspace } = workspaceSlice.actions;

export const selectWorkspaces = (state: { workspace: WorkspaceState }) =>
  state.workspace.workspaces;

export const selectActiveWorkspaceId = (state: {
  workspace: WorkspaceState;
}) => state.workspace.activeWorkspaceId;

export const selectActiveWorkspace = createSelector(
  [selectWorkspaces, selectActiveWorkspaceId],
  (workspaces, activeWorkspaceId) =>
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
);

export default workspaceSlice.reducer;
