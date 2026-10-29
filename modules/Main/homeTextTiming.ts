// Begin content just before the final Home card finishes (170ms delay + 95% of 240ms).
export const HOME_CONTENT_START = 170 + 240 * 0.95;
export const HOME_GLYPH_DURATION = 140;

/** Labels finish before digits; cap long-name staggering to keep entry responsive. */
export function homeTextTiming(text: string, revealAll: boolean, delay = 0) {
  const characters = Array.from(text);
  const count = revealAll ? characters.length : characters.filter((char) => /\d/.test(char)).length;
  const step = Math.min(20, 220 / Math.max(1, count - 1));
  const numberStart = Math.max(200, delay * 0.65);
  let numericIndex = 0;
  const starts = characters.map((char, index) => {
    if (!revealAll && !/\d/.test(char)) return 0;
    return numberStart + (revealAll ? index : numericIndex++) * step;
  });
  const units: { text: string; start: number }[] = [];
  characters.forEach((char, index) => {
    const previous = units[units.length - 1];
    if (!revealAll && !/\d/.test(char) && previous?.start === 0) previous.text += char;
    else units.push({ text: char, start: starts[index] });
  });
  return { characters, starts, units, duration: Math.max(0, ...starts) + HOME_GLYPH_DURATION };
}
