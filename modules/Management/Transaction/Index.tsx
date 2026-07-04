import { AlertModal } from "@/components/alert/AlertModal";
import { useSharedTabHeader } from "@/components/pageheader/SharedTabHeader";
import { UniversalSearchBar } from "@/components/UniversalSearchBar";
import { useTransactionUiPrefs } from "@/hooks/use-transaction-ui-prefs";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
import { getTodayDate } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SearchScopeSheet,
  type TransactionSearchScope,
} from "./Components/SearchScopeSheet";
import { TransactionModal } from "./Components/TransactionModal/Index";
import { useTransactionsPage } from "./Hooks";
import { MobileLayout } from "./Layouts/Views/MobileLayoutView";
import { styles } from "./Styles";

type TransactionsProps = {
  initialSelectedDate?: string;
};

const HEADER_PANEL_SWITCH_DELAY_MS = 280;

function HeaderTransactionSearchBar({
  visible,
  value,
  onChangeText,
  scopeLabel,
  onScopePress,
  backgroundColor,
  onRenderStateChange,
}: {
  visible: boolean;
  value: string;
  onChangeText: (value: string) => void;
  scopeLabel: string;
  onScopePress: () => void;
  backgroundColor: string;
  onRenderStateChange?: (mounted: boolean) => void;
}) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [contentHeight, setContentHeight] = useState(0);
  const heightAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const translateYAnim = useRef(new Animated.Value(visible ? 0 : -12)).current;
  const measuredHeight = contentHeight || 76;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    }
  }, [visible]);

  useEffect(() => {
    onRenderStateChange?.(shouldRender);
  }, [onRenderStateChange, shouldRender]);

  useEffect(() => {
    if (visible && shouldRender) {
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!visible && shouldRender) {
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -12,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [heightAnim, opacityAnim, shouldRender, translateYAnim, visible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      style={{
        height: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, measuredHeight],
        }),
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        }}
      >
        <View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight > 0 && nextHeight !== contentHeight) {
              setContentHeight(nextHeight);
            }
          }}
        >
          <UniversalSearchBar
            bg={backgroundColor}
            value={value}
            onChangeText={onChangeText}
            placeholder="Search transactions"
            pillLabel={scopeLabel}
            onPillPress={onScopePress}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function Transactions({
  initialSelectedDate,
}: TransactionsProps) {
  const route = useRoute<any>();
  const screenTheme = useTheme();
  const isFocused = useIsFocused();
  const {
    theme,
    tokens,
    activeTab,
    incomeTotal,
    expenseTotal,
    netBalance,
    overallBudget,
    allEmpty,
    incomeTransactions,
    expenseTransactions,
    filteredExpenseTransactions,
    filteredIncomeTransactions,
    transactionSearchQuery,
    setTransactionSearchQuery,
    transactionSearchScope,
    setTransactionSearchScope,
    isModalOpen,
    modalInitialDate,
    handleCloseModal,
    pendingDeleteId,
    handleDelete,
    handleCancelDelete,
    handleConfirmDelete,
    handleEdit,
    handleAddPress,
    categoryManagement,
    accountManagement,
  } = useTransactionsPage();
  const { datePickerCalendarMode } = useTransactionUiPrefs();
  const [selectedDate, setSelectedDate] = useState<string>(
    initialSelectedDate ?? route.params?.date ?? getTodayDate(),
  );
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isHeaderSearchMounted, setIsHeaderSearchMounted] = useState(false);
  const [scopeSheetVisible, setScopeSheetVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [datePickerCloseRequestToken, setDatePickerCloseRequestToken] =
    useState(0);
  const searchOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scopeLabel =
    transactionSearchScope === "all"
      ? "ALL"
      : transactionSearchScope === "month"
        ? "MONTH"
        : "DAY";

  useEffect(() => {
    return () => {
      if (searchOpenTimerRef.current) {
        clearTimeout(searchOpenTimerRef.current);
      }
    };
  }, []);

  const closeSearch = useCallback(() => {
    if (searchOpenTimerRef.current) {
      clearTimeout(searchOpenTimerRef.current);
      searchOpenTimerRef.current = null;
    }
    setIsSearchVisible(false);
    setScopeSheetVisible(false);
    setTransactionSearchQuery("");
    setTransactionSearchScope("day");
  }, [setTransactionSearchQuery, setTransactionSearchScope]);

  const openSearch = useCallback(() => {
    if (searchOpenTimerRef.current) {
      clearTimeout(searchOpenTimerRef.current);
      searchOpenTimerRef.current = null;
    }

    if (isDatePickerVisible) {
      setDatePickerCloseRequestToken((current) => current + 1);
      searchOpenTimerRef.current = setTimeout(() => {
        setIsSearchVisible(true);
        searchOpenTimerRef.current = null;
      }, HEADER_PANEL_SWITCH_DELAY_MS);
      return;
    }

    setIsSearchVisible(true);
  }, [isDatePickerVisible]);

  useEffect(() => {
    if (initialSelectedDate || route.params?.date) {
      setSelectedDate(
        initialSelectedDate ?? route.params?.date ?? getTodayDate(),
      );
      closeSearch();
    }
  }, [closeSearch, initialSelectedDate, route.params?.date]);

  useEffect(() => {
    if (!isFocused) {
      closeSearch();
    }
  }, [closeSearch, isFocused]);

  const toggleSearch = useCallback(() => {
    if (isSearchVisible) {
      closeSearch();
      return;
    }
    openSearch();
  }, [closeSearch, isSearchVisible, openSearch]);

  const headerSearchButton = useMemo(
    () => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isSearchVisible
            ? "Hide transaction search"
            : "Show transaction search"
        }
        onPress={toggleSearch}
        hitSlop={8}
        style={({ pressed }) => [
          {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isSearchVisible
              ? screenTheme.colors.primary
              : screenTheme.colors.surface,
            borderWidth: 0.5,
            borderColor: isSearchVisible
              ? screenTheme.colors.primary
              : screenTheme.colors.surface,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={
            isSearchVisible
              ? screenTheme.colors.onPrimary
              : screenTheme.colors.onSurface
          }
        />
      </Pressable>
    ),
    [
      isSearchVisible,
      screenTheme.colors.onPrimary,
      screenTheme.colors.onSurface,
      screenTheme.colors.primary,
      screenTheme.colors.surface,
      toggleSearch,
    ],
  );

  const headerSearchBar = useMemo(
    () => (
      <HeaderTransactionSearchBar
        visible={isSearchVisible}
        backgroundColor={screenTheme.colors.surface}
        value={transactionSearchQuery}
        onChangeText={setTransactionSearchQuery}
        scopeLabel={scopeLabel}
        onScopePress={() => setScopeSheetVisible(true)}
        onRenderStateChange={setIsHeaderSearchMounted}
      />
    ),
    [
      isSearchVisible,
      setIsHeaderSearchMounted,
      scopeLabel,
      screenTheme.colors.surface,
      setTransactionSearchQuery,
      transactionSearchQuery,
    ],
  );

  useSharedTabHeader({
    title: "Tally",
    variant: "date",
    selectedDate,
    onDateSelect: setSelectedDate,
    initialPickerMode: datePickerCalendarMode ? "calendar" : "day-strip",
    backgroundColor: theme.colors.background,
    externalOverlayVisible: isSearchVisible,
    onExternalOverlayClose: closeSearch,
    onDatePickerVisibilityChange: setIsDatePickerVisible,
    datePickerCloseRequestToken,
    rightSlot: headerSearchButton,
    bottomSlot:
      isSearchVisible || isHeaderSearchMounted ? headerSearchBar : null,
  });

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        style={theme.dark ? "light" : "dark"}
        backgroundColor={theme.colors.background}
      />
      <View
        style={[
          styles.body,
          {
            paddingBottom: 0,
            backgroundColor: tokens.colors.background.primary,
          },
        ]}
      >
        <MobileLayout
          colors={tokens.colors}
          rangeLabel=""
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          netBalance={netBalance}
          overallBudget={overallBudget}
          activeTab={activeTab}
          allEmpty={allEmpty}
          incomeTransactions={incomeTransactions}
          expenseTransactions={expenseTransactions}
          filteredExpenseTransactions={filteredExpenseTransactions}
          filteredIncomeTransactions={filteredIncomeTransactions}
          transactionSearchQuery={transactionSearchQuery}
          transactionSearchScope={transactionSearchScope}
          searchVisible={isSearchVisible}
          expenseTone={tokens.expenseTone}
          incomeTone={tokens.incomeTone}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddPress={handleAddPress}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </View>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        defaultType={activeTab}
        initialDate={modalInitialDate}
      />

      <SearchScopeSheet
        visible={scopeSheetVisible}
        selectedScope={transactionSearchScope}
        onDismiss={() => setScopeSheetVisible(false)}
        onSelect={(scope: TransactionSearchScope) => {
          setTransactionSearchScope(scope);
        }}
      />

      <AlertModal
        isOpen={pendingDeleteId !== null}
        title="Delete Transaction"
        message="Are You Sure You Want To Delete This Transaction?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        destructive
        confirmMode="slide"
      />

      <CategoryManagementModal
        isOpen={categoryManagement.isManagementOpen}
        onClose={categoryManagement.handleCloseManagement}
        management={categoryManagement}
      />

      <AccountManagementModal
        isOpen={accountManagement.isManagementOpen}
        onClose={accountManagement.handleCloseManagement}
        management={accountManagement}
      />
    </SafeAreaView>
  );
}
