import { AlertModal } from "@/components/alert/AlertModal";
import { InlineDatePicker } from "@/components/datepicker/DatePickerModal";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { toast } from "@/components/toast/ToastProvider";
import { TypeToggle } from "@/components/TypeToggle";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useBreakpoint } from "@/hooks/use-breakpoints";
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
} from "@/modules/Data/Slices/TransactionSlice";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { typography } from "@/theme/typography";
import { getContrastColor } from "@/utils/ColorHelpers";
import { parseIsoDateOnlyParts } from "@/utils/Date";
import {
  formatAccountLabel,
  formatDate,
  getAccountColor,
  getAccountIconName,
  getCategoryColor,
  getCategoryIconName,
  getTodayDate,
  validateAmount,
} from "@/utils/Helpers";
import { TransactionFormData, TransactionType } from "@/utils/Types";
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
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);

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
      setIsNotesExpanded(false);
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

  // Derived display info for category & account cells
  const selectedCategoryIcon = formData.category
    ? (getCategoryIconName(
        formData.category,
        formData.type,
        categoryIcons,
      ) as any)
    : null;
  const selectedCategoryColor = formData.category
    ? getCategoryColor(formData.category, formData.type, categoryColors)
    : null;

  const selectedAccount = accountOptions.find(
    (o) => o.name === formData.account,
  );

  const content = (
    <View style={[mainContent.keyboardView, { overflow: "visible" }]}>
      {/* ── Modal Header ── */}
      <View
        style={[
          mainContent.header,
          {
            borderBottomColor: theme.colors.outlineVariant,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
      >
        {/* Close (X) — always left */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[
            mainContent.closeButton,
            { backgroundColor: theme.colors.elevation.level3 },
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

        {/* Right action: delete in edit mode, calendar icon in add mode */}
        {isEditMode ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete transaction"
            onPress={() => setIsDeleteConfirmOpen(true)}
            style={[
              mainContent.closeButton,
              {
                backgroundColor: theme.colors.errorContainer,
                borderWidth: 0.5,
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
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pick date"
            onPress={() => {
              Keyboard.dismiss();
              setIsDatePickerOpen(true);
            }}
            style={[
              mainContent.closeButton,
              { backgroundColor: theme.colors.elevation.level3 },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={18}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
      </View>

      <KeyboardAwareScrollView
        style={[mainContent.scrollView]}
        contentContainerStyle={mainContent.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
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
        {isEditMode ? (
          /* Edit mode: keep existing chips layout */
          <View style={mainContent.twoColRow}>
            <Surface
              elevation={0}
              style={[
                mainContent.twoColCard,
                {
                  borderColor: errors.category
                    ? theme.colors.error
                    : theme.colors.outlineVariant,
                  backgroundColor: theme.colors.elevation.level1,
                },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  mainContent.stackedLabel,
                  {
                    color: errors.category
                      ? theme.colors.error
                      : theme.colors.primary,
                  },
                ]}
              >
                CATEGORY
              </Text>
              <CategoryPicker
                value={formData.category}
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
              {errors.category && (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.error, marginTop: 2 }}
                >
                  {errors.category}
                </Text>
              )}
            </Surface>

            <Surface
              elevation={0}
              style={[
                mainContent.twoColCard,
                {
                  borderColor: theme.colors.outlineVariant,
                  backgroundColor: theme.colors.elevation.level1,
                },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  mainContent.stackedLabel,
                  { color: theme.colors.primary },
                ]}
              >
                ACCOUNT
              </Text>
              <AccountChips
                value={formData.account}
                options={accountOptions}
                onSelect={(account) =>
                  setFormData((prev) => ({ ...prev, account }))
                }
              />
            </Surface>
          </View>
        ) : (
          /* Add mode: new design — two-column card with icon + label + chevron */
          <View style={[mainContent.twoColRow]}>
            {/* Category cell */}
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setIsCategoryPickerOpen(true);
              }}
              style={[
                mainContent.twoColCard,
                {
                  borderColor: errors.category
                    ? theme.colors.error
                    : theme.colors.outlineVariant,
                  backgroundColor: theme.colors.elevation.level1,
                  gap: 10,
                },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  mainContent.stackedLabel,
                  {
                    color: errors.category
                      ? theme.colors.error
                      : theme.colors.primary,
                  },
                ]}
              >
                CATEGORY
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* Icon circle */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: selectedCategoryColor
                      ? selectedCategoryColor + "22"
                      : theme.colors.elevation.level3,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name={selectedCategoryIcon ?? "help-circle-outline"}
                    size={18}
                    color={
                      selectedCategoryColor ?? theme.colors.onSurfaceVariant
                    }
                  />
                </View>
                <Text
                  variant="bodyMedium"
                  style={{
                    flex: 1,
                    color: formData.category
                      ? theme.colors.onSurface
                      : theme.colors.onSurfaceVariant,
                    opacity: formData.category ? 1 : 0.5,
                    fontWeight: formData.category ? "600" : "400",
                  }}
                  numberOfLines={1}
                >
                  {formData.category || "Select"}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
              {errors.category && (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.error, marginTop: 2 }}
                >
                  {errors.category}
                </Text>
              )}
            </Pressable>

            {/* Account cell */}
            <Pressable
              onPress={() => accountManagement.handleOpenManagement()}
              style={[
                mainContent.twoColCard,
                {
                  borderColor: theme.colors.outlineVariant,
                  backgroundColor: theme.colors.elevation.level1,
                  gap: 10,
                },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  mainContent.stackedLabel,
                  { color: theme.colors.primary },
                ]}
              >
                ACCOUNT
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* Icon circle */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: selectedAccount?.color
                      ? selectedAccount.color + "22"
                      : theme.colors.elevation.level3,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name={(selectedAccount?.icon as any) ?? "bank-outline"}
                    size={18}
                    color={
                      selectedAccount?.color ?? theme.colors.onSurfaceVariant
                    }
                  />
                </View>
                <Text
                  variant="bodyMedium"
                  style={{
                    flex: 1,
                    color: theme.colors.onSurface,
                    fontWeight: "600",
                  }}
                  numberOfLines={1}
                >
                  {formData.account}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
            </Pressable>
          </View>
        )}

        {/* Hidden CategoryPicker for add mode (driven by isCategoryPickerOpen) */}
        {!isEditMode && (
          <CategoryPicker
            value={formData.category}
            onChange={(v) => {
              setFormData((prev) => ({ ...prev, category: v }));
              if (errors.category)
                setErrors((prev) => ({ ...prev, category: undefined }));
              setIsCategoryPickerOpen(false);
            }}
            transactionType={formData.type}
            categoryIcons={categoryIcons}
            categoryColors={categoryColors}
            isMobileLayout={isMobileLayout}
            maxWidth={Math.min(420, width - 64)}
            // externalOpen={isCategoryPickerOpen}
            // onExternalClose={() => setIsCategoryPickerOpen(false)}
          />
        )}

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
              >
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
                  cursorColor={theme.colors.primary}
                  placeholderTextColor={theme.colors.onSurfaceVariant + "55"}
                  contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
                />
              </FieldRow>

              <FieldRow
                icon="calendar-month-outline"
                label="Date"
                error={errors.date}
                isLast={!isNotesExpanded}
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
          /* Add mode: separate individual cards for Title, Notes, Date */
          <>
            {/* Title card */}
            <Surface
              elevation={0}
              style={[
                mainContent.inlineFieldCard,
                {
                  borderColor: errors.title
                    ? theme.colors.error
                    : theme.colors.outlineVariant,
                  backgroundColor: theme.colors.elevation.level1,
                },
              ]}
            >
              <View
                style={[
                  mainContent.inlineFieldIcon,
                  { backgroundColor: theme.colors.elevation.level3 },
                ]}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={16}
                  color={
                    errors.title
                      ? theme.colors.error
                      : theme.colors.onSurfaceVariant
                  }
                />
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <Text
                  variant="bodyMedium"
                  style={[
                    mainContent.inlineFieldLabel,
                    {
                      color: errors.title
                        ? theme.colors.error
                        : theme.colors.onSurface,
                      marginRight: 6,
                    },
                  ]}
                >
                  Title
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    mainContent.inlineFieldLabelOptional,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  (optional)
                </Text>
              </View>
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
                placeholder="e.g. Milk, Tea…"
                style={[
                  mainContent.inlineFieldValue,
                  { color: theme.colors.onSurface },
                ]}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                cursorColor={theme.colors.primary}
                placeholderTextColor={theme.colors.onSurfaceVariant + "55"}
                contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
                textAlign="right"
              />
            </Surface>

            {/* Notes card */}
            <Surface
              elevation={0}
              style={[
                mainContent.inlineFieldCard,
                {
                  borderColor: theme.colors.outlineVariant,
                  backgroundColor: theme.colors.elevation.level1,
                },
              ]}
            >
              <View
                style={[
                  mainContent.inlineFieldIcon,
                  { backgroundColor: theme.colors.elevation.level3 },
                ]}
              >
                <MaterialCommunityIcons
                  name="note-text-outline"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <Text
                  variant="bodyMedium"
                  style={[
                    mainContent.inlineFieldLabel,
                    { color: theme.colors.onSurface, marginRight: 6 },
                  ]}
                >
                  Notes
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    mainContent.inlineFieldLabelOptional,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  (optional)
                </Text>
              </View>
              <DebouncedTextInput
                mode="flat"
                dense
                initialValue={formData.notes || ""}
                onChangeText={(v) =>
                  setFormData((prev) => ({ ...prev, notes: v }))
                }
                onBlur={(v) => setFormData((prev) => ({ ...prev, notes: v }))}
                placeholder="Add a note…"
                style={[
                  mainContent.inlineFieldValue,
                  { color: theme.colors.onSurface },
                ]}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                cursorColor={theme.colors.primary}
                placeholderTextColor={theme.colors.onSurfaceVariant + "55"}
                contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
                textAlign="right"
              />
            </Surface>

            {/* Date card */}
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setIsDatePickerOpen(true);
              }}
              style={[
                mainContent.dateLabelSection,
                {
                  borderColor: errors.date
                    ? theme.colors.error
                    : theme.colors.outlineVariant,
                  backgroundColor: theme.colors.elevation.level1,
                },
              ]}
            >
              <View style={mainContent.dateLabelRow}>
                <Text
                  style={[
                    mainContent.dateLabelText,
                    { color: theme.colors.primary },
                  ]}
                >
                  DATE
                </Text>
              </View>
              <View style={mainContent.dateValueRow}>
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={18}
                  color={
                    errors.date
                      ? theme.colors.error
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  variant="bodyMedium"
                  style={{
                    flex: 1,
                    color: errors.date
                      ? theme.colors.error
                      : theme.colors.onSurface,
                    fontWeight: "500",
                  }}
                >
                  {dateLabel}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
            </Pressable>
          </>
        )}

        {/* 5. Save button */}
        <View style={mainContent.footer}>
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
          confirmMode="slide"
        />
      </Portal>
    </>
  );
}
