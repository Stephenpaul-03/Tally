
/**
 * Returns black or white depending on which has better contrast
 * against the given background hex color.
 *
 * Usage: getContrastColor("#1a1a2e") → "#ffffff"
 */
export function getContrastColor(
  color: string,
  light = "#ffffff",
  dark = "#000000",
): string {
  let r: number, g: number, b: number;

  const hex = color.trim();

  // Handle rgba(...) / rgb(...)
  const rgbaMatch = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    [, r, g, b] = rgbaMatch.map(Number);
  } else {
    // Handle hex
    const clean = hex.replace(/^#/, "");
    const full =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;
    r = parseInt(full.slice(0, 2), 16);
    g = parseInt(full.slice(2, 4), 16);
    b = parseInt(full.slice(4, 6), 16);
  }

  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.179 ? dark : light;
}

export function withOpacity(hex: string, opacity?: number) {
  if (opacity === undefined) return hex;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
