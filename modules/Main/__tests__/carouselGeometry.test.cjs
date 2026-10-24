const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { carouselTarget } = loader()("modules/Main/carouselGeometry.ts");
test("cancelled carousel drags settle to a whole card across widths and card counts", () => {
  for (const width of [120, 230, 358, 600]) {
    for (const count of [0, 1, 2, 3, 12]) {
      for (const position of [-100, 0, 0.2, 0.49, 0.51, 1.4, 2.5, 100]) {
        const target = carouselTarget(position * width, width, count);
        assert.ok(Number.isInteger(target));
        assert.ok(target >= 0 && target <= Math.max(0, count - 1));
      }
    }
    assert.equal(carouselTarget(width * 0.49, width, 3), 0);
    assert.equal(carouselTarget(width * 0.51, width, 3), 1);
    assert.equal(carouselTarget(width * 1.51, width, 3), 2);
  }
});
test("carousel velocity follows the finger, clamps at both ends and tolerates an unmeasured viewport", () => {
  assert.equal(carouselTarget(100, 200, 3, 1000), 1);
  assert.equal(carouselTarget(100, 200, 3, -1000), 0);
  assert.equal(carouselTarget(100, 200, 3, 10000), 2);
  assert.equal(carouselTarget(100, 200, 3, -10000), 0);
  assert.equal(carouselTarget(100, 0, 3), 0);
});
