import { useCallback, useMemo, useState } from "react";

import { toast } from "@/components/toast/ToastProvider";
import {
    addAccountAsync,
    deleteAccountAsync,
    removeAccountAndReassign,
    reorderAccounts,
    selectAccountColors,
    selectAccountIcons,
    selectActiveAccounts,
    selectNonDeletedTransactions,
    updateAccountAsync,
    updateAccountOrderAsync,
} from "@/modules/Core/Slices/TransactionSlice";
import {
    getAccountColor,
    getAccountColorOptions,
    getAccountIconName,
    getAccountIconOptions,
} from "@/utils/Helpers";
import { useAppDispatch, useAppSelector } from "./Redux";

export function useAccountManagement() {
  const dispatch = useAppDispatch();

  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<{
    name: string;
    icon: string;
    color: string;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ name: string } | null>(
    null,
  );
  const [reassignToAccount, setReassignToAccount] = useState<string>("");

  const activeAccounts = useAppSelector(selectActiveAccounts);
  const allAccountIcons = useAppSelector(selectAccountIcons);
  const allAccountColors = useAppSelector(selectAccountColors);
  const nonDeletedTransactions = useAppSelector(selectNonDeletedTransactions);

  const getAccountIcon = useCallback(
    (name: string) => getAccountIconName(name, allAccountIcons),
    [allAccountIcons],
  );

  const getAccountColorForName = useCallback(
    (name: string) => getAccountColor(name, allAccountColors),
    [allAccountColors],
  );

  const handleOpenManagement = () => {
    setIsManagementOpen(true);
  };

  const handleAddNewAccount = () => {
    handleCancelDeleteAccount();
    setEditingAccount(null);
    setIsEditOpen(true);
  };

  const handleEditAccount = (name: string) => {
    handleCancelDeleteAccount();
    setEditingAccount({
      name,
      icon: getAccountIcon(name),
      color: getAccountColorForName(name),
    });
    setIsEditOpen(true);
  };

  const handleRequestDeleteAccount = (name: string) => {
    const destinationOptions = activeAccounts.filter(
      (account) => account !== name,
    );
    const defaultDestination = destinationOptions[0] || "";

    handleCloseEdit();
    setPendingDelete({ name });
    setReassignToAccount(defaultDestination);
  };

  const handleCancelDeleteAccount = () => {
    setPendingDelete(null);
    setReassignToAccount("");
  };

  const handleConfirmDeleteAccount = (destinationOverride?: string) => {
    if (!pendingDelete) return;
    const destination = destinationOverride || reassignToAccount;
    if (!destination || destination === pendingDelete.name) return;

    dispatch(
      removeAccountAndReassign({
        name: pendingDelete.name,
        fallback: destination,
      }),
    );
    dispatch(
      deleteAccountAsync({ name: pendingDelete.name, fallback: destination }),
    );

    toast.success("Account deleted");
    handleCancelDeleteAccount();
  };

  const handleCloseManagement = () => {
    setIsManagementOpen(false);
    handleCloseEdit();
    handleCancelDeleteAccount();
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingAccount(null);
  };

  const handleSubmitAccount = async (
    name: string,
    icon: string,
    color: string,
  ) => {
    if (!name.trim()) return false;

    try {
      if (editingAccount) {
        await dispatch(
          updateAccountAsync({
            oldName: editingAccount.name,
            newName: name,
            icon,
            color,
          }),
        ).unwrap();
        toast.success("Account updated");
      } else {
        await dispatch(addAccountAsync({ name, icon, color })).unwrap();
        toast.success("Account added");
      }

      handleCloseEdit();
      return true;
    } catch (error) {
      toast.error(
        "Couldn't save account",
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  };

  const handleMoveAccount = (name: string, direction: "up" | "down") => {
    const currentIndex = activeAccounts.indexOf(name);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= activeAccounts.length) return;

    const nextAccounts = [...activeAccounts];
    const [moved] = nextAccounts.splice(currentIndex, 1);
    nextAccounts.splice(targetIndex, 0, moved);

    dispatch(reorderAccounts(nextAccounts));
    dispatch(updateAccountOrderAsync(nextAccounts));
  };

  const deleteAffectCount = useMemo(() => {
    if (!pendingDelete) return 0;
    return nonDeletedTransactions.filter(
      (t) => t.account === pendingDelete.name,
    ).length;
  }, [nonDeletedTransactions, pendingDelete]);

  const accountStats = useMemo(() => {
    const stats: Record<string, { count: number; amount: number }> = {};
    for (const transaction of nonDeletedTransactions) {
      const current = stats[transaction.account] ?? { count: 0, amount: 0 };
      stats[transaction.account] = {
        count: current.count + 1,
        amount: current.amount + Math.abs(transaction.amount),
      };
    }
    return stats;
  }, [nonDeletedTransactions]);

  const iconOptions = useMemo(() => {
    const pool = getAccountIconOptions();
    const reserved = new Set(
      activeAccounts
        .filter((account) => account !== editingAccount?.name)
        .map((account) => getAccountIcon(account)),
    );
    const available = pool.filter((icon) => !reserved.has(icon));

    if (editingAccount?.icon && !available.includes(editingAccount.icon)) {
      return [editingAccount.icon, ...available];
    }

    return available;
  }, [activeAccounts, editingAccount, getAccountIcon]);

  const colorOptions = useMemo(() => getAccountColorOptions(), []);

  const handleReorderAccounts = (newOrder: string[]) => {
    dispatch(updateAccountOrderAsync(newOrder));
  };

  return {
    isManagementOpen,
    isEditOpen,
    editingAccount,
    activeAccounts,
    counts: {
      accounts: activeAccounts.length,
    },
    getAccountIcon,
    getAccountColor: getAccountColorForName,
    iconOptions,
    colorOptions,
    isDeleteOpen: pendingDelete !== null,
    deletingAccount: pendingDelete,
    deleteAffectCount,
    accountStats,
    reassignToAccount,
    handleOpenManagement,
    handleEditAccount,
    handleCloseManagement,
    handleCloseEdit,
    handleSubmitAccount,
    handleAddNewAccount,
    handleRequestDeleteAccount,
    handleCancelDeleteAccount,
    handleConfirmDeleteAccount,
    handleMoveAccount,
    handleReorderAccounts,
    setReassignToAccount,
  };
}
