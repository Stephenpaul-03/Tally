import { AlertModal } from "@/components/alert/AlertModal";
import { InlineDatePicker } from "@/components/datepicker/DatePickerModal";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { toast } from "@/components/toast/toast";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { AccountManagementModal } from "@/modules/Common/Components/AccountManagement/Index";
import { TypeToggle } from "@/modules/Common/Components/TypeToggle";
import { useAppDispatch, useAppSelector } from "@/modules/Common/Hooks/Redux";
import { useAccountManagement } from "@/modules/Common/Hooks/UseAccountManagement";
import {
  addTransactionAsync,
  deleteTransactionAsync,
  selectAccountColors,
  selectAccountIcons,
  selectActiveAccounts,
  selectCategoryColors,
  selectCategoryIcons,
  selectEditingTransactionId,
  selectModalMode,
  selectTransactionById,
  updateTransactionAsync,
} from "@/modules/Common/Slices/TransactionSlice";
import { parseIsoDateOnlyParts } from "@/modules/Common/Utils/Date";
import {
  formatAccountLabel,
  formatDate,
  getAccountColor,
  getAccountIconName,
  getTodayDate,
  validateAmount,
} from "@/modules/Common/Utils/Helpers";
import {
  TransactionFormData,
  TransactionType,
} from "@/modules/Common/Utils/Types";
import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import { getContrastColor } from "@/utils/colorHelpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useLayoutEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  Portal,
  Surface,
  Text,
  useTheme,
  type MD3Theme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountChips } from "./Molecules/AccountChips";
import { AmountHero } from "./Molecules/AmountHero";
import { CategoryPicker } from "./Molecules/CategoryPicker";
import { DebouncedTextInput } from "./Molecules/DebouncedTextInput";
import { FieldRow } from "./Molecules/FieldRow";
import { TransactionRowPreview } from "./Molecules/TransactionRowPreview";
import { mainContent, modal } from "./Styles";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  monthMode?: boolean;
  initialAmount?: string | null;
}

