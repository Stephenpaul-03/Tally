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
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import {
  addTransactionAsync,
  deleteTransactionAsync,
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
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
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
import * as NavigationBar from "expo-navigation-bar";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Portal,
  Text,
  TextInput,
  useTheme,
  type MD3Theme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DebouncedTextInput } from "./Molecules/DebouncedTextInput";
import { createMainContentStyles, modal, withAlpha } from "./Styles";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  initialAmount?: string | null;
  initialDate?: string | null;
}

const KEYPAD_ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["clear", "0", "backspace"],
];

function AnimatedAmountCharacter({
  character,
  color,
  entering,
  exiting,
  onFinished,
  textStyle,
}: {
  character: string;
  color: string;
  entering?: boolean;
  exiting?: boolean;
  onFinished?: () => void;
  textStyle?: React.ComponentProps<typeof Animated.Text>["style"];
}) {
  const translateY = React.useRef(
    new Animated.Value(exiting ? 0 : entering ? -18 : 0),
  ).current;
  const opacity = React.useRef(
    new Animated.Value(exiting ? 1 : entering ? 0 : 1),
  ).current;

  useEffect(() => {
    if (!entering && !exiting) return;
    translateY.setValue(exiting ? 0 : -18);
    opacity.setValue(exiting ? 1 : 0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: exiting ? 20 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: exiting ? 0 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onFinished?.();
    });
  }, [entering, exiting, onFinished, opacity, translateY]);

  return (
    <Animated.Text
      style={[textStyle, { color, opacity, transform: [{ translateY }] }]}
    >
      {character}
    </Animated.Text>
  );
}

function AnimatedClearingCharacter({
  item,
  color,
  textStyle,
  onFinished,
}: {
  item: { character: string; id: number };
  color: string;
  textStyle: React.ComponentProps<typeof Animated.Text>["style"];
  onFinished: (id: number) => void;
}) {
  const handleFinished = React.useCallback(
    () => onFinished(item.id),
    [item.id, onFinished],
  );

  return (
    <AnimatedAmountCharacter
      character={item.character}
      color={color}
      exiting
      textStyle={textStyle}
      onFinished={handleFinished}
    />
  );
}

