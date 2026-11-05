import Color from "color";

/** Slightly richer category hues without adding a gray/black overlay. */
export function richerCategoryColor(value: string): string {
  return Color(value).saturate(0.4).darken(0.04).hex();
}

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
  // Mono uses near-equal RGB channels; avoid inheriting the sage base neutrals.
  const channels = Color(primary).rgb().array();
  const mono = Math.max(...channels) - Math.min(...channels) <= 2;
  if (mono) return dark ? {
    background: trueBlack ? "#000000" : "#111111",
    surface: "#1A1A1A",
    surfaceVariant: "#292929",
    onSurface: "#E3E3E3",
    onSurfaceVariant: "#C4C4C4",
  } : {
    background: "#EFEFEF",
    surface: "#FCFCFC",
    surfaceVariant: "#E7E7E7",
    onSurface: "#1B1B1B",
    onSurfaceVariant: "#474747",
  };
  return dark
    ? {
        background: trueBlack ? "#000000" : mixHex("#0E1210", primary, 0.035),
        surface: mixHex("#161B18", primary, 0.045),
        surfaceVariant: mixHex("#252A27", primary, 0.055),
        onSurface: "#DDE4DF",
        onSurfaceVariant: "#BEC9C3",
      }
    : {
        background: mixHex("#F0F4F0", primary, 0.055),
        surface: mixHex("#FAFDFA", primary, 0.025),
        surfaceVariant: mixHex("#E9EEE9", primary, 0.065),
        onSurface: "#161D1A",
        onSurfaceVariant: "#3F4945",
      };
}
