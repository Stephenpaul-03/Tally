/** Shared Settings surfaces; Classic keeps each component's original geometry. */
export function settingsShape(
  theme: { dark: boolean; expressive?: boolean },
  size: "card" | "group" = "card",
) {
  return theme.expressive
    ? { borderRadius: size === "group" ? 28 : 24 }
    : undefined;
}
