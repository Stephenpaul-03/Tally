/** A bounded arithmetic parser. No dynamic evaluation; normal operator precedence. */
export function calculateAmount(
  expression: string,
): { value: string } | { error: string } {
  const text = expression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\s/g, "");
  if (!text || text.length > 160 || /[^\d.+*/()-]/.test(text))
    return { error: "Enter a calculation" };
  let pos = 0;
  const number = (): number => {
    if (text[pos] === "+" || text[pos] === "-") {
      const sign = text[pos++] === "-" ? -1 : 1;
      return sign * number();
    }
    if (text[pos] === "(") {
      pos++;
      const value = sum();
      if (text[pos++] !== ")") throw Error("Finish the calculation");
      return value;
    }
    const match = text.slice(pos).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (!match) throw Error("Finish the calculation");
    pos += match[0].length;
    return Number(match[0]);
  };
  const product = (): number => {
    let value = number();
    while (text[pos] === "*" || text[pos] === "/") {
      const op = text[pos++];
      const next = number();
      if (op === "/" && next === 0) throw Error("Cannot divide by zero");
      value = op === "*" ? value * next : value / next;
    }
    return value;
  };
  const sum = (): number => {
    let value = product();
    while (text[pos] === "+" || text[pos] === "-") {
      const op = text[pos++];
      const next = product();
      value = op === "+" ? value + next : value - next;
    }
    return value;
  };
  try {
    const value = sum();
    if (pos !== text.length) throw Error("Finish the calculation");
    if (!Number.isFinite(value) || Math.abs(value) >= 1e15)
      throw Error("Amount is too large");
    return { value: String(Number(value.toFixed(10))) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Check the calculation" };
  }
}
