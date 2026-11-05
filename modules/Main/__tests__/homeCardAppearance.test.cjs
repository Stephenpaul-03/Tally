const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { homeCardShape, homeCardTone } = loader()(
  "modules/Main/homeCardAppearance.ts",
);
test("randomized Home corners remain stable during updates and vary between card roles", () => {
  const corners = [
    "borderTopLeftRadius",
    "borderTopRightRadius",
    "borderBottomRightRadius",
    "borderBottomLeftRadius",
  ];
  const chosen = ["greeting", "date", "balance", "drafts"].map((role) => {
    const shape = homeCardShape(role);
    assert.deepEqual(shape, homeCardShape(role));
    assert.equal(corners.filter((corner) => shape[corner] === 12).length, 1);
    return corners.find((corner) => shape[corner] === 12);
  });
  assert.equal(new Set(chosen).size, 4);
  assert.ok(
    corners.every((corner) =>
      [12, 40].includes(homeCardShape("balance", 40)[corner]),
    ),
  );
});
test("Home tones follow every accent and keep readable text in light, dark and AMOLED", () => {
  const { expressiveSurfaces } = loader()("theme/expressivePalette.ts");
  const Color = require("color").default;
  for (const primary of ["#006B5B", "#7950B5", "#BA1A1A", "#1565C0", "#FFDD00", "#000000", "#FFFFFF"]) {
    for (const [dark, amoled] of [[false, false], [true, false], [true, true]]) {
      const colors = { ...expressiveSurfaces(primary, dark, amoled), primary, onPrimaryContainer: dark ? "#FFFFFF" : "#000000" };
      const tones = ["greeting", "date", "drafts"].map(role => homeCardTone(role, { dark, colors }));
      assert.equal(new Set(tones.map(tone => tone[0])).size, 3);
      for (const [background, foreground] of tones) assert.ok(Color(foreground).contrast(Color(background)) >= 4.5);
      assert.notEqual(tones[0][0], homeCardTone("greeting", { dark, colors: { ...colors, primary: primary === "#006B5B" ? "#7950B5" : "#006B5B" } })[0]);
    }
  }
});
