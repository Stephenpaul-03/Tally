const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../scripts/test-support/load-ts.cjs");
const { normalizeMainDesign } = loader()("hooks/main-design-preference.ts");
test("Expressive layout migrates incompatible stored Classic themes to Expressive", () => {
  assert.deepEqual(normalizeMainDesign({ layout: "sage", style: "classic" }), {
    layout: "sage",
    style: "sage",
  });
  assert.deepEqual(normalizeMainDesign({}), { layout: "sage", style: "sage" });
});
test("Classic layout always migrates to its matching style", () => {
  for (const style of ["sage", "classic"])
    assert.deepEqual(normalizeMainDesign({ layout: "classic", style }), {
      layout: "classic",
      style: "classic",
    });
});
