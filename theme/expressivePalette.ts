/** Tonal Material surfaces derived from the selected accent, shared by every screen. */
export function mixHex(
  surface: string,
  accent: string,
  amount: number,
): string {
  return (
    "#" +
    [1, 3, 5]
      .map((index) =>
        Math.round(
          parseInt(surface.slice(index, index + 2), 16) * (1 - amount) +
            parseInt(accent.slice(index, index + 2), 16) * amount,
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function expressiveSurfaces(
  primary: string,
  dark: boolean,
  trueBlack = false,
) {
  return dark
    ? {
        background: trueBlack ? "#000000" : mixHex("#0E1210", primary, 0.035),
        surface: mixHex("#161B18", primary, 0.045),
        surfaceVariant: mixHex("#252A27", primary, 0.055),
        onSurface: "#DDE4DF",
        onSurfaceVariant: "#BEC9C3",
      }
    : {
        background: mixHex("#FAFDFA", primary, 0.025),
        surface: mixHex("#F0F4F0", primary, 0.055),
        surfaceVariant: mixHex("#E9EEE9", primary, 0.065),
        onSurface: "#161D1A",
        onSurfaceVariant: "#3F4945",
      };
}
