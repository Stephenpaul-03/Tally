export function sanitizeAmountInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  let sanitized =
    parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
  if (parts[1] && parts[1].length > 10)
    sanitized = parts[0] + "." + parts[1].slice(0, 10);
  const [integer, decimal] = sanitized.split(".");
  return integer.length > 15
    ? integer.slice(0, 15) + (decimal !== undefined ? `.${decimal}` : "")
    : sanitized;
}
export function keypadAmount(current: string, key: string) {
  if (key === "clear") return "";
  if (key === "backspace") return current.slice(0, -1);
  return sanitizeAmountInput(
    key === "0" && !current ? "0." : `${current}${key}`,
  );
}
