const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../scripts/test-support/load-ts.cjs");
const load = loader({
  "./typography": { paperFonts: {} },
  "react-native": { Appearance: { getColorScheme: () => "light" } },
  "react-native-paper": {
    MD3LightTheme: { colors: {} },
    MD3DarkTheme: { colors: {} },
  },
});
const { buildPaperTheme, THEME_PRESETS } = load("theme/buildPaperTheme.ts");
const luminance = (hex) =>
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) =>
  (Math.max(luminance(a), luminance(b)) + 0.05) /
  (Math.min(luminance(a), luminance(b)) + 0.05);

test("Classic page, card and control surfaces stay distinct and text stays readable in every mode and accent", () => {
  for (const themeId of Object.keys(THEME_PRESETS)) {
    for (const [mode, trueBlack] of [
      ["light", false],
      ["dark", false],
      ["dark", true],
    ]) {
      const { colors: c } = buildPaperTheme({ themeId, mode, trueBlack });
      assert.ok(
        contrast(c.background, c.surface) >= 1.1,
        `${themeId}/${mode}/${trueBlack}: page/card separation`,
      );
      assert.ok(
        contrast(c.surface, c.surfaceVariant) >= 1.1,
        `${themeId}/${mode}/${trueBlack}: card/control separation`,
      );
      for (const surface of [c.background, c.surface, c.surfaceVariant]) {
        assert.ok(contrast(surface, c.onSurface) >= 4.5);
        assert.ok(contrast(surface, c.onSurfaceVariant) >= 4.5);
      }
      if (trueBlack) assert.equal(c.background, "#000000");
    }
  }
});

test("AMOLED changes surfaces while preserving the selected dark accent and ignores its flag in light mode", () => {
  for (const themeId of Object.keys(THEME_PRESETS)) {
    const dark = buildPaperTheme({ themeId, mode: "dark" }).colors;
    const amoled = buildPaperTheme({
      themeId,
      mode: "dark",
      trueBlack: true,
    }).colors;
    for (const key of [
      "primary",
      "onPrimary",
      "primaryContainer",
      "onPrimaryContainer",
    ])
      assert.equal(dark[key], amoled[key]);
    assert.deepEqual(
      buildPaperTheme({ themeId, mode: "light" }).colors,
      buildPaperTheme({ themeId, mode: "light", trueBlack: true }).colors,
    );
  }
});
