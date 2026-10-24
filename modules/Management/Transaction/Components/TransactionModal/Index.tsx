import { useTransactionPresentation } from "./useTransactionPresentation";
import { LazyModalContent } from "@/components/modal/LazyModalContent";
import { AmountKeypad } from "./Molecules/AmountKeypad";
import { keypadAmount } from "./amountInput";
import { AnimatedAmountDisplay } from "./Molecules/AnimatedAmountDisplay";
import { TransactionEntityPickers } from "./Molecules/TransactionEntityPickers";
import Reanimated, {
  Easing as UIEasing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useMotionEnabled } from "@/components/animations/Motion";
import { categoryTone } from "@/theme/sage";
import { DesignText as Text } from "@/components/DesignText";
import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { AlertModal } from "@/components/alert/AlertModal";
import {
  CurrencyPickerField,
  type WorkspaceCurrency,
} from "@/components/CurrencyPickerField";
import { InlineDatePicker } from "@/components/datepicker/DatePickerModal";
import { AnimatedPaperModal } from "@/components/modal/modal";
import {
  formatDayChipLabel,
  parseIso,
} from "@/components/pageheader/Dateutils";
import { toast } from "@/components/toast/ToastProvider";
import { TypeToggle } from "@/components/TypeToggle";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import {
  addTransactionAsync,
  deleteTransactionAsync,
  openEditModal,
  removeTransactionDraft,
  selectAccountColors,
  selectAccountIcons,
  selectActiveAccounts,
  selectActiveExpenseCategories,
  selectActiveIncomeCategories,
  selectActiveTransactionDraft,
  selectActiveTransactionDraftId,
  selectCategoryColors,
  selectCategoryIcons,
  selectEditingTransactionId,
  selectModalMode,
  selectTransactionById,
  selectTransactions,
  updateTransactionAsync,
  upsertTransactionDraft,
} from "@/modules/Core/Slices/TransactionSlice";
import {
  selectActiveWorkspace,
  selectActiveWorkspaceId,
} from "@/modules/Core/Slices/WorkspaceSlice";
import { parseIsoDateOnlyParts } from "@/utils/Date";
import {
  formatAccountLabel,
  getAccountColor,
  getAccountIconName,
  getCategoryColor,
  getCategoryIconName,
  getLastTransaction,
  getTodayDate,
  validateAmount,
} from "@/utils/Helpers";
import { TransactionFormData, TransactionType } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Animated, Keyboard, Pressable, View } from "react-native";
import { Portal, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DebouncedTextInput } from "./Molecules/DebouncedTextInput";
import { createMainContentStyles, modal, withAlpha } from "./Styles";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  initialAmount?: string | null;
  initialDate?: string | null;
  nested?: boolean;
}

const MemoDatePicker = React.memo(InlineDatePicker);

const MAX_NOTE_LENGTH = 40;

// Note pill width-animation tuning
const NOTE_MIN_WIDTH = 100; // smallest pill size when empty/blurred
const NOTE_CHROME_WIDTH = 44;
const NOTE_INPUT_CONTENT_STYLE = { paddingHorizontal: 0, paddingVertical: 0 }; // icon + gaps + horizontal padding allowance

