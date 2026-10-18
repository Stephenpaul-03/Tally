/** Tint and readable accents for navigation and Settings icons. */
function rgb(color: string): number[] | null {
  const hex = color.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(hex)) return [...hex].map(value => parseInt(value + value, 16));
  if (/^[\da-f]{6}([\da-f]{2})?$/i.test(hex)) return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
  const match = color.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i);
  return match ? match.slice(1, 4).map(value => Math.max(0, Math.min(255, Number(value)))) : null;
}
function hex(channels: number[]) {
  return `#${channels.map(value => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
}
function luminance(channels: number[]) {
  return channels.map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}
export function colorTreatment(color: string, dark: boolean, selected = false, surface = dark ? "#28282B" : "#F8F8FA") {
  const source = rgb(color) ?? rgb(dark ? "#B7BFD0" : "#536078")!;
  const base = rgb(surface) ?? (dark ? [40, 40, 43] : [248, 248, 250]);
  const opacity = 24 / 255; // The intro chart pills' original 0x18 wash.
  let foreground = source;
  let fill = base;
  for (let step = 0; step <= 25; step++) {
    const amount = step / 25;
    foreground = source.map(value => value * (1 - amount) + (dark ? 255 : 0) * amount);
    // Use the SAME accent for the icon and its wash, rather than a saturated
    // source behind an independently lightened icon. Resolve the wash against
    // the card surface so it looks identical on cards, sheets and page backgrounds.
    fill = base.map((value, index) => value * (1 - opacity) + foreground[index] * opacity);
    const iconLuminance = luminance(foreground), fillLuminance = luminance(fill);
    const contrast = (Math.max(iconLuminance, fillLuminance) + 0.05) / (Math.min(iconLuminance, fillLuminance) + 0.05);
    if (contrast >= (dark ? 5.5 : 3.05)) break;
  }
  foreground = foreground.map(value => Math.round(value));
  fill = base.map((value, index) => value * (1 - opacity) + foreground[index] * opacity);
  const accent = hex(foreground);
  return {
    backgroundColor: hex(fill),
    borderColor: selected ? `${accent}66` : "transparent",
    foregroundColor: accent,
  };
}

/** Distinct, familiar accents for Settings actions that have no stored entity color. */
export function actionAccent(icon: string, fallback: string): string {
  if (/trash|delete|alert|reset/.test(icon)) return "#E66B75";
  if (/shield|lock|fingerprint/.test(icon)) return "#42B994";
  if (/palette|brush|theme|weather/.test(icon)) return "#A18ADC";
  if (/wallet-plus/.test(icon)) return "#D5A05F";
  if (/wallet|bank|credit|cash/.test(icon)) return "#8D8DEB";
  if (/tag|shape|category/.test(icon)) return "#42B5AE";
  if (/database|file|backup|export|import/.test(icon)) return "#D5A05F";
  if (/heart|message/.test(icon)) return "#D980AB";
  if (/bell|lightbulb|star/.test(icon)) return "#D8AD52";
  if (/tune|cog|view|information|cellphone|gesture/.test(icon)) return "#78A7CF";
  if (/account|person|briefcase/.test(icon)) return "#B391D4";
  return fallback;
}
