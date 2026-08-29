import { useCallback, useMemo, useState } from "react";

import { toast } from "@/components/toast/ToastProvider";
import {
    addCategoryAsync,
    deleteCategoryAsync,
    removeCategoryAndReassign,
    selectActiveExpenseCategories,
    selectActiveIncomeCategories,
    selectCategoryColors,
    selectCategoryIcons,
    selectNonDeletedTransactions,
    updateCategoryAsync,
} from "@/modules/Core/Slices/TransactionSlice";
import {
    getCategoryColor,
    getCategoryColorOptions,
    getCategoryIconName,
    getCategoryIconOptions,
} from "@/utils/Helpers";
import { TransactionType } from "@/utils/Types";
import { useAppDispatch, useAppSelector } from "./Redux";

export function useCategoryManagement(activeTab: TransactionType) {
  const dispatch = useAppDispatch();

  // Modals
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    name: string;
    icon: string;
    color: string;
    type: TransactionType;
  } | null>(null);
  const [selectedType, setSelectedType] = useState<TransactionType>(activeTab);

  const [pendingDelete, setPendingDelete] = useState<{
    name: string;
    type: TransactionType;
  } | null>(null);
  const [reassignToCategory, setReassignToCategory] = useState<string>("");

  const incomeCategories = useAppSelector(selectActiveIncomeCategories);
  const expenseCategories = useAppSelector(selectActiveExpenseCategories);
  const allCategoryIcons = useAppSelector(selectCategoryIcons);
  const allCategoryColors = useAppSelector(selectCategoryColors);
  const nonDeletedTransactions = useAppSelector(selectNonDeletedTransactions);

  const activeCategories =
    selectedType === "income" ? incomeCategories : expenseCategories;

  const getCategoryIcon = useCallback(
    (name: string, type: TransactionType = selectedType) => {
      return getCategoryIconName(name, type, allCategoryIcons);
    },
    [allCategoryIcons, selectedType],
  );

  const getCategoryColorForType = useCallback(
    (name: string, type: TransactionType = selectedType) => {
      return getCategoryColor(name, type, allCategoryColors);
    },
    [allCategoryColors, selectedType],
  );

  const handleOpenManagement = (type: TransactionType = activeTab) => {
    setSelectedType(type);
    setIsManagementOpen(true);
  };

  const handleAddNewCategory = () => {
    handleCancelDeleteCategory();
    setEditingCategory(null);
    setIsEditOpen(true);
  };

  const handleEditCategory = (name: string) => {
    handleCancelDeleteCategory();
    const icon = getCategoryIcon(name, selectedType);
    const color = getCategoryColorForType(name, selectedType);
    setEditingCategory({ name, icon, color, type: selectedType });
    setIsEditOpen(true);
  };

  const handleRequestDeleteCategory = (name: string) => {
    const fallback =
      selectedType === "income" ? "Other Income" : "Other Expense";
    if (name === fallback) return;

    handleCloseEdit();
    const destinationOptions = activeCategories.filter((cat) => cat !== name);
    const defaultDestination = destinationOptions.includes(fallback)
      ? fallback
      : destinationOptions[0] || "";

    setPendingDelete({ name, type: selectedType });
    setReassignToCategory(defaultDestination);
  };

  const handleCancelDeleteCategory = () => {
    setPendingDelete(null);
    setReassignToCategory("");
  };

  const handleConfirmDeleteCategory = (destinationOverride?: string) => {
    if (!pendingDelete) return;

    const fallback =
      pendingDelete.type === "income" ? "Other Income" : "Other Expense";
    const destination = destinationOverride || reassignToCategory || fallback;
    if (!destination || destination === pendingDelete.name) return;

    // Update Redux state (reassign transactions, mark category deleted)
    dispatch(
      removeCategoryAndReassign({
        type: pendingDelete.type,
        name: pendingDelete.name,
        fallback: destination,
      }),
    );
    // Persist to SQLite
    dispatch(
      deleteCategoryAsync({
        name: pendingDelete.name,
        type: pendingDelete.type,
        fallback: destination,
      }),
    );

    toast.success("Category deleted");
    handleCancelDeleteCategory();
  };

  const handleCloseManagement = () => {
    setIsManagementOpen(false);
    handleCloseEdit();
    handleCancelDeleteCategory();
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingCategory(null);
  };

  const handleSubmitCategory = async (
    name: string,
    icon: string,
    color: string,
  ) => {
    if (!name.trim()) return false;

    try {
      if (editingCategory) {
        const { name: oldName, type } = editingCategory!;
        await dispatch(
          updateCategoryAsync({ oldName, newName: name, type, icon, color }),
        ).unwrap();
        toast.success("Category updated");
      } else {
        await dispatch(
          addCategoryAsync({ name, type: selectedType, icon, color }),
        ).unwrap();
        toast.success("Category added");
      }

      handleCloseEdit();
      return true;
    } catch (error) {
      toast.error("Couldn't save category");
      console.log(error);
      return false;
    }
  };

  const deleteAffectCount = useMemo(() => {
    if (!pendingDelete) return 0;
    return nonDeletedTransactions.filter(
      (t) => t.type === pendingDelete.type && t.category === pendingDelete.name,
    ).length;
  }, [nonDeletedTransactions, pendingDelete]);

  const categoryStatsByType = useMemo(() => {
    const stats: Record<
      TransactionType,
      Record<string, { count: number; amount: number }>
    > = {
      expense: {},
      income: {},
    };
    for (const transaction of nonDeletedTransactions) {
      const current = stats[transaction.type][transaction.category] ?? {
        count: 0,
        amount: 0,
      };
      stats[transaction.type][transaction.category] = {
        count: current.count + 1,
        amount: current.amount + Math.abs(transaction.amount),
      };
    }
    return stats;
  }, [nonDeletedTransactions]);

  const categoryStats = categoryStatsByType[selectedType];

  const iconOptions = useMemo(() => {
    const pool = getCategoryIconOptions(selectedType);
    const reservedByOtherCategories = new Set(
      activeCategories
        .filter((category) => category !== editingCategory?.name)
        .map((category) => getCategoryIcon(category, selectedType)),
    );

    const available = pool.filter(
      (icon) => !reservedByOtherCategories.has(icon),
    );

    if (
      editingCategory &&
      editingCategory.type === selectedType &&
      editingCategory.icon &&
      !available.includes(editingCategory.icon)
    ) {
      return [editingCategory.icon, ...available];
    }

    return available;
  }, [activeCategories, editingCategory, getCategoryIcon, selectedType]);

  const colorOptions = useMemo(() => getCategoryColorOptions(), []);

  const usedIcons = useMemo(() => {
    const entries = [
      ...incomeCategories.map((name) => ({ name, type: "income" as const })),
      ...expenseCategories.map((name) => ({ name, type: "expense" as const })),
    ];
    return [
      ...new Set(
        entries
          .filter(
            ({ name, type }) =>
              !(
                editingCategory?.name === name &&
                editingCategory.type === type
              ),
          )
          .map(({ name, type }) => getCategoryIcon(name, type)),
      ),
    ];
  }, [editingCategory, expenseCategories, getCategoryIcon, incomeCategories]);

  const usedColors = useMemo(() => {
    const entries = [
      ...incomeCategories.map((name) => ({ name, type: "income" as const })),
      ...expenseCategories.map((name) => ({ name, type: "expense" as const })),
    ];
    return [
      ...new Set(
        entries
          .filter(
            ({ name, type }) =>
              !(
                editingCategory?.name === name &&
                editingCategory.type === type
              ),
          )
          .map(({ name, type }) => getCategoryColorForType(name, type)),
      ),
    ];
  }, [editingCategory, expenseCategories, getCategoryColorForType, incomeCategories]);

  const handleSelectType = (type: TransactionType) => {
    setSelectedType(type);
    handleCloseEdit();
    handleCancelDeleteCategory();
  };

  return {
    // State
    isManagementOpen,
    isEditOpen,
    editingCategory,
    selectedType,
    activeCategories,
    incomeCategories,
    expenseCategories,
    counts: {
      income: incomeCategories.length,
      expense: expenseCategories.length,
    },
    getCategoryIcon,
    getCategoryColor: getCategoryColorForType,
    iconOptions,
    colorOptions,
    usedIcons,
    usedColors,
    isDeleteOpen: pendingDelete !== null,
    deletingCategory: pendingDelete,
    deleteAffectCount,
    categoryStats,
    categoryStatsByType,
    reassignToCategory,

    // Actions
    handleOpenManagement,
    handleEditCategory,
    handleCloseManagement,
    handleCloseEdit,
    handleSubmitCategory,
    handleAddNewCategory,
    handleRequestDeleteCategory,
    handleCancelDeleteCategory,
    handleConfirmDeleteCategory,
    setReassignToCategory,
    handleSelectType,
  };
}