function AnimatedAmountDisplay({
  currencySymbol,
  value,
  color,
  style,
  currencyControl,
}: {
  currencySymbol: string;
  value: string;
  color: string;
  style: React.ComponentProps<typeof Animated.Text>["style"];
  currencyControl?: (args: {
    color: string;
    textStyle: React.ComponentProps<typeof Animated.Text>["style"];
  }) => React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const previousValueRef = React.useRef(value);
  const [enteringIndex, setEnteringIndex] = useState<number | null>(null);
  const [clearingCharacters, setClearingCharacters] = useState<
    { character: string; id: number }[]
  >([]);
  const [showClearedZero, setShowClearedZero] = useState(value.length === 0);

  const handleClearingCharacterFinished = React.useCallback((id: number) => {
    setClearingCharacters((current) => {
      const next = current.filter((candidate) => candidate.id !== id);
      if (next.length === 0) setShowClearedZero(true);
      return next;
    });
  }, []);

  useEffect(() => {
    const previousValue = previousValueRef.current;
    const isClearing = previousValue.length > 0 && value.length === 0;
    let commonLength = 0;
    while (
      commonLength < previousValue.length &&
      commonLength < value.length &&
      previousValue[commonLength] === value[commonLength]
    ) {
      commonLength += 1;
    }

    if (isClearing) {
      // Keep the zero visible while the previous digits animate away.
      setShowClearedZero(true);
      setClearingCharacters(
        previousValue.split("").map((character, index) => ({
          character,
          id: Date.now() + index,
        })),
      );
    } else if (
      value.length > previousValue.length ||
      (previousValue.length === 0 && value.length > 0)
    ) {
      setEnteringIndex(commonLength);
    }
    if (!isClearing) {
      setClearingCharacters([]);
      setShowClearedZero(value.length === 0);
    }
    previousValueRef.current = value;

    if (!isClearing && value.length > previousValue.length) {
      const timeout = setTimeout(() => setEnteringIndex(null), 220);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  const displayLength = Math.max(value.length, 1) + 1;
  const amountFontSize = Math.min(
    64,
    Math.max(30, (width - 96) / (displayLength * 0.58)),
  );
  const amountTextStyle = [
    style,
    {
      fontSize: amountFontSize,
      lineHeight: amountFontSize * 1.15,
    },
  ];

  return (
    <Animated.View
      style={{
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      {currencyControl ? (
        currencyControl({ color, textStyle: amountTextStyle })
      ) : (
        <Animated.Text style={[amountTextStyle, { color }]}>
          {currencySymbol}
        </Animated.Text>
      )}
      {value.split("").map((character, index) => (
        <AnimatedAmountCharacter
          key={`${index}-${character}`}
          character={character}
          color={color}
          textStyle={amountTextStyle}
          entering={index === enteringIndex}
        />
      ))}
      {value.length === 0 && showClearedZero ? (
        <AnimatedAmountCharacter
          character="0"
          color={color}
          entering
          textStyle={amountTextStyle}
        />
      ) : null}
      {clearingCharacters.length > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            left: 0,
            position: "absolute",
            right: 0,
          }}
        >
          {clearingCharacters.map((item) => (
            <AnimatedClearingCharacter
              key={`clearing-${item.id}`}
              item={item}
              color={color}
              textStyle={amountTextStyle}
              onFinished={handleClearingCharacterFinished}
            />
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

export function TransactionModal({
  isOpen,
  onClose,
  defaultType = "expense",
  initialAmount = null,
  initialDate = null,
}: TransactionModalProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme<MD3Theme>();
  const mainContent = createMainContentStyles(theme.colors);
  const { width, isMobileLayout } = useBreakpoint();
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void NavigationBar.setBackgroundColorAsync("#00000000");
    void NavigationBar.setBorderColorAsync("#00000000");
    void NavigationBar.setPositionAsync("absolute");
    void NavigationBar.setBehaviorAsync("overlay-swipe");
  }, []);

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
  const [titleFocused, setTitleFocused] = useState(false);
  const titleInputRef = React.useRef<any>(null);
  const noteInputRef = React.useRef<any>(null);
  const headerEntrance = React.useRef(new Animated.Value(0)).current;
  const cardEntrance = React.useRef(new Animated.Value(0)).current;
  const noteWidthAnimation = React.useRef(new Animated.Value(92)).current;
  const cardSectionEntrances = React.useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0)),
  ).current;
  const addBaselineRef = React.useRef<TransactionFormData | null>(null);
  const baselineAmountInputRef = React.useRef("");
  const closeHandledRef = React.useRef(false);
  const closeAnimationRunningRef = React.useRef(false);
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
        currencyCode:
          editingTransaction.currencyCode ?? defaultTransactionCurrency.code,
        currencyName:
          editingTransaction.currencyName ?? defaultTransactionCurrency.name,
        currencySymbol:
          editingTransaction.currencySymbol ??
          defaultTransactionCurrency.symbol,
      });
      setAmountString(String(Math.abs(editingTransaction.amount)));
      baselineAmountInputRef.current = String(Math.abs(editingTransaction.amount));
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
        notes: activeDraft.notes || "",
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
    isOpen,
    defaultTransactionCurrency.code,
    defaultTransactionCurrency.name,
    defaultTransactionCurrency.symbol,
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
          notes: formData.notes?.trim() ? formData.notes : undefined,
          tags: undefined,
        },
      }),
    );
  }, [activeDraftId, amountString, dispatch, formData]);

  const closeWithAnimation = React.useCallback(
    (afterClose: () => void) => {
      if (closeAnimationRunningRef.current) return;
      closeAnimationRunningRef.current = true;

      headerEntrance.stopAnimation();
      cardEntrance.stopAnimation();
      cardSectionEntrances.forEach((animation) => animation.stopAnimation());

      Animated.parallel([
        Animated.timing(headerEntrance, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardEntrance, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(
          40,
          [...cardSectionEntrances].reverse().map((animation) =>
            Animated.timing(animation, {
              toValue: 0,
              duration: 250,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ),
        ),
      ]).start();

      setTimeout(() => {
        closeAnimationRunningRef.current = false;
        afterClose();
      }, 245);
    },
    [cardEntrance, cardSectionEntrances, headerEntrance],
  );

  const handleRequestClose = React.useCallback(() => {
    if (closeHandledRef.current) return;
    closeHandledRef.current = true;
    if (skipDraftOnCloseRef.current) {
      closeWithAnimation(onClose);
      return;
    }
    if (!isEditMode) {
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
    isEditMode,
    onClose,
    saveDraft,
  ]);

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
    if (parts[1] && parts[1].length > 10)
      sanitized = parts[0] + "." + parts[1].slice(0, 10);
    const [integerPart, decimalPart] = sanitized.split(".");
    if (integerPart.length > 15) {
      sanitized =
        integerPart.slice(0, 15) +
        (decimalPart !== undefined ? `.${decimalPart}` : "");
    }
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

  const handleDateChange = (iso: string) => {
    setFormData((prev) => ({ ...prev, date: iso }));
    const parsed = parseIsoDateOnlyParts(iso);
    if (parsed) {
      setCalendarMonth(parsed.month);
      setCalendarYear(parsed.year);
    }
    if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
  };

  const selectedCategory =
    formData.category || resolveDefaultCategory(formData.type);
  const selectedAccountValue = formData.account || defaultAccountForType;
  const selectedCurrency: WorkspaceCurrency = {
    code: formData.currencyCode ?? defaultTransactionCurrency.code,
    name: formData.currencyName ?? defaultTransactionCurrency.name,
    symbol: formData.currencySymbol ?? defaultTransactionCurrency.symbol,
  };
  const accountManagement = useAccountManagement();
  const categoryManagement = useCategoryManagement(formData.type);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  React.useEffect(() => {
    categoryManagement.handleSelectType(formData.type);
  }, [categoryManagement, formData.type]);

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
  const amountIsZero = !amountString || Number(amountString) === 0;
  const amountColor = errors.amount
    ? theme.colors.error
    : amountIsZero
      ? theme.colors.onSurfaceVariant
      : theme.colors.onSurface;
  const maxNotePillWidth = Math.min(Math.max(width - 80, 220), 680);
  const noteText = formData.notes?.trim() || "Add note";
  const collapsedNotePillWidth = Math.min(
    maxNotePillWidth,
    Math.max(92, 44 + noteText.length * 7.2),
  );
  useEffect(() => {
    Animated.timing(noteWidthAnimation, {
      toValue: collapsedNotePillWidth,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [collapsedNotePillWidth, noteWidthAnimation]);

  const blurInputs = React.useCallback(() => {
    Keyboard.dismiss();
    titleInputRef.current?.blur?.();
    noteInputRef.current?.blur?.();
    setTitleFocused(false);
    setNoteFocused(false);
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", blurInputs);
    return () => subscription.remove();
  }, [blurInputs]);

  useLayoutEffect(() => {
    headerEntrance.stopAnimation();
    cardEntrance.stopAnimation();
    cardSectionEntrances.forEach((animation) => animation.stopAnimation());

    if (!isOpen) {
      Animated.parallel([
        Animated.timing(headerEntrance, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardEntrance, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(
          35,
          [...cardSectionEntrances].reverse().map((animation) =>
            Animated.timing(animation, {
              toValue: 0,
              duration: 220,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ),
        ),
      ]).start();
      return;
    }

    headerEntrance.setValue(0);
    cardEntrance.setValue(0);
    cardSectionEntrances.forEach((animation) => animation.setValue(0));

    Animated.sequence([
      Animated.delay(260),
      Animated.parallel([
        Animated.timing(headerEntrance, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardEntrance, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
        Animated.stagger(
          90,
          cardSectionEntrances.map((animation) =>
            Animated.timing(animation, {
              toValue: 1,
              duration: 420,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ),
        ),
      ]),
    ]).start();
  }, [cardEntrance, cardSectionEntrances, headerEntrance, isOpen]);

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

  const handleKeypadPress = (key: string) => {
    if (key === "backspace") {
      handleAmountChange(amountString.slice(0, -1));
      return;
    }
    if (key === "clear") {
      handleAmountChange("");
      return;
    }
    handleAmountChange(
      key === "0" && !amountString ? "0." : `${amountString}${key}`,
    );
  };
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
      onTouchStart={() => {
        if (noteFocused || titleFocused) blurInputs();
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

        <View style={{ width: 180 }}>
          <TypeToggle
            value={formData.type}
            onChange={handleTypeChange}
            mini
            radius={26}
            height={54}
            trackBackgroundColor={theme.colors.elevation.level1}
            borderWidth={0}
          />
        </View>

        {isEditMode || Boolean(activeDraft) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isEditMode ? "Delete transaction" : "Delete draft"
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
            style={({ pressed }) => [
              mainContent.iosCategoryPill,
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
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
            <Text numberOfLines={1} style={mainContent.iosCategoryText}>
              {selectedCategory || "Category"}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select account"
            onPress={() => {
              Keyboard.dismiss();
              setAccountPickerOpen(true);
            }}
            style={({ pressed }) => [
              mainContent.iosAccountPill,
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
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
            <View style={mainContent.iosAccountText}>
              <Text numberOfLines={1} style={mainContent.iosAccountName}>
                {selectedAccountValue}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
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
            currencyControl={({ textStyle }) => (
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
                    onPress={open}
                    style={({ pressed }) => ({
                      alignItems: "center",
                      flexDirection: "row",
                      gap: 2,
                      opacity: pressed ? 0.62 : 1,
                    })}
                  >
                    <Animated.Text style={[textStyle, { color: amountColor }]}>
                      {selectedCurrency.symbol}
                    </Animated.Text>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={16}
                      color={amountColor}
                    />
                  </Pressable>
                )}
              />
            )}
          />
          <Animated.View
            style={[
              mainContent.iosConvertedPill,
              {
                backgroundColor: "transparent",
                width: noteWidthAnimation,
              },
            ]}
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
              onChangeText={(v) =>
                setFormData((prev) => ({ ...prev, notes: v }))
              }
              onBlur={(v) => {
                setFormData((prev) => ({ ...prev, notes: v }));
                setNoteFocused(false);
              }}
              onFocus={() => setNoteFocused(true)}
              placeholder="Add note"
              style={mainContent.iosNotePillInput}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              cursorColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
            />
          </Animated.View>
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
            onChangeText={(v) => setFormData((prev) => ({ ...prev, title: v }))}
            onBlur={(v) => {
              setFormData((prev) => ({ ...prev, title: v }));
              if (errors.title) {
                setErrors((prev) => ({ ...prev, title: undefined }));
              }
              setTitleFocused(false);
            }}
            onFocus={() => setTitleFocused(true)}
            left={<TextInput.Icon icon="pencil" color={theme.colors.primary} />}
            placeholder="Enter Title ..."
            style={mainContent.iosTitleInput}
            outlineColor={theme.colors.outlineVariant}
            activeOutlineColor={theme.colors.outline}
            outlineStyle={mainContent.iosTitleOutline}
            cursorColor={theme.colors.onSurface}
            placeholderTextColor={withAlpha(theme.colors.onSurface, 0.4)}
            // contentStyle={{ paddingHorizontal: 4, paddingVertical: 0 }}
          />
        </Animated.View>

        <Animated.View
          style={[
            mainContent.iosKeypad,
            sectionEntranceStyle(cardSectionEntrances[3]),
          ]}
        >
          {KEYPAD_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={mainContent.iosKeypadRow}>
              {row.map((key) => {
                const isBlank = key.startsWith("blank");
                const iconName =
                  key === "backspace" ? "backspace-outline" : null;
                const isClear = key === "clear";
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    disabled={isBlank}
                    accessibilityLabel={
                      isBlank
                        ? "Empty keypad cell"
                        : isClear
                          ? "Clear amount"
                          : iconName
                            ? key
                            : `Enter ${key}`
                    }
                    onPress={() => handleKeypadPress(key)}
                    style={({ pressed }) => [
                      mainContent.iosKey,
                      isBlank && mainContent.iosKeyBlank,
                      isClear && mainContent.iosClearKey,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    {isClear ? (
                      <Text style={mainContent.iosClearKeyText}>C</Text>
                    ) : iconName ? (
                      <MaterialCommunityIcons
                        name={iconName}
                        size={22}
                        color={theme.colors.onSurface}
                      />
                    ) : isBlank ? null : (
                      <Text style={mainContent.iosKeyText}>
                        {key === "." ? "," : key}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Animated.View>

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
              color={theme.colors.onSurface}
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
      </Animated.View>

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
        isOpen={accountPickerOpen}
        onClose={() => setAccountPickerOpen(false)}
        management={accountManagement}
        selectedAccount={selectedAccountValue}
        onSelectAccount={(account) => {
          setFormData((prev) => ({ ...prev, account }));
          setAccountPickerOpen(false);
        }}
      />
      <CategoryManagementModal
        isOpen={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        management={categoryManagement}
        pickerMode
        selectedValue={selectedCategory}
        onSelectCategory={(category) => {
          setFormData((prev) => ({ ...prev, category }));
          if (errors.category) {
            setErrors((prev) => ({ ...prev, category: undefined }));
          }
          setCategoryPickerOpen(false);
        }}
      />
    </View>
  );

  return (
    <>
      {isMobileLayout ? (
        <AnimatedPaperModal
          visible={isOpen}
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
          visible={isOpen}
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
