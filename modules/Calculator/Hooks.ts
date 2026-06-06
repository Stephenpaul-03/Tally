import { useTabBarHeight } from "@/components/tabbar/TabBarContext";
import { useAppDispatch, useAppSelector } from "@/modules/Common/Hooks/Redux";
import {
    closeModal,
    openAddModal,
    selectIsModalOpen,
} from "@/modules/Common/Slices/TransactionSlice";
import { useCallback, useState } from "react";

export type HistoryEntry = {
  id: string;
  expression: string;
  result: string;
};

const OPERATORS = ["÷", "×", "−", "+"];

function formatResult(value: number) {
  return String(Number.parseFloat(value.toFixed(10)));
}

export function useCalculator() {
  const dispatch = useAppDispatch();
  const tabBarHeight = useTabBarHeight();
  const isTransactionModalOpen = useAppSelector(selectIsModalOpen);

  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [operator, setOperator] = useState<string | null>(null);
  const [operand, setOperand] = useState<number | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [activeFunction, setActiveFunction] = useState<"percent" | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showAddTransactionPrompt, setShowAddTransactionPrompt] =
    useState(false);
  const [transactionSeedAmount, setTransactionSeedAmount] = useState<
    string | null
  >(null);

  const pushHistory = useCallback((nextExpression: string, result: string) => {
    setHistory((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        expression: nextExpression,
        result,
      },
      ...prev,
    ]);
  }, []);

  const calculate = useCallback((a: number, b: number, op: string): number => {
    switch (op) {
      case "+":
        return a + b;
      case "−":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  }, []);

  const handleNumber = useCallback(
    (num: string) => {
      setShowAddTransactionPrompt(false);
      setActiveFunction(null);
      if (waitingForOperand) {
        setDisplay(num);
        setWaitingForOperand(false);
      } else {
        setDisplay(display === "0" ? num : display + num);
      }
    },
    [display, waitingForOperand],
  );

  const handleDecimal = useCallback(() => {
    setShowAddTransactionPrompt(false);
    setActiveFunction(null);
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) setDisplay(display + ".");
  }, [display, waitingForOperand]);

  const handleBackspace = useCallback(() => {
    setShowAddTransactionPrompt(false);
    setActiveFunction(null);
    if (waitingForOperand) return;
    if (
      display.length <= 1 ||
      (display.length === 2 && display.startsWith("-"))
    ) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  }, [display, waitingForOperand]);

  const handleOperator = useCallback(
    (op: string) => {
      setShowAddTransactionPrompt(false);
      setActiveFunction(null);
      const current = Number.parseFloat(display);
      if (operand !== null && operator && !waitingForOperand) {
        const result = calculate(operand, current, operator);
        const resultText = formatResult(result);
        setDisplay(resultText);
        setOperand(result);
        setExpression(`${resultText} ${op}`);
      } else {
        setOperand(current);
        setExpression(`${display} ${op}`);
      }
      setOperator(op);
      setWaitingForOperand(true);
    },
    [calculate, display, operand, operator, waitingForOperand],
  );

  const handleEquals = useCallback(() => {
    setShowAddTransactionPrompt(false);
    setActiveFunction(null);
    if (operator === null || operand === null) return;
    const current = Number.parseFloat(display);
    const result = calculate(operand, current, operator);
    const resultText = formatResult(result);
    pushHistory(`${operand} ${operator} ${display}`, resultText);
    setDisplay(resultText);
    setExpression("");
    setOperator(null);
    setOperand(null);
    setWaitingForOperand(true);
    setShowAddTransactionPrompt(true);
  }, [calculate, display, operand, operator, pushHistory]);

  const handleClear = useCallback(() => {
    setShowAddTransactionPrompt(false);
    setActiveFunction(null);
    setDisplay("0");
    setExpression("");
    setOperator(null);
    setOperand(null);
    setWaitingForOperand(false);
  }, []);

  const handlePercent = useCallback(() => {
    setShowAddTransactionPrompt(false);
    setActiveFunction("percent");
    const result = Number.parseFloat(display) / 100;
    const resultText = formatResult(result);
    pushHistory(`${display}%`, resultText);
    setDisplay(resultText);
  }, [display, pushHistory]);

  const handleConfirmAddTransaction = useCallback(() => {
    setTransactionSeedAmount(display);
    setShowAddTransactionPrompt(false);
    dispatch(openAddModal("expense"));
  }, [dispatch, display]);

  const handlePress = useCallback(
    (btn: string) => {
      if (btn === "C") return handleClear();
      if (btn === "⌫") return handleBackspace();
      if (btn === "%") return handlePercent();
      if (btn === "ADD") return handleConfirmAddTransaction();
      if (btn === ".") return handleDecimal();
      if (btn === "=") return handleEquals();
      if (OPERATORS.includes(btn)) return handleOperator(btn);
      handleNumber(btn);
    },
    [
      handleBackspace,
      handleClear,
      handleDecimal,
      handleEquals,
      handleConfirmAddTransaction,
      handleNumber,
      handleOperator,
    handlePercent,
    ],
  );

  const dismissAddTransactionPrompt = useCallback(() => {
    setShowAddTransactionPrompt(false);
  }, []);

  const restoreFromHistory = useCallback((entry: HistoryEntry) => {
    setDisplay(entry.result);
    setExpression(entry.expression);
    setOperator(null);
    setOperand(null);
    setWaitingForOperand(true);
    setIsHistoryOpen(false);
  }, []);

  const handleCloseTransactionModal = useCallback(() => {
    dispatch(closeModal());
    setTransactionSeedAmount(null);
  }, [dispatch]);

  return {
    display,
    expression,
    operator,
    waitingForOperand,
    activeFunction,
    history,
    isHistoryOpen,
    setIsHistoryOpen,
    showAddTransactionPrompt,
    isTransactionModalOpen,
    transactionSeedAmount,
    tabBarHeight,
    handlePress,
    dismissAddTransactionPrompt,
    restoreFromHistory,
    handleConfirmAddTransaction,
    handleCloseTransactionModal,
  };
}
