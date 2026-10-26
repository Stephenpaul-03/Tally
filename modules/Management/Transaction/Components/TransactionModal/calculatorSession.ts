import { calculateAmount } from "./calculator";
import { keypadAmount } from "./amountInput";
export type Operation = "+" | "−" | "×" | "÷";
export type AmountSession = {
  value: string;
  lhs: string | null;
  operation: Operation | null;
  replaceNext: boolean;
  open: boolean;
  error: string;
};
export const emptyAmountSession: AmountSession = {
  value: "",
  lhs: null,
  operation: null,
  replaceNext: false,
  open: false,
  error: "",
};
export type AmountAction =
  | { type: "set"; value: string }
  | { type: "key"; key: string }
  | { type: "operation"; operation: Operation }
  | { type: "equals" }
  | { type: "toggle" }
  | { type: "close" };
function result(state: AmountSession) {
  if (state.lhs === null || !state.operation) return { value: state.value };
  if (state.replaceNext || !state.value)
    return { error: "Enter the second amount" };
  return calculateAmount(`${state.lhs}${state.operation}${state.value}`);
}
export function amountSessionReducer(
  state: AmountSession,
  action: AmountAction,
): AmountSession {
  if (action.type === "set")
    return { ...emptyAmountSession, value: action.value };
  if (action.type === "close") return { ...state, open: false };
  if (action.type === "toggle")
    return { ...state, open: !state.open, error: "" };
  if (action.type === "key") {
    if (action.key === "clear")
      return { ...emptyAmountSession, open: state.open };
    const current = state.replaceNext ? "" : state.value;
    return {
      ...state,
      value:
        action.key === "."
          ? current.includes(".")
            ? current
            : `${current || "0"}.`
          : keypadAmount(current, action.key),
      replaceNext: false,
      error: "",
    };
  }
  if (action.type === "operation") {
    if (!state.value) return { ...state, error: "Enter an amount first" };
    if (state.replaceNext)
      return { ...state, operation: action.operation, error: "" };
    const calculated = result(state);
    if ("error" in calculated) return { ...state, error: calculated.error };
    return {
      ...state,
      value: calculated.value,
      lhs: calculated.value,
      operation: action.operation,
      replaceNext: true,
      error: "",
    };
  }
  const calculated = result(state);
  if ("error" in calculated) return { ...state, error: calculated.error };
  if (Number(calculated.value) <= 0)
    return { ...state, error: "Use a result greater than zero" };
  return { ...emptyAmountSession, value: calculated.value, open: state.open };
}
