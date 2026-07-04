import { AlertModal } from "@/components/alert/AlertModal";
import { InlineDatePicker } from "@/components/datepicker/DatePickerModal";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { DateChip } from "@/components/pageheader/DateChip";
import {
  formatDayChipLabel,
  parseIso,
} from "@/components/pageheader/Dateutils";
import { toast } from "@/components/toast/ToastProvider";
import { TypeToggle } from "@/components/TypeToggle";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import {
  addTransactionAsync,
  deleteTransactionAsync,
  selectAccountColors,
  selectAccountIcons,
  selectActiveAccounts,
  selectActiveExpenseCategories,
  selectActiveIncomeCategories,
  selectCategoryColors,
  selectCategoryIcons,
  selectEditingTransactionId,
  selectModalMode,
  selectTransactionById,
  selectTransactions,
  updateTransactionAsync,
} from "@/modules/Core/Slices/TransactionSlice";
import { typography } from "@/theme/typography";
import { getContrastColor } from "@/utils/ColorHelpers";
import { parseIsoDateOnlyParts } from "@/utils/Date";
import {
  formatAccountLabel,
  getLastTransaction,
  getTodayDate,
  validateAmount,
} from "@/utils/Helpers";
import { TransactionFormData, TransactionType } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useLayoutEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  Portal,
  Surface,
  Text,
  useTheme,
  type MD3Theme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountPicker } from "./Molecules/AccountPicker";
import { AmountHero } from "./Molecules/AmountHero";
import { CategoryPicker } from "./Molecules/CategoryPicker";
import { DebouncedTextInput } from "./Molecules/DebouncedTextInput";
import { FieldRow } from "./Molecules/FieldRow";
import { SelectionCard } from "./Molecules/SelectionCard";
import { TransactionRowPreview } from "./Molecules/TransactionRowPreview";
import { mainContent, modal } from "./Styles";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  monthMode?: boolean;
  initialAmount?: string | null;
  initialDate?: string | null;
}

