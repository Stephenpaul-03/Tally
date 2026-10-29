const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { homeTextTiming, HOME_CONTENT_START, HOME_GLYPH_DURATION } = loader()("modules/Main/homeTextTiming.ts");

test("Home content overlaps the final card entrance before numeric content begins", () => {
  const t = homeTextTiming("Oct 2026", false);
  assert.equal(HOME_CONTENT_START, 170 + 240 * 0.95);
  assert.ok(HOME_CONTENT_START < 410, "content starts before the final card finishes");
  assert.deepEqual(t.starts.slice(0, 4), [0, 0, 0, 0]);
  assert.ok(t.starts[4] >= 200, "160ms label fade completes before the first digit");
  assert.ok(t.starts.slice(4).every((v, i, a) => !i || v > a[i - 1]));
});
test("long names remain ordered without extending the glyph stagger beyond 220ms", () => {
  const t = homeTextTiming("A long name with thirty letters", true);
  assert.ok(t.starts.every((v, i, a) => !i || v > a[i - 1]));
  assert.ok(t.starts.at(-1) - t.starts[0] <= 220.001);
  assert.ok(t.duration + HOME_CONTENT_START < 1100);
});
test("amount symbols and punctuation retain their order and empty text has a finite duration", () => {
  const t = homeTextTiming("−₹57,950", true, 300);
  assert.equal(t.characters.join(""), "−₹57,950");
  assert.ok(t.starts.every((v, i, a) => !i || v > a[i - 1]));
  assert.equal(t.duration, t.starts.at(-1) + HOME_GLYPH_DURATION);
  assert.equal(homeTextTiming("", true).duration, HOME_GLYPH_DURATION);
});

test("captions group words rather than creating an animation node for every letter", () => {
  const text = "Shopping · Cash · 22nd October 2026";
  const t = homeTextTiming(text, false);
  assert.equal(t.units.map((u) => u.text).join(""), text);
  assert.equal(t.units.filter((u) => u.start > 0).length, 6);
  assert.ok(t.units.length < text.length / 2);
});