export function TransactionModal({
  isOpen,
  onClose,
  defaultType = "expense",
  monthMode = false,
  initialAmount = null,
}: TransactionModalProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme<MD3Theme>();
  const { width, height, isMobileLayout } = useBreakpoint();
  const { bottom } = useSafeAreaInsets();

  const modalMode = useAppSelector(selectModalMode);
  const editingTransactionId = useAppSelector(selectEditingTransactionId);
  const editingTransaction = useAppSelector(
    editingTransactionId
      ? selectTransactionById(editingTransactionId)
      : () => null,
  );
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const activeAccounts = useAppSelector(selectActiveAccounts);
  const accountIcons = useAppSelector(selectAccountIcons);
  const accountColors = useAppSelector(selectAccountColors);
  const accountManagement = useAccountManagement();

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
    } else {
      const today = getTodayDate();
      setFormData({
        title: "",
        date: today,
        amount: parsedInitialAmount,
        type: defaultType,
        category: "",
        account: activeAccounts[0] || "Card",
        notes: "",
      });
      setAmountString(
        normalizedInitialAmount ? String(parsedInitialAmount) : "",
      );
      const parsed = parseIsoDateOnlyParts(today);
      if (parsed) {
        setCalendarMonth(parsed.month);
        setCalendarYear(parsed.year);
      }
    }

    setErrors({});
    setIsDeleteConfirmOpen(false);
    setIsDatePickerOpen(false);
  }, [
    activeAccounts,
    defaultType,
    editingTransaction,
    initialAmount,
    isEditMode,
    isOpen,
  ]);

  React.useEffect(() => {
    if (!activeAccounts.length) return;
    if (activeAccounts.includes(formData.account)) return;
    setFormData((prev) => ({ ...prev, account: activeAccounts[0] }));
  }, [activeAccounts, formData.account]);

  const handleTypeChange = (type: TransactionType) =>
    setFormData((prev) => ({ ...prev, type, category: "" }));

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
    if (!formData.title.trim()) next.title = "Title is required";
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
      title: formData.title.trim(),
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
  const accentColor = isExpense ? palette.red[300] : palette.green[300];
  const dateLabel = formData.date ? formatDate(formData.date) : "Select date";
  const previewTimestamp =
    editingTransaction?.createdAt || editingTransaction?.updatedAt;
  const accountOptions = useMemo(
    () =>
      activeAccounts.map((name) => ({
        name,
        icon: getAccountIconName(name, accountIcons),
        color: getAccountColor(name, accountColors),
      })),
    [accountColors, accountIcons, activeAccounts],
  );

  const content = (
    <View style={[mainContent.keyboardView, { overflow: "visible" }]}>
      <KeyboardAwareScrollView
        style={[mainContent.scrollView]}
        contentContainerStyle={mainContent.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        showsVerticalScrollIndicator={false}
      >
        {!isEditMode && (
          <View style={{ paddingHorizontal: 18 }}>
            <TypeToggle value={formData.type} onChange={handleTypeChange} />
          </View>
        )}

        <TransactionRowPreview
          formData={formData}
          amountString={amountString}
          categoryIcons={categoryIcons}
          categoryColors={categoryColors}
          previewTimestamp={previewTimestamp}
          monthMode={monthMode}
        />

        <AmountHero
          value={amountString}
          onChange={handleAmountChange}
          transactionType={formData.type}
          error={errors.amount}
        />

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
            <FieldRow icon="pencil-outline" label="Title" error={errors.title}>
              <DebouncedTextInput
                mode="flat"
                dense
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
                cursorColor={accentColor}
                placeholderTextColor={theme.colors.onSurfaceVariant + "55"}
                contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
              />
            </FieldRow>

            <FieldRow icon="note-text-outline" label="Notes">
              <DebouncedTextInput
                mode="flat"
                dense
                initialValue={formData.notes || ""}
                onChangeText={(v) =>
                  setFormData((prev) => ({ ...prev, notes: v }))
                }
                onBlur={(v) => setFormData((prev) => ({ ...prev, notes: v }))}
                placeholder="Add a note…"
                style={mainContent.titleInput}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                cursorColor={accentColor}
                placeholderTextColor={theme.colors.onSurfaceVariant + "55"}
                contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
              />
            </FieldRow>

            <FieldRow
              icon="calendar-month-outline"
              label="Date"
              error={errors.date}
            >
              <Text
                variant="bodyMedium"
                style={{
                  color: errors.date
                    ? theme.colors.error
                    : theme.colors.onSurface,
                }}
                onPress={() => {
                  Keyboard.dismiss();
                  setIsDatePickerOpen(true);
                }}
              >
                {dateLabel}
              </Text>
            </FieldRow>

            <FieldRow
              icon="tag-outline"
              label="Category"
              error={errors.category}
            >
              <CategoryPicker
                value={formData.category}
                onChange={(v) => {
                  setFormData((prev) => ({ ...prev, category: v }));
                  if (errors.category)
                    setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                transactionType={formData.type}
                categoryIcons={categoryIcons}
                categoryColors={categoryColors} // ← add this
                isMobileLayout={isMobileLayout}
                maxWidth={Math.min(420, width - 64)}
              />
            </FieldRow>

            <FieldRow
              icon="credit-card-outline"
              label="Account"
              isLast
              onPress={accountManagement.handleOpenManagement}
            >
              <AccountChips
                value={formData.account}
                options={accountOptions}
                onSelect={(account) =>
                  setFormData((prev) => ({ ...prev, account }))
                }
              />
            </FieldRow>
          </Surface>
        </View>

        <View style={mainContent.footer}>
          {isEditMode ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete transaction"
                onPress={() => setIsDeleteConfirmOpen(true)}
                style={[
                  mainContent.submitButton,
                  {
                    backgroundColor: theme.colors.errorContainer,
                    borderWidth: 0.5,
                    borderColor: theme.colors.error + "66",
                    width: 48,
                    paddingHorizontal: 0,
                    flex: undefined,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={theme.colors.error}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={[
                  mainContent.submitButton,
                  {
                    backgroundColor: theme.colors.elevation.level3,
                    borderWidth: 0.5,
                    borderColor: theme.colors.outlineVariant,
                    flex: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    mainContent.submitButtonText,
                    {
                      ...typography.editorial.sectionLabel,
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleSubmit}
                style={[
                  mainContent.submitButton,
                  { backgroundColor: theme.colors.primary, flex: 2 },
                ]}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color={getContrastColor(theme.colors.primary)}
                />
                <Text
                  style={[
                    mainContent.submitButtonText,
                    {
                      ...typography.editorial.sectionLabel,
                      color: getContrastColor(theme.colors.primary),
                    },
                  ]}
                >
                  Save changes
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={[
                  mainContent.submitButton,
                  {
                    backgroundColor: theme.colors.elevation.level3,
                    borderWidth: 0.5,
                    borderColor: theme.colors.outlineVariant,
                    flex: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    mainContent.submitButtonText,
                    {
                      ...typography.editorial.sectionLabel,
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleSubmit}
                style={[
                  mainContent.submitButton,
                  { backgroundColor: theme.colors.primary, flex: 2 },
                ]}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={getContrastColor(theme.colors.primary)}
                />
                <Text
                  style={[
                    mainContent.submitButtonText,
                    {
                      ...typography.editorial.sectionLabel,
                      color: getContrastColor(theme.colors.primary),
                    },
                  ]}
                >
                  Save
                </Text>
              </Pressable>
            </>
          )}
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

      <AccountManagementModal
        isOpen={accountManagement.isManagementOpen}
        onClose={accountManagement.handleCloseManagement}
        management={accountManagement}
        selectedAccount={formData.account}
        onSelectAccount={(account) =>
          setFormData((prev) => ({ ...prev, account }))
        }
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
        />
      </Portal>
    </>
  );
}