export function TransactionModal({
  isOpen,
  onClose,
  defaultType = "expense",
  monthMode = false,
  initialAmount = null,
  initialDate = null,
}: TransactionModalProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme<MD3Theme>();
  const { width, height, isMobileLayout } = useBreakpoint();
  const { bottom } = useSafeAreaInsets();

  const modalMode = useAppSelector(selectModalMode);
  const editingTransactionId = useAppSelector(selectEditingTransactionId);
  const transactions = useAppSelector(selectTransactions);
  const editingTransaction = useAppSelector(
    editingTransactionId
      ? selectTransactionById(editingTransactionId)
      : () => null,
  );
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const activeIncomeCategories = useAppSelector(selectActiveIncomeCategories);
  const activeExpenseCategories = useAppSelector(selectActiveExpenseCategories);
  const activeAccounts = useAppSelector(selectActiveAccounts);
  const accountIcons = useAppSelector(selectAccountIcons);
  const accountColors = useAppSelector(selectAccountColors);

  const isEditMode = modalMode === "edit";

  const sheetMaxHeight = Math.max(Math.min(height * 0.92, 880), 560);
  const webMaxHeight = Math.min(height * 0.9, 820);

  const [formData, setFormData] = useState<TransactionFormData>({
    title: "",
    date: getTodayDate(),
    amount: 0,
    type: defaultType,
    category: "",
    account: "Card",
    notes: "",
  });

  const [amountString, setAmountString] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof TransactionFormData, string>>
  >({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const titleInputRef = React.useRef<any>(null);
  const addModeDate = useMemo(
    () => initialDate?.trim() || getTodayDate(),
    [initialDate],
  );
  const selectedDateObj = useMemo(() => {
    const { year, month, day } = parseIso(formData.date);
    return new Date(year, month, day);
  }, [formData.date]);
  const dateChipLabel = useMemo(
    () => formatDayChipLabel(selectedDateObj),
    [selectedDateObj],
  );
  const resolveDefaultCategory = React.useCallback(
    (type: TransactionType) => {
      const categories =
        type === "income" ? activeIncomeCategories : activeExpenseCategories;
      const recent = getLastTransaction(transactions, type);
      if (recent?.category && categories.includes(recent.category)) {
        return recent.category;
      }
      return categories[0] || "";
    },
    [activeExpenseCategories, activeIncomeCategories, transactions],
  );
  const resolveDefaultAccount = React.useCallback(
    (type: TransactionType) => {
      const recent = getLastTransaction(transactions, type);
      if (recent?.account && activeAccounts.includes(recent.account)) {
        return recent.account;
      }
      return activeAccounts[0] || "Card";
    },
    [activeAccounts, transactions],
  );
  const defaultAccountForType = useMemo(
    () => resolveDefaultAccount(formData.type),
    [formData.type, resolveDefaultAccount],
  );

  const [calendarMonth, setCalendarMonth] = useState(() =>
    new Date().getMonth(),
  );
  const [calendarYear, setCalendarYear] = useState(() =>
    new Date().getFullYear(),
  );

  useLayoutEffect(() => {
    if (!isOpen) return;

    const normalizedInitialAmount = initialAmount?.trim() ?? "";
    const parsedInitialAmount = Math.abs(
      Number.parseFloat(normalizedInitialAmount) || 0,
    );

    if (isEditMode && editingTransaction) {
      setFormData({
        title: editingTransaction.title || editingTransaction.category,
        date: editingTransaction.date,
        amount: editingTransaction.amount,
        type: editingTransaction.type,
        category: editingTransaction.category,
        account: formatAccountLabel(editingTransaction.account),
        notes: editingTransaction.notes || "",
        tags: editingTransaction.tags,
      });
      setAmountString(String(Math.abs(editingTransaction.amount)));
      const parsed = parseIsoDateOnlyParts(editingTransaction.date);
      if (parsed) {
        setCalendarMonth(parsed.month);
        setCalendarYear(parsed.year);
      }
      setIsNotesExpanded(!!editingTransaction.notes);
    } else {
      setFormData({
        title: "",
        date: addModeDate,
        amount: parsedInitialAmount,
        type: defaultType,
        category: resolveDefaultCategory(defaultType),
        account: resolveDefaultAccount(defaultType),
        notes: "",
      });
      setAmountString(
        normalizedInitialAmount ? String(parsedInitialAmount) : "",
      );
      const parsed = parseIsoDateOnlyParts(addModeDate);
      if (parsed) {
        setCalendarMonth(parsed.month);
        setCalendarYear(parsed.year);
      }
      setIsNotesExpanded(false);
    }

    setErrors({});
    setIsDeleteConfirmOpen(false);
    setIsDatePickerOpen(false);
  }, [
    defaultType,
    resolveDefaultAccount,
    resolveDefaultCategory,
    editingTransaction,
    initialAmount,
    initialDate,
    addModeDate,
    isEditMode,
    isOpen,
  ]);

  React.useEffect(() => {
    if (!activeAccounts.length) return;
    if (activeAccounts.includes(formData.account)) return;
    setFormData((prev) => ({ ...prev, account: activeAccounts[0] }));
  }, [activeAccounts, formData.account]);

  const handleTypeChange = (type: TransactionType) =>
    setFormData((prev) => ({
      ...prev,
      type,
      category: resolveDefaultCategory(type),
    }));

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    let sanitized = cleaned;
    if (parts.length > 2) sanitized = parts[0] + "." + parts.slice(1).join("");
    if (parts[1] && parts[1].length > 2)
      sanitized = parts[0] + "." + parts[1].slice(0, 2);
    setAmountString(sanitized);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const validateForm = (): boolean => {
    const next: Partial<Record<keyof TransactionFormData, string>> = {};
    if (!amountString.trim()) next.amount = "Amount is required";
    else {
      const v = validateAmount(parseFloat(amountString) || 0);
      if (!v.valid) next.amount = v.error;
    }
    if (!formData.date.trim()) next.date = "Date is required";
    if (!formData.category.trim()) next.category = "Category is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    const amount = Math.abs(parseFloat(amountString) || 0);
    const data: TransactionFormData = {
      ...formData,
      title: formData.title.trim() || formData.category,
      amount,
      notes: formData.notes?.trim() ? formData.notes.trim() : undefined,
      tags: undefined,
    };
    if (isEditMode && editingTransactionId) {
      dispatch(updateTransactionAsync({ id: editingTransactionId, data }));
      toast.success("Transaction updated");
    } else {
      dispatch(addTransactionAsync(data));
      toast.success("Transaction added");
    }
    onClose();
  };

  const handleConfirmDelete = () => {
    if (!editingTransactionId) return;
    dispatch(deleteTransactionAsync(editingTransactionId));
    toast.success("Transaction deleted");
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  const handleDateChange = (iso: string) => {
    setFormData((prev) => ({ ...prev, date: iso }));
    const parsed = parseIsoDateOnlyParts(iso);
    if (parsed) {
      setCalendarMonth(parsed.month);
      setCalendarYear(parsed.year);
    }
    if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
  };

  const isExpense = formData.type === "expense";
  const previewTimestamp =
    editingTransaction?.createdAt || editingTransaction?.updatedAt;

  const selectedCategory =
    formData.category || resolveDefaultCategory(formData.type);
  const selectedAccountValue = formData.account || defaultAccountForType;

  const content = (
    <View style={[mainContent.keyboardView, { overflow: "visible" }]}>
      {/* ── Modal Header ── */}
      <View style={mainContent.header}>
        {/* Close (X) — always left */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[
            mainContent.closeButton,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>

        {/* Title — plain text in edit mode, mini type toggle in add mode */}
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          {isEditMode ? (
            <Text
              variant="titleMedium"
              style={[
                mainContent.headerTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              Edit transaction
            </Text>
          ) : (
            <TypeToggle
              value={formData.type}
              onChange={handleTypeChange}
              mini
            />
          )}
        </View>

        <DateChip
          label={dateChipLabel}
          expanded={isDatePickerOpen}
          onPress={() => {
            Keyboard.dismiss();
            setIsDatePickerOpen(true);
          }}
          onLongPress={() => {
            Keyboard.dismiss();
            setIsDatePickerOpen(true);
          }}
          backgroundColor={theme.colors.elevation.level3}
        />
      </View>

      <KeyboardAwareScrollView
        style={[mainContent.scrollView]}
        contentContainerStyle={mainContent.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Preview row — edit mode only */}
        {isEditMode && (
          <TransactionRowPreview
            formData={formData}
            amountString={amountString}
            categoryIcons={categoryIcons}
            categoryColors={categoryColors}
            previewTimestamp={previewTimestamp}
            monthMode={monthMode}
          />
        )}

        {/* 2. Amount hero — open layout with quick-add buttons */}
        <AmountHero
          value={amountString}
          onChange={handleAmountChange}
          transactionType={formData.type}
          error={errors.amount}
        />

        {/* 3. Category + Account — two-column card */}
        <View style={[mainContent.twoColRow]}>
          <SelectionCard label="CATEGORY" error={errors.category}>
            <CategoryPicker
              value={selectedCategory}
              onChange={(v) => {
                setFormData((prev) => ({ ...prev, category: v }));
                if (errors.category)
                  setErrors((prev) => ({ ...prev, category: undefined }));
              }}
              transactionType={formData.type}
              categoryIcons={categoryIcons}
              categoryColors={categoryColors}
              isMobileLayout={isMobileLayout}
              maxWidth={Math.min(420, width - 64)}
            />
          </SelectionCard>

          <SelectionCard label="ACCOUNT" style={{ gap: 10 }}>
            <AccountPicker
              value={selectedAccountValue}
              onChange={(account) =>
                setFormData((prev) => ({ ...prev, account }))
              }
              accountIcons={accountIcons}
              accountColors={accountColors}
              isMobileLayout={isMobileLayout}
              maxWidth={Math.min(420, width - 64)}
            />
          </SelectionCard>
        </View>

        {/* 4a. Title — individual card */}
        {isEditMode ? (
          /* Edit mode: grouped details card */
          <View style={mainContent.detailsCard}>
            <Surface
              elevation={0}
              style={[
                mainContent.surface,
                {
                  borderColor: theme.colors.outlineVariant,
                  backgroundColor: theme.colors.elevation.level1,
                },
              ]}
            >
              <FieldRow
                icon="pencil-outline"
                label="Title"
                error={errors.title}
                onPress={() => titleInputRef.current?.focus?.()}
              >
                <DebouncedTextInput
                  mode="flat"
                  dense
                  ref={titleInputRef}
                  initialValue={formData.title}
                  onChangeText={(v) =>
                    setFormData((prev) => ({ ...prev, title: v }))
                  }
                  onBlur={(v) => {
                    setFormData((prev) => ({ ...prev, title: v }));
                    if (errors.title)
                      setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder="e.g. Groceries, Salary…"
                  style={mainContent.titleInput}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  cursorColor={theme.colors.primary}
                  placeholderTextColor={theme.colors.onSurfaceVariant + "55"}
                  contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
                />
              </FieldRow>

              {isNotesExpanded ? (
                <FieldRow icon="note-text-outline" label="Notes" isLast>
                  <DebouncedTextInput
                    mode="flat"
                    dense
                    initialValue={formData.notes || ""}
                    onChangeText={(v) =>
                      setFormData((prev) => ({ ...prev, notes: v }))
                    }
                    onBlur={(v) =>
                      setFormData((prev) => ({ ...prev, notes: v }))
                    }
                    placeholder="Add a note…"
                    style={mainContent.titleInput}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    cursorColor={theme.colors.primary}
                    placeholderTextColor={theme.colors.onSurfaceVariant + "55"}
                    contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
                    autoFocus
                  />
                </FieldRow>
              ) : (
                <Pressable
                  onPress={() => setIsNotesExpanded(true)}
                  style={[
                    mainContent.notesCollapsed,
                    { borderTopColor: theme.colors.outlineVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="note-text-outline"
                    size={15}
                    color={theme.colors.onSurfaceVariant}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    variant="bodySmall"
                    style={{
                      color: formData.notes
                        ? theme.colors.onSurface
                        : theme.colors.onSurfaceVariant + "88",
                    }}
                  >
                    {formData.notes || "Add a note…"}
                  </Text>
                </Pressable>
              )}
            </Surface>
          </View>
        ) : (
          /* Add mode: same grouped details card as edit mode */
          <View style={mainContent.detailsCard}>
            <Surface
              elevation={0}
              style={[
                mainContent.surface,
                {
                  borderColor: theme.colors.outlineVariant,
                  backgroundColor: theme.colors.elevation.level1,
                },
              ]}
            >
              <FieldRow
                icon="pencil-outline"
                label="Title"
                error={errors.title}
                onPress={() => titleInputRef.current?.focus?.()}
              >
                <DebouncedTextInput
                  mode="flat"
                  dense
                  ref={titleInputRef}
                  initialValue={formData.title}
                  onChangeText={(v) =>
                    setFormData((prev) => ({ ...prev, title: v }))
                  }
                  onBlur={(v) => {
                    setFormData((prev) => ({ ...prev, title: v }));
                    if (errors.title)
                      setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder="e.g. Milk, Tea…"
                  style={mainContent.titleInput}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  cursorColor={theme.colors.primary}
                  placeholderTextColor={theme.colors.onSurfaceVariant + "55"}
                  contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
                />
              </FieldRow>

              {isNotesExpanded ? (
                <FieldRow icon="note-text-outline" label="Notes" isLast>
                  <DebouncedTextInput
                    mode="flat"
                    dense
                    initialValue={formData.notes || ""}
                    onChangeText={(v) =>
                      setFormData((prev) => ({ ...prev, notes: v }))
                    }
                    onBlur={(v) =>
                      setFormData((prev) => ({ ...prev, notes: v }))
                    }
                    placeholder="Add a note…"
                    style={mainContent.titleInput}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    cursorColor={theme.colors.primary}
                    placeholderTextColor={theme.colors.onSurfaceVariant + "55"}
                    contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
                    autoFocus
                  />
                </FieldRow>
              ) : (
                <Pressable
                  onPress={() => setIsNotesExpanded(true)}
                  style={[
                    mainContent.notesCollapsed,
                    { borderTopColor: theme.colors.outlineVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="note-text-outline"
                    size={15}
                    color={theme.colors.onSurfaceVariant}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    variant="bodySmall"
                    style={{
                      color: formData.notes
                        ? theme.colors.onSurface
                        : theme.colors.onSurfaceVariant + "88",
                    }}
                  >
                    {formData.notes || "Add a note…"}
                  </Text>
                </Pressable>
              )}
            </Surface>
          </View>
        )}

        {/* 5. Save button */}
        <View style={mainContent.footer}>
          {isEditMode && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete transaction"
              onPress={() => setIsDeleteConfirmOpen(true)}
              style={[
                mainContent.deleteButton,
                {
                  backgroundColor: theme.colors.errorContainer,
                  borderColor: theme.colors.error + "44",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                color={theme.colors.error}
              />
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            style={[
              mainContent.submitButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <MaterialCommunityIcons
              name={isEditMode ? "check" : "plus"}
              size={18}
              color={getContrastColor(theme.colors.primary)}
            />
            <Text
              style={[
                mainContent.submitButtonText,
                {
                  ...typography.editorial.sectionLabel,
                  color: getContrastColor(theme.colors.primary),
                  letterSpacing: 1.2,
                },
              ]}
            >
              {isEditMode
                ? "SAVE CHANGES"
                : isExpense
                  ? "SAVE EXPENSE"
                  : "SAVE INCOME"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      <InlineDatePicker
        visible={isDatePickerOpen}
        showSummaryCard
        onDismiss={() => setIsDatePickerOpen(false)}
        date={formData.date}
        onDateChange={handleDateChange}
        isMobileLayout={isMobileLayout}
        width={width}
        bottom={bottom}
        calendarMonth={calendarMonth}
        calendarYear={calendarYear}
        onMonthChange={setCalendarMonth}
        onYearChange={setCalendarYear}
      />
    </View>
  );

  return (
    <>
      {isMobileLayout ? (
        <AnimatedPaperModal
          visible={isOpen}
          onDismiss={onClose}
          presentation="sheet"
          escapeEnabled={!isDatePickerOpen}
          zIndex={1000}
          style={modal.sheet}
          keyboardAware
          contentContainerStyle={[
            modal.sheetContent,
            {
              backgroundColor: theme.colors.background,
              maxHeight: sheetMaxHeight,
              overflow: "visible",
            },
          ]}
        >
          <View
            style={[
              modal.sheetHandle,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          {content}
        </AnimatedPaperModal>
      ) : (
        <AnimatedPaperModal
          visible={isOpen}
          onDismiss={onClose}
          presentation="modal"
          escapeEnabled={!isDatePickerOpen}
          zIndex={1000}
          contentContainerStyle={[
            modal.modalContent,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
              width: Math.min(560, width - 64),
              maxHeight: webMaxHeight,
              overflow: "visible",
            },
          ]}
        >
          {content}
        </AnimatedPaperModal>
      )}

      <Portal>
        <AlertModal
          isOpen={isDeleteConfirmOpen}
          title="Delete Transaction"
          message="This will remove the transaction from your list."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteConfirmOpen(false)}
          destructive
          confirmMode="slide"
        />
      </Portal>
    </>
  );
}
