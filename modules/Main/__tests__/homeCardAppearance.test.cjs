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
test("greeting, date and draft cards have distinct tones in both color modes", () => {
  for (const dark of [false, true]) {
    assert.equal(
      new Set(
        ["greeting", "date", "drafts"].map(
          (role) => homeCardTone(role, dark)[0],
        ),
      ).size,
      3,
    );
  }
});
