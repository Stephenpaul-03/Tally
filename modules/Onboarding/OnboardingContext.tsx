import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useBiometricLock } from "@/hooks/use-biometric-lock";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import { financeRepository } from "@/modules/Core/Repository/Index";
import {
  fetchAccounts,
  fetchBudget,
  fetchCategories,
  fetchTransactions,
} from "@/modules/Core/Slices/TransactionSlice";
import {
  fetchWorkspaces,
  selectActiveWorkspace,
  selectWorkspaces,
  switchWorkspaceAndReload,
  updateWorkspaceAsync,
} from "@/modules/Core/Slices/WorkspaceSlice";
import { useNotifications } from "@/src/services/notifications";
import { CommonActions, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React from "react";
import { ONBOARDING_PRESETS } from "./presets";
import {
  markFirstRunOnboardingComplete,
  markWorkspaceOnboardingComplete,
} from "./storage";
import type { OnboardingPresetItem, OnboardingRouteParams } from "./types";

type OnboardingRoute = RouteProp<
  { Onboarding: OnboardingRouteParams | undefined },
  "Onboarding"
>;

type OnboardingContextValue = {
  isFirstRun: boolean;
  saving: boolean;
  workspaceName: string;
  workspaceIcon: string;
  workspaceColor: string;
  accounts: OnboardingPresetItem[];
  incomeCategories: OnboardingPresetItem[];
  expenseCategories: OnboardingPresetItem[];
  budgetEnabled: boolean;
  budgetInput: string;
  defaultAccount: string | null;
  defaultIncomeCategory: string | null;
  defaultExpenseCategory: string | null;
  privacyEnabled: boolean;
  remindersEnabled: boolean;
  biometricAvailable: boolean;
  setWorkspaceName: (value: string) => void;
  setWorkspaceIcon: (value: string) => void;
  setWorkspaceColor: (value: string) => void;
  setBudgetEnabled: (value: boolean) => void;
  setBudgetInput: (value: string) => void;
  setDefaultAccount: (value: string | null) => void;
  setDefaultIncomeCategory: (value: string | null) => void;
  setDefaultExpenseCategory: (value: string | null) => void;
  setPrivacyEnabled: (value: boolean) => void;
  setRemindersEnabled: (value: boolean) => void;
  toggleAccount: (item: OnboardingPresetItem) => void;
  toggleIncomeCategory: (item: OnboardingPresetItem) => void;
  toggleExpenseCategory: (item: OnboardingPresetItem) => void;
  addAccount: (item: OnboardingPresetItem) => void;
  addIncomeCategory: (item: OnboardingPresetItem) => void;
  addExpenseCategory: (item: OnboardingPresetItem) => void;
  finish: () => Promise<void>;
};

const CURRENCY = {
  code: "INR",
  symbol: "₹",
  name: "Indian Rupee",
};

const OnboardingContext = React.createContext<OnboardingContextValue | null>(
  null,
);

function uniqueItems(items: OnboardingPresetItem[]) {
  const seen = new Set<string>();
  return items
    .map((item) => ({ ...item, name: item.name.trim() }))
    .filter((item) => {
      if (!item.name) return false;
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function toggleItem(items: OnboardingPresetItem[], item: OnboardingPresetItem) {
  const exists = items.some((entry) => entry.name === item.name);
  if (exists) return items.filter((entry) => entry.name !== item.name);
  return uniqueItems([...items, item]);
}

function keepSelectedDefault(
  current: string | null,
  items: OnboardingPresetItem[],
) {
  if (current && items.some((item) => item.name === current)) return current;
  return items[0]?.name ?? null;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation<any>();
  const route = useRoute<OnboardingRoute>();
  const dispatch = useAppDispatch();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const workspaces = useAppSelector(selectWorkspaces);
  const biometricLock = useBiometricLock();
  const notifications = useNotifications();
  const { setWorkspaceDefaults } = useWorkspaceDefaults();
  const params = route.params;
  const isFirstRun = params?.mode !== "workspace";
  const routeWorkspace = workspaces.find(
    (workspace) => workspace.id === params?.workspaceId,
  );
  const workspace = routeWorkspace ?? activeWorkspace;

  const [saving, setSaving] = React.useState(false);
  const [workspaceName, setWorkspaceName] = React.useState("Personal");
  const [workspaceIcon, setWorkspaceIcon] = React.useState("account-outline");
  const [workspaceColor, setWorkspaceColor] = React.useState("#6366F1");
  const [accounts, setAccounts] = React.useState(
    () => ONBOARDING_PRESETS.accounts,
  );
  const [incomeCategories, setIncomeCategories] = React.useState(
    () => ONBOARDING_PRESETS.incomeCategories,
  );
  const [expenseCategories, setExpenseCategories] = React.useState(
    () => ONBOARDING_PRESETS.expenseCategories,
  );
  const [budgetEnabled, setBudgetEnabled] = React.useState(false);
  const [budgetInput, setBudgetInput] = React.useState("");
  const [defaultAccount, setDefaultAccount] = React.useState<string | null>(
    ONBOARDING_PRESETS.accounts[0]?.name ?? null,
  );
  const [defaultIncomeCategory, setDefaultIncomeCategory] = React.useState<
    string | null
  >(ONBOARDING_PRESETS.incomeCategories[0]?.name ?? null);
  const [defaultExpenseCategory, setDefaultExpenseCategory] = React.useState<
    string | null
  >(ONBOARDING_PRESETS.expenseCategories[0]?.name ?? null);
  const [privacyEnabled, setPrivacyEnabled] = React.useState(false);
  const [remindersEnabled, setRemindersEnabled] = React.useState(false);

  React.useEffect(() => {
    void dispatch(fetchWorkspaces() as any);
  }, [dispatch]);

  React.useEffect(() => {
    if (!workspace) return;
    setWorkspaceName(workspace.name);
    setWorkspaceIcon(workspace.icon);
    setWorkspaceColor(workspace.color);
  }, [workspace]);

  React.useEffect(() => {
    setDefaultAccount((current) => keepSelectedDefault(current, accounts));
  }, [accounts]);

  React.useEffect(() => {
    setDefaultIncomeCategory((current) =>
      keepSelectedDefault(current, incomeCategories),
    );
  }, [incomeCategories]);

  React.useEffect(() => {
    setDefaultExpenseCategory((current) =>
      keepSelectedDefault(current, expenseCategories),
    );
  }, [expenseCategories]);

  const reloadData = React.useCallback(async () => {
    await Promise.all([
      dispatch(fetchTransactions() as any),
      dispatch(fetchCategories("income") as any),
      dispatch(fetchCategories("expense") as any),
      dispatch(fetchAccounts() as any),
      dispatch(fetchBudget() as any),
      dispatch(fetchWorkspaces() as any),
    ]);
  }, [dispatch]);

  const finish = React.useCallback(async () => {
    if (saving) return;
    const workspaceId = params?.workspaceId ?? workspace?.id;
    if (!workspaceId) return;

    try {
      setSaving(true);
      await dispatch(switchWorkspaceAndReload(workspaceId) as any);
      await dispatch(
        updateWorkspaceAsync({
          id: workspaceId,
          data: {
            name: workspaceName.trim() || "Personal",
            icon: workspaceIcon,
            color: workspaceColor,
            currencyCode: CURRENCY.code,
            currencyName: CURRENCY.name,
            currencySymbol: CURRENCY.symbol,
          },
        }) as any,
      ).unwrap();

      await financeRepository.replaceWorkspaceSetup({
        accounts: accounts.length
          ? accounts
          : ONBOARDING_PRESETS.accounts.slice(0, 1),
        incomeCategories: incomeCategories.length
          ? incomeCategories
          : ONBOARDING_PRESETS.incomeCategories.slice(0, 1),
        expenseCategories: expenseCategories.length
          ? expenseCategories
          : ONBOARDING_PRESETS.expenseCategories.slice(0, 1),
        overallBudget: budgetEnabled ? Number(budgetInput) || 0 : 0,
      });

      setWorkspaceDefaults(workspaceId, {
        defaultAccount,
        defaultIncomeCategory,
        defaultExpenseCategory,
      });

      if (privacyEnabled) {
        await biometricLock.setBiometricLockEnabled(true);
      }
      await notifications.setDailyReminderEnabled(remindersEnabled);

      if (isFirstRun) await markFirstRunOnboardingComplete();
      await markWorkspaceOnboardingComplete(workspaceId);
      await reloadData();
      toast.success("Tally is ready");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Transactions" }],
        }),
      );
    } catch {
      toast.error("Couldn't finish onboarding");
    } finally {
      setSaving(false);
    }
  }, [
    accounts,
    biometricLock,
    budgetEnabled,
    budgetInput,
    defaultAccount,
    defaultExpenseCategory,
    defaultIncomeCategory,
    dispatch,
    expenseCategories,
    incomeCategories,
    isFirstRun,
    navigation,
    notifications,
    params?.workspaceId,
    privacyEnabled,
    reloadData,
    remindersEnabled,
    saving,
    setWorkspaceDefaults,
    workspace?.id,
    workspaceColor,
    workspaceIcon,
    workspaceName,
  ]);

  const value = React.useMemo<OnboardingContextValue>(
    () => ({
      isFirstRun,
      saving,
      workspaceName,
      workspaceIcon,
      workspaceColor,
      accounts,
      incomeCategories,
      expenseCategories,
      budgetEnabled,
      budgetInput,
      defaultAccount,
      defaultIncomeCategory,
      defaultExpenseCategory,
      privacyEnabled,
      remindersEnabled,
      biometricAvailable:
        biometricLock.availability.hasHardware &&
        biometricLock.availability.isEnrolled,
      setWorkspaceName,
      setWorkspaceIcon,
      setWorkspaceColor,
      setBudgetEnabled,
      setBudgetInput,
      setDefaultAccount,
      setDefaultIncomeCategory,
      setDefaultExpenseCategory,
      setPrivacyEnabled,
      setRemindersEnabled,
      toggleAccount: (item) => setAccounts((current) => toggleItem(current, item)),
      toggleIncomeCategory: (item) =>
        setIncomeCategories((current) => toggleItem(current, item)),
      toggleExpenseCategory: (item) =>
        setExpenseCategories((current) => toggleItem(current, item)),
      addAccount: (item) => setAccounts((current) => uniqueItems([...current, item])),
      addIncomeCategory: (item) =>
        setIncomeCategories((current) => uniqueItems([...current, item])),
      addExpenseCategory: (item) =>
        setExpenseCategories((current) => uniqueItems([...current, item])),
      finish,
    }),
    [
      accounts,
      biometricLock.availability.hasHardware,
      biometricLock.availability.isEnrolled,
      budgetEnabled,
      budgetInput,
      defaultAccount,
      defaultExpenseCategory,
      defaultIncomeCategory,
      expenseCategories,
      finish,
      incomeCategories,
      isFirstRun,
      privacyEnabled,
      remindersEnabled,
      saving,
      workspaceColor,
      workspaceIcon,
      workspaceName,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }
  return context;
}