export function TransactionModal({
  isOpen,
  onClose,
  defaultType = "expense",
  initialAmount = null,
  initialDate = null,
  nested = false,
}: TransactionModalProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme<ExtendedMD3Theme>();
  const motionEnabled = useMotionEnabled();
  const mainContent = useMemo(
    () => createMainContentStyles(theme.colors, Boolean(theme.expressive)),
    [theme.colors, theme.expressive],
  );
  const { width, isMobileLayout } = useBreakpoint();
  const { bottom } = useSafeAreaInsets();

  const modalMode = useAppSelector(selectModalMode);
  const editingTransactionId = useAppSelector(selectEditingTransactionId);
  const activeDraftId = useAppSelector(selectActiveTransactionDraftId);
  const activeDraft = useAppSelector(selectActiveTransactionDraft);
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
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);
  const accountIcons = useAppSelector(selectAccountIcons);
  const accountColors = useAppSelector(selectAccountColors);
  const { getWorkspaceDefaults } = useWorkspaceDefaults();
  const workspaceDefaults = getWorkspaceDefaults(activeWorkspaceId);
  const defaultTransactionCurrency: WorkspaceCurrency = useMemo(
    () => ({
      code: activeWorkspace?.currencyCode ?? "INR",
      name: activeWorkspace?.currencyName ?? "Indian Rupee",
      symbol: activeWorkspace?.currencySymbol ?? "₹",
    }),
    [
      activeWorkspace?.currencyCode,
      activeWorkspace?.currencyName,
      activeWorkspace?.currencySymbol,
    ],
  );

  const isEditMode = modalMode === "edit";
  const isViewMode = modalMode === "view";
  const openEdit = React.useCallback(
    (id: string) => dispatch(openEditModal(id)),
    [dispatch],
  );
  const presentation = useTransactionPresentation({
    isOpen,
    mode: modalMode,
    transactionId: editingTransactionId,
    onEdit: openEdit,
  });

  const [formData, setFormData] = useState<TransactionFormData>({
    title: "",
    date: getTodayDate(),
    amount: 0,
    type: defaultType,
    category: "",
    account: "Card",
    notes: "",
    currencyCode: defaultTransactionCurrency.code,
    currencyName: defaultTransactionCurrency.name,
    currencySymbol: defaultTransactionCurrency.symbol,
  });

  const [amountString, setAmountString] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof TransactionFormData, string>>
  >({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [noteContainerWidth, setNoteContainerWidth] = useState(0);
  const titleInputRef = React.useRef<any>(null);
  const noteInputRef = React.useRef<any>(null);
  const headerEntrance = React.useRef(new Animated.Value(1)).current;
  const cardEntrance = React.useRef(new Animated.Value(1)).current;
  const noteWidthAnimation = useSharedValue(NOTE_MIN_WIDTH);
  const noteWidthStyle = useAnimatedStyle(() => ({
    width: noteWidthAnimation.value,
  }));
  const cardSectionEntrances = React.useRef(
    Array.from({ length: 5 }, () => new Animated.Value(1)),
  ).current;
  const modeTransition = React.useRef(
    new Animated.Value(isViewMode ? 1 : 0),
  ).current;
  const addBaselineRef = React.useRef<TransactionFormData | null>(null);
  const baselineAmountInputRef = React.useRef("");
  const closeHandledRef = React.useRef(false);
  const skipDraftOnCloseRef = React.useRef(false);
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
      const explicitDefault =
        type === "income"
          ? workspaceDefaults.defaultIncomeCategory
          : workspaceDefaults.defaultExpenseCategory;
      if (explicitDefault && categories.includes(explicitDefault)) {
        return explicitDefault;
      }
      const recent = getLastTransaction(transactions, type);
      if (recent?.category && categories.includes(recent.category)) {
        return recent.category;
      }
      return categories[0] || "";
    },
    [
      activeExpenseCategories,
      activeIncomeCategories,
      transactions,
      workspaceDefaults.defaultExpenseCategory,
      workspaceDefaults.defaultIncomeCategory,
    ],
  );
  const resolveDefaultAccount = React.useCallback(
    (type: TransactionType) => {
      if (
        workspaceDefaults.defaultAccount &&
        activeAccounts.includes(workspaceDefaults.defaultAccount)
      ) {
        return workspaceDefaults.defaultAccount;
      }
      const recent = getLastTransaction(transactions, type);
      if (recent?.account && activeAccounts.includes(recent.account)) {
        return recent.account;
      }
      return activeAccounts[0] || "Card";
    },
    [activeAccounts, transactions, workspaceDefaults.defaultAccount],
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
    closeHandledRef.current = false;
    skipDraftOnCloseRef.current = false;

    const normalizedInitialAmount = initialAmount?.trim() ?? "";
    const parsedInitialAmount = Math.abs(
      Number.parseFloat(normalizedInitialAmount) || 0,
    );
    const defaultAmountInput = normalizedInitialAmount
      ? String(parsedInitialAmount)
      : "";

    if ((isEditMode || isViewMode) && editingTransaction) {
      setFormData({
        title: editingTransaction.title || editingTransaction.category,
        date: editingTransaction.date,
        amount: editingTransaction.amount,
        type: editingTransaction.type,
        category: editingTransaction.category,
        account: formatAccountLabel(editingTransaction.account),
        notes: (editingTransaction.notes || "").slice(0, MAX_NOTE_LENGTH),
        tags: editingTransaction.tags,
        currencyCode:
          editingTransaction.currencyCode ?? defaultTransactionCurrency.code,
        currencyName:
          editingTransaction.currencyName ?? defaultTransactionCurrency.name,
        currencySymbol:
          editingTransaction.currencySymbol ??
          defaultTransactionCurrency.symbol,
      });
      setAmountString(String(Math.abs(editingTransaction.amount)));
      baselineAmountInputRef.current = String(
        Math.abs(editingTransaction.amount),
      );
      const parsed = parseIsoDateOnlyParts(editingTransaction.date);
      if (parsed) {
        setCalendarMonth(parsed.month);
        setCalendarYear(parsed.year);
      }
    } else if (activeDraft) {
      const nextFormData: TransactionFormData = {
        title: activeDraft.title,
        date: activeDraft.date,
        amount: activeDraft.amount,
        type: activeDraft.type,
        category: activeDraft.category,
        account: activeDraft.account,
        notes: (activeDraft.notes || "").slice(0, MAX_NOTE_LENGTH),
        tags: activeDraft.tags,
        currencyCode:
          activeDraft.currencyCode ?? defaultTransactionCurrency.code,
        currencyName:
          activeDraft.currencyName ?? defaultTransactionCurrency.name,
        currencySymbol:
          activeDraft.currencySymbol ?? defaultTransactionCurrency.symbol,
      };
      addBaselineRef.current = nextFormData;
      setFormData(nextFormData);
      setAmountString(activeDraft.amountInput);
      baselineAmountInputRef.current = activeDraft.amountInput;
      const parsed = parseIsoDateOnlyParts(activeDraft.date);
      if (parsed) {
        setCalendarMonth(parsed.month);
        setCalendarYear(parsed.year);
      }
    } else {
      const nextFormData = {
        title: "",
        date: addModeDate,
        amount: parsedInitialAmount,
        type: defaultType,
        category: resolveDefaultCategory(defaultType),
        account: resolveDefaultAccount(defaultType),
        notes: "",
        currencyCode: defaultTransactionCurrency.code,
        currencyName: defaultTransactionCurrency.name,
        currencySymbol: defaultTransactionCurrency.symbol,
      };
      addBaselineRef.current = {
        ...nextFormData,
        amount: parsedInitialAmount,
      };
      setFormData(nextFormData);
      setAmountString(defaultAmountInput);
      baselineAmountInputRef.current = defaultAmountInput;
      const parsed = parseIsoDateOnlyParts(addModeDate);
      if (parsed) {
        setCalendarMonth(parsed.month);
        setCalendarYear(parsed.year);
      }
    }

    setErrors({});
    setIsDeleteConfirmOpen(false);
    setIsDatePickerOpen(false);

    // The modal doesn't unmount between opens (only its visibility toggles),
    // so the note pill's expanded/focus state and animated width would
    // otherwise carry over from the last time it was open. Reset them here,
    // and snap the width instantly (no animation) rather than letting it
    // visibly animate open/shut as the modal reappears.
    setNoteFocused(false);
    setNoteExpanded(false);
    measuredNoteContentWidthRef.current = 0;
    noteWidthAnimation.value = NOTE_MIN_WIDTH;
  }, [
    defaultType,
    activeDraft,
    resolveDefaultAccount,
    resolveDefaultCategory,
    editingTransaction,
    initialAmount,
    initialDate,
    addModeDate,
    isEditMode,
    isViewMode,
    isOpen,
    defaultTransactionCurrency.code,
    defaultTransactionCurrency.name,
    defaultTransactionCurrency.symbol,
    noteWidthAnimation,
  ]);

  React.useEffect(() => {
    if (!activeAccounts.length) return;
    if (activeAccounts.includes(formData.account)) return;
    setFormData((prev) => {
      const next = { ...prev, account: activeAccounts[0] };
      if (!isEditMode && addBaselineRef.current) {
        addBaselineRef.current = {
          ...addBaselineRef.current,
          account: activeAccounts[0],
        };
      }
      return next;
    });
  }, [activeAccounts, formData.account, isEditMode]);

  const hasMeaningfulDraft = React.useCallback(() => {
    const baseline = addBaselineRef.current;
    if (!baseline) return false;

    const parsedAmount = Number.parseFloat(amountString);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return false;

    return (
      amountString !== baselineAmountInputRef.current ||
      formData.title !== baseline.title ||
      formData.notes !== baseline.notes ||
      formData.date !== baseline.date ||
      formData.type !== baseline.type ||
      formData.category !== baseline.category ||
      formData.account !== baseline.account
    );
  }, [amountString, formData]);

  const saveDraft = React.useCallback(() => {
    dispatch(
      upsertTransactionDraft({
        id: activeDraftId,
        amountInput: amountString,
        data: {
          ...formData,
          amount: Math.abs(Number.parseFloat(amountString) || 0),
          notes: formData.notes?.trim()
            ? formData.notes.trim().slice(0, MAX_NOTE_LENGTH)
            : undefined,
          tags: undefined,
        },
      }),
    );
  }, [activeDraftId, amountString, dispatch, formData]);

  // The shared modal owns the full exit; do not stage a second fade before closing.
  const closeWithAnimation = React.useCallback(
    (afterClose: () => void) => afterClose(),
    [],
  );

  const handleRequestClose = React.useCallback(() => {
    if (closeHandledRef.current) return;
    closeHandledRef.current = true;
    if (skipDraftOnCloseRef.current) {
      closeWithAnimation(onClose);
      return;
    }
    if (modalMode === "add") {
      if (hasMeaningfulDraft()) {
        saveDraft();
        toast.info("Draft saved");
      } else if (
        activeDraftId &&
        (!Number.isFinite(Number.parseFloat(amountString)) ||
          Number.parseFloat(amountString) <= 0)
      ) {
        dispatch(removeTransactionDraft(activeDraftId));
      }
    }
    closeWithAnimation(onClose);
  }, [
    activeDraftId,
    amountString,
    closeWithAnimation,
    dispatch,
    hasMeaningfulDraft,
    modalMode,
    onClose,
    saveDraft,
  ]);

  const { requestEdit } = presentation;
  const handleSwitchToEdit = React.useCallback(() => {
    Keyboard.dismiss();
    requestEdit();
  }, [requestEdit]);

  const handleTypeChange = (type: TransactionType) =>
    setFormData((prev) => ({
      ...prev,
      type,
      category: resolveDefaultCategory(type),
    }));

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
      notes: formData.notes?.trim()
        ? formData.notes.trim().slice(0, MAX_NOTE_LENGTH)
        : undefined,
      tags: undefined,
    };
    if (isEditMode && editingTransactionId) {
      dispatch(updateTransactionAsync({ id: editingTransactionId, data }));
      toast.success("Transaction updated");
    } else {
      skipDraftOnCloseRef.current = true;
      if (activeDraftId) dispatch(removeTransactionDraft(activeDraftId));
      dispatch(addTransactionAsync(data));
      toast.success("Transaction added");
    }
    closeWithAnimation(onClose);
  };

  const handleConfirmDelete = () => {
    if (!isEditMode && activeDraft) {
      dispatch(removeTransactionDraft(activeDraft.id));
      toast.success("Draft deleted");
      setIsDeleteConfirmOpen(false);
      closeWithAnimation(onClose);
      return;
    }
    if (!editingTransactionId) return;
    dispatch(deleteTransactionAsync(editingTransactionId));
    toast.success("Transaction deleted");
    setIsDeleteConfirmOpen(false);
    closeWithAnimation(onClose);
  };

  const handleDateChange = React.useCallback((iso: string) => {
    setFormData((prev) => ({ ...prev, date: iso }));
    const parsed = parseIsoDateOnlyParts(iso);
    if (parsed) {
      setCalendarMonth(parsed.month);
      setCalendarYear(parsed.year);
    }
    setErrors((prev) => (prev.date ? { ...prev, date: undefined } : prev));
  }, []);
  const closeDatePicker = React.useCallback(
    () => setIsDatePickerOpen(false),
    [],
  );

  const selectedCategory =
    formData.category || resolveDefaultCategory(formData.type);
  const selectedAccountValue = formData.account || defaultAccountForType;
  const selectedCurrency = useMemo<WorkspaceCurrency>(
    () => ({
      code: formData.currencyCode ?? defaultTransactionCurrency.code,
      name: formData.currencyName ?? defaultTransactionCurrency.name,
      symbol: formData.currencySymbol ?? defaultTransactionCurrency.symbol,
    }),
    [
      formData.currencyCode,
      formData.currencyName,
      formData.currencySymbol,
      defaultTransactionCurrency,
    ],
  );
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const closeAccountPicker = React.useCallback(
    () => setAccountPickerOpen(false),
    [],
  );
  const closeCategoryPicker = React.useCallback(
    () => setCategoryPickerOpen(false),
    [],
  );
  const selectAccount = React.useCallback((account: string) => {
    setFormData((previous) =>
      previous.account === account ? previous : { ...previous, account },
    );
    setAccountPickerOpen(false);
  }, []);
  const selectCategory = React.useCallback((category: string) => {
    setFormData((previous) =>
      previous.category === category ? previous : { ...previous, category },
    );
    setErrors((previous) =>
      previous.category ? { ...previous, category: undefined } : previous,
    );
    setCategoryPickerOpen(false);
  }, []);
  const selectedAccountIcon = getAccountIconName(
    selectedAccountValue,
    accountIcons,
  ) as React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  const selectedAccountColor = getAccountColor(
    selectedAccountValue,
    accountColors,
  );
  const selectedCategoryIcon = getCategoryIconName(
    selectedCategory,
    formData.type,
    categoryIcons,
  ) as React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  const selectedCategoryColor = getCategoryColor(
    selectedCategory,
    formData.type,
    categoryColors,
  );
  const [categoryBackground, categoryForeground] = categoryTone(
    selectedCategory,
    theme.dark,
    selectedCategoryColor,
  );
  const [accountBackground, accountForeground] = categoryTone(
    "",
    theme.dark,
    selectedAccountColor,
  );
  const amountIsZero = !amountString || Number(amountString) === 0;
  const amountColor = errors.amount
    ? theme.colors.error
    : amountIsZero
      ? theme.colors.onSurfaceVariant
      : theme.colors.onSurface;

  // Note pill width animation:
  // - blurred + empty -> NOTE_MIN_WIDTH
  // - focused -> expands to the full measured container width
  // - blurred + has text -> shrinks to fit the *actual rendered* text width
  //   (measured via the hidden mirror Text below, not estimated), so there's
  //   no secondary "snap" once layout catches up.
  //
  // The target width is only recomputed when `noteFocused` (or the measured
  // container width) changes — never on every keystroke — so the pill stays
  // fully expanded the entire time the user is typing and only resizes to
  // fit the content once they deselect (blur) the field.
  // DebouncedTextInput calls its `onBlur` prop from two different sources:
  // (1) a genuine native blur, and (2) its internal `useDebouncedCallback`,
  // which fires `onBlur(local)` ~300ms after the last keystroke purely to
  // commit the value, even while the field is still focused. Both call our
  // handler with the same signature, so we can't tell them apart from the
  // callback arguments alone. Instead we check the underlying native
  // input's real focus state at the moment the callback fires — if it's
  // still focused, this was just a debounce commit and the pill must stay
  // expanded; only a true blur collapses it.
  const handleNoteFocus = React.useCallback(() => {
    setNoteFocused(true);
    setNoteExpanded(true);
  }, []);

  const handleNoteBlur = React.useCallback((v: string) => {
    setFormData((prev) =>
      prev.notes === v.slice(0, MAX_NOTE_LENGTH)
        ? prev
        : { ...prev, notes: v.slice(0, MAX_NOTE_LENGTH) },
    );

    const stillFocused = Boolean((noteInputRef.current as any)?.isFocused?.());
    if (stillFocused) return;

    setNoteFocused(false);
    setNoteExpanded(false);
  }, []);

  const measuredNoteContentWidthRef = React.useRef(0);

  const getCollapsedNoteWidth = React.useCallback((containerWidth: number) => {
    const contentWidth = measuredNoteContentWidthRef.current;
    return Math.min(
      Math.max(NOTE_MIN_WIDTH, NOTE_CHROME_WIDTH + contentWidth),
      containerWidth || NOTE_MIN_WIDTH,
    );
  }, []);

  useEffect(() => {
    const target = noteExpanded
      ? noteContainerWidth || getCollapsedNoteWidth(noteContainerWidth)
      : getCollapsedNoteWidth(noteContainerWidth);

    noteWidthAnimation.value = withTiming(target, {
      duration: motionEnabled ? 200 : 0,
      easing: UIEasing.out(UIEasing.cubic),
    });
    // Intentionally NOT depending on formData.notes — the pill must not
    // resize while the user is still typing, only once focus is truly lost.
  }, [
    noteExpanded,
    noteContainerWidth,
    getCollapsedNoteWidth,
    noteWidthAnimation,
    motionEnabled,
  ]);

  const blurInputs = React.useCallback(() => {
    if (
      !noteInputRef.current?.isFocused?.() &&
      !titleInputRef.current?.isFocused?.()
    )
      return;
    Keyboard.dismiss();
    titleInputRef.current?.blur?.();
    noteInputRef.current?.blur?.();
    setTitleFocused(false);
    setNoteFocused(false);
    setNoteExpanded(false);
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", blurInputs);
    return () => subscription.remove();
  }, [blurInputs]);

  // View and edit are separate presentations; establish the next header before entry.
  useLayoutEffect(() => {
    modeTransition.stopAnimation();
    modeTransition.setValue(isViewMode ? 1 : 0);
  }, [isViewMode, modeTransition]);

  const sectionEntranceStyle = (animation: Animated.Value) => ({
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });

  const handleKeypadPress = React.useCallback(
    (key: string) => {
      // Functional updates preserve every rapid tap, even before React commits a render.
      blurInputs();
      setAmountString((current) => keypadAmount(current, key));
      setErrors((previous) =>
        previous.amount ? { ...previous, amount: undefined } : previous,
      );
    },
    [blurInputs],
  );

  const handleNoteChange = React.useCallback((value: string) => {
    const notes = value.slice(0, MAX_NOTE_LENGTH);
    setFormData((previous) =>
      previous.notes === notes ? previous : { ...previous, notes },
    );
  }, []);
  const handleTitleChange = React.useCallback(
    (title: string) =>
      setFormData((previous) =>
        previous.title === title ? previous : { ...previous, title },
      ),
    [],
  );
  const handleTitleFocus = React.useCallback(() => setTitleFocused(true), []);
  const handleTitleBlur = React.useCallback((title: string) => {
    setFormData((previous) =>
      previous.title === title ? previous : { ...previous, title },
    );
    setErrors((previous) =>
      previous.title ? { ...previous, title: undefined } : previous,
    );
    setTitleFocused(false);
  }, []);
  const titleIcon = useMemo(
    () => <TextInput.Icon icon="format-title" color={theme.colors.primary} />,
    [theme.colors.primary],
  );
  const renderCurrencyControl = React.useCallback(
    ({
      textStyle,
    }: {
      textStyle: React.ComponentProps<typeof Animated.Text>["style"];
    }) => (
      <CurrencyPickerField
        currency={selectedCurrency}
        theme={theme}
        onChange={(currency) =>
          setFormData((prev) => ({
            ...prev,
            currencyCode: currency.code,
            currencyName: currency.name,
            currencySymbol: currency.symbol,
          }))
        }
        renderTrigger={({ open }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change transaction currency"
            onPress={isViewMode ? undefined : open}
            disabled={isViewMode}
            style={({ pressed }) => ({
              alignItems: "center",
              flexDirection: "row",
              gap: 2,
              marginRight: isViewMode ? 10 : 0,
              opacity: pressed ? 0.62 : 1,
            })}
          >
            <Animated.Text style={[textStyle, { color: amountColor }]}>
              {selectedCurrency.symbol}
            </Animated.Text>
            {!isViewMode ? (
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color={amountColor}
              />
            ) : null}
          </Pressable>
        )}
      />
    ),
    [selectedCurrency, theme, isViewMode, amountColor],
  );

  const content = (
    <View
      style={[
        mainContent.keyboardView,
        mainContent.iosShell,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: 18 + bottom,
        },
        isMobileLayout && { paddingTop: 0 },
      ]}
      onTouchStart={(event) => {
        if (
          (noteFocused || titleFocused) &&
          event.target === event.currentTarget
        )
          blurInputs();
      }}
    >
      {isMobileLayout ? (
        <View style={modal.sheetHandleZone} accessibilityLabel="Drag handle">
          <View
            style={[
              modal.sheetHandle,
              { backgroundColor: theme.colors.onSurface },
            ]}
          />
        </View>
      ) : null}
      <Animated.View
        style={[
          mainContent.iosTopBar,
          {
            opacity: headerEntrance,
            transform: [
              {
                translateY: headerEntrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={handleRequestClose}
          style={({ pressed }) => [
            mainContent.iosCircleButton,
            { opacity: pressed ? 0.68 : 1 },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={28}
            color={theme.colors.onSurface}
          />
        </Pressable>

        <View
          style={{
            alignItems: "center",
            height: 54,
            justifyContent: "center",
            left: "50%",
            marginLeft: -90,
            position: "absolute",
            top: 0,
            width: 180,
          }}
        >
          <Animated.View
            pointerEvents={isViewMode ? "none" : "auto"}
            style={{
              opacity: modeTransition.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [
                {
                  scale: modeTransition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.84],
                  }),
                },
              ],
            }}
          >
            <TypeToggle
              value={formData.type}
              onChange={handleTypeChange}
              mini
              radius={26}
              height={54}
              trackBackgroundColor={theme.colors.elevation.level1}
              borderWidth={0}
            />
          </Animated.View>

          <Animated.View
            pointerEvents={isViewMode ? "auto" : "none"}
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: 6,
              opacity: modeTransition,
              overflow: "hidden",
              position: "absolute",
              width: 180,
              transform: [
                {
                  scale: modeTransition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.84, 1],
                  }),
                },
              ],
            }}
          >
            <View
              style={[
                mainContent.iosDatePill,
                {
                  justifyContent: "center",
                  paddingHorizontal: 14,
                  width: 140,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={17}
                color={theme.colors.onSurface}
              />
              <Text style={[mainContent.iosDateText, { paddingVertical: 0 }]}>
                {dateChipLabel}
              </Text>
            </View>
          </Animated.View>
        </View>

        {isViewMode ? (
          <Animated.View
            style={{
              marginLeft: "auto",
              opacity: modeTransition,
              transform: [
                {
                  scale: modeTransition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.72, 1],
                  }),
                },
              ],
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit transaction title and details"
              onPress={handleSwitchToEdit}
              style={({ pressed }) => [
                mainContent.iosCircleButton,
                { opacity: pressed ? 0.68 : 1 },
              ]}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={23}
                color={theme.colors.primary}
              />
            </Pressable>
          </Animated.View>
        ) : (
          <View style={mainContent.iosTopSpacer} />
        )}

        {isEditMode || isViewMode || Boolean(activeDraft) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isEditMode || isViewMode ? "Delete transaction" : "Delete draft"
            }
            onPress={() => setIsDeleteConfirmOpen(true)}
            style={({ pressed }) => [
              mainContent.iosCircleButton,
              { opacity: pressed ? 0.68 : 1 },
            ]}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={23}
              color={theme.colors.error}
            />
          </Pressable>
        ) : (
          <View style={mainContent.iosTopSpacer} />
        )}
      </Animated.View>

      <Animated.View
        style={[
          mainContent.iosCard,
          {
            opacity: cardEntrance,
            transform: [
              {
                translateY: cardEntrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: cardEntrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.97, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            mainContent.iosAccountRow,
            sectionEntranceStyle(cardSectionEntrances[0]),
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select category"
            onPress={() => {
              Keyboard.dismiss();
              setCategoryPickerOpen(true);
            }}
            disabled={isViewMode}
            style={({ pressed }) => [
              mainContent.iosCategoryPill,
              theme.expressive && { backgroundColor: categoryBackground },
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
            {(theme as ExtendedMD3Theme).expressive ? (
              <CategoryIconBadge
                categoryName={selectedCategory}
                icon={selectedCategoryIcon}
                color={selectedCategoryColor}
                style={{ width: 36, height: 36, borderRadius: 12 }}
              />
            ) : (
              <View
                style={[
                  mainContent.iosCategoryIcon,
                  { backgroundColor: selectedCategoryColor },
                ]}
              >
                <MaterialCommunityIcons
                  name={selectedCategoryIcon}
                  size={17}
                  color="#FFFFFF"
                />
              </View>
            )}
            <Text
              numberOfLines={1}
              style={[
                mainContent.iosCategoryText,
                theme.expressive && { color: categoryForeground },
              ]}
            >
              {selectedCategory || "Category"}
            </Text>
            {!isViewMode ? (
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select account"
            onPress={() => {
              Keyboard.dismiss();
              setAccountPickerOpen(true);
            }}
            disabled={isViewMode}
            style={({ pressed }) => [
              mainContent.iosAccountPill,
              theme.expressive && { backgroundColor: accountBackground },
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
            {(theme as ExtendedMD3Theme).expressive ? (
              <CategoryIconBadge
                icon={selectedAccountIcon}
                color={selectedAccountColor}
                style={{ width: 36, height: 36, borderRadius: 12 }}
              />
            ) : (
              <View
                style={[
                  mainContent.iosAccountIcon,
                  { backgroundColor: selectedAccountColor },
                ]}
              >
                <MaterialCommunityIcons
                  name={selectedAccountIcon}
                  size={19}
                  color="#FFFFFF"
                />
              </View>
            )}
            <View style={mainContent.iosAccountText}>
              <Text
                numberOfLines={1}
                style={[
                  mainContent.iosAccountName,
                  theme.expressive && { color: accountForeground },
                ]}
              >
                {selectedAccountValue}
              </Text>
            </View>
            {!isViewMode ? (
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            ) : null}
          </Pressable>
        </Animated.View>

        <Animated.View
          style={[
            mainContent.iosAmountWrap,
            sectionEntranceStyle(cardSectionEntrances[1]),
          ]}
        >
          <AnimatedAmountDisplay
            currencySymbol={selectedCurrency.symbol}
            value={amountString}
            color={amountColor}
            style={mainContent.iosAmount}
            currencyControl={renderCurrencyControl}
          />
          <View
            style={{ width: "100%", alignItems: "center" }}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              setNoteContainerWidth((prev) =>
                Math.abs(prev - w) > 1 ? w : prev,
              );
            }}
          >
            {/* Invisible mirror of the note text, used only to measure its
                real rendered width so the collapsed pill can shrink to fit
                the content exactly (no estimate, no post-animation snap). */}
            <Text
              numberOfLines={1}
              style={[
                mainContent.iosNotePillInput,
                {
                  position: "absolute",
                  opacity: 0,
                  left: -9999,
                  top: 0,
                },
              ]}
              onLayout={(e) => {
                measuredNoteContentWidthRef.current =
                  e.nativeEvent.layout.width;
              }}
            >
              {formData.notes?.trim() || "Add note"}
            </Text>
            <Reanimated.View
              style={[
                mainContent.iosConvertedPill,
                noteWidthStyle,
                {
                  backgroundColor: theme.expressive
                    ? theme.colors.surfaceVariant
                    : "transparent",
                  alignSelf: "center",
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  width: Math.max(NOTE_MIN_WIDTH, noteContainerWidth) - 24,
                }}
              >
                <MaterialCommunityIcons
                  name="note-edit"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                />
                <DebouncedTextInput
                  ref={noteInputRef}
                  mode="flat"
                  dense
                  initialValue={formData.notes || ""}
                  maxLength={MAX_NOTE_LENGTH}
                  onChangeText={handleNoteChange}
                  onBlur={handleNoteBlur}
                  onFocus={handleNoteFocus}
                  placeholder="Add note"
                  style={mainContent.iosNotePillInput}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  cursorColor={theme.colors.onSurface}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  contentStyle={NOTE_INPUT_CONTENT_STYLE}
                  editable={!isViewMode}
                />
              </View>
            </Reanimated.View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            mainContent.iosUtilityRow,
            sectionEntranceStyle(cardSectionEntrances[2]),
          ]}
        >
          <DebouncedTextInput
            ref={titleInputRef}
            mode="outlined"
            dense
            initialValue={formData.title}
            onChangeText={handleTitleChange}
            onBlur={handleTitleBlur}
            onFocus={handleTitleFocus}
            left={titleIcon}
            placeholder="Enter Title ..."
            style={mainContent.iosTitleInput}
            outlineColor={theme.colors.outlineVariant}
            activeOutlineColor={theme.colors.outline}
            outlineStyle={mainContent.iosTitleOutline}
            cursorColor={theme.colors.onSurface}
            placeholderTextColor={withAlpha(theme.colors.onSurface, 0.4)}
            // contentStyle={{ paddingHorizontal: 4, paddingVertical: 0 }}
            editable={!isViewMode}
          />
        </Animated.View>

        {!isViewMode ? (
          <Animated.View
            style={[sectionEntranceStyle(cardSectionEntrances[3])]}
          >
            <AmountKeypad styles={mainContent} onKey={handleKeypadPress} />
          </Animated.View>
        ) : null}

        {!isViewMode ? (
          <Animated.View
            style={[
              mainContent.iosBottomRow,
              sectionEntranceStyle(cardSectionEntrances[4]),
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change date"
              onPress={() => {
                Keyboard.dismiss();
                setIsDatePickerOpen(true);
              }}
              style={({ pressed }) => [
                mainContent.iosDatePill,
                { opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={18}
                color={
                  theme.expressive
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurface
                }
              />
              <Text style={mainContent.iosDateText}>{dateChipLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save transaction"
              onPress={handleSubmit}
              style={({ pressed }) => [
                mainContent.iosSaveButton,
                { opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={mainContent.iosSaveButtonText}>Save</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </Animated.View>

      <LazyModalContent visible={isDatePickerOpen}>
        <MemoDatePicker
          visible={isDatePickerOpen}
          showSummaryCard
          onDismiss={closeDatePicker}
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
      </LazyModalContent>
      <TransactionEntityPickers
        type={formData.type}
        category={selectedCategory}
        account={selectedAccountValue}
        accountOpen={accountPickerOpen}
        categoryOpen={categoryPickerOpen}
        onAccount={selectAccount}
        onCategory={selectCategory}
        onCloseAccount={closeAccountPicker}
        onCloseCategory={closeCategoryPicker}
      />
    </View>
  );

  return (
    <>
      {isMobileLayout ? (
        <AnimatedPaperModal
          key={presentation.presentationId}
          visible={presentation.visible}
          onHidden={presentation.onHidden}
          animationDuration={280}
          dismissDuration={220}
          onDismiss={handleRequestClose}
          presentation="sheet"
          escapeEnabled={!isDatePickerOpen}
          zIndex={1000}
          style={modal.sheet}
          contentContainerStyle={[
            modal.sheetContent,
            {
              backgroundColor: "transparent",
              paddingBottom: 0,
              width: "100%",
            },
          ]}
          includeBottomInset={false}
        >
          {content}
        </AnimatedPaperModal>
      ) : (
        <AnimatedPaperModal
          key={presentation.presentationId}
          visible={presentation.visible}
          onHidden={presentation.onHidden}
          animationDuration={280}
          dismissDuration={220}
          onDismiss={handleRequestClose}
          presentation="modal"
          escapeEnabled={!isDatePickerOpen}
          zIndex={1000}
          contentContainerStyle={[
            modal.modalContent,
            {
              backgroundColor: "transparent",
              borderColor: theme.colors.outlineVariant,
              width: "100%",
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
