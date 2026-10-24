const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { tabBarGeometry, tabWeight, snapTabIndex, clampTabPosition } = loader()(
  "modules/Main/pagerGeometry.ts",
);
test("page drags and fast flings stay inside the three destinations", () => {
  assert.equal(clampTabPosition(-0.5), 0);
  assert.equal(clampTabPosition(3), 2);
  assert.equal(snapTabIndex(0.49), 0);
  assert.equal(snapTabIndex(0.51), 1);
  assert.equal(snapTabIndex(1.6), 2);
  assert.equal(snapTabIndex(0.4, 2), 1);
  assert.equal(snapTabIndex(0, -10), 0);
  assert.equal(snapTabIndex(2, 10), 2);
});
test("the navigation indicator follows partial drags without changing width or leaving its bar", () => {
  for (const width of [168, 326, 358, 414])
    for (const labels of [false, true])
      for (const position of [0, 0.1, 0.5, 0.9, 1, 1.4, 1.9, 2]) {
        const geometry = tabBarGeometry(width, position, labels);
        const itemWidths = [0, 1, 2].map(
          (index) =>
            geometry.base + geometry.extra * tabWeight(position, index),
        );
        assert.ok(
          Math.abs(
            itemWidths.reduce((a, b) => a + b, 0) + geometry.gap * 2 - width,
          ) < 0.0001,
        );
        assert.ok(geometry.pillLeft >= 0);
        assert.ok(geometry.pillLeft + geometry.pillWidth <= width + 0.0001);
      }
  const start = tabBarGeometry(358, 0),
    middle = tabBarGeometry(358, 0.5),
    end = tabBarGeometry(358, 1);
  assert.equal(start.pillWidth, end.pillWidth);
  assert.equal(middle.pillLeft, end.pillLeft / 2);
});

test("Home starts in the middle slot and dragging never resizes tab slots", () => {
  for (const width of [326, 358, 414]) {
    const home = tabBarGeometry(width, 1);
    assert.ok(
      Math.abs(home.pillLeft + home.pillWidth / 2 - width / 2) < 0.0001,
    );
    for (const position of [0, 0.2, 0.7, 1, 1.6, 2]) {
      const geometry = tabBarGeometry(width, position);
      assert.equal(geometry.base, home.base);
      assert.equal(geometry.extra, 0);
      assert.equal(geometry.pillWidth, home.pillWidth);
    }
  }
});

test("interrupted tab animations cannot commit old destinations", () => {
  const { settledTabIndex } = loader()("modules/Main/pagerGeometry.ts");
  // Home -> Transactions, interrupted by Insights; native may complete either old scroll.
  assert.equal(settledTabIndex(1, 2), null);
  assert.equal(settledTabIndex(0, 2), null);
  assert.equal(settledTabIndex(1.5, 2), null);
  assert.equal(settledTabIndex(2, 2), 2);
  // A delayed old completion must also be ignored after the latest one was accepted.
  assert.equal(settledTabIndex(0, 2), null);
  // A real finger drag releases the requested target and may select any page.
  assert.equal(settledTabIndex(0, -1), 0);
});

test("one screen swipe never skips the neighboring page, even with extreme velocity or distance", () => {
  const { clampSwipePosition, snapSwipeIndex } = loader()(
    "modules/Main/pagerGeometry.ts",
  );
  for (const origin of [0, 1, 2]) {
    for (const position of [-100, -1, 0, 0.4, 0.9, 1.2, 1.8, 2, 100]) {
      const clamped = clampSwipePosition(position, origin);
      assert.ok(Math.abs(clamped - origin) <= 1);
      assert.ok(clamped >= 0 && clamped <= 2);
      for (const velocity of [-1000, -10, 0, 10, 1000]) {
        const target = snapSwipeIndex(position, velocity, origin);
        assert.ok(Number.isInteger(target));
        assert.ok(Math.abs(target - origin) <= 1);
        assert.ok(target >= 0 && target <= 2);
      }
    }
  }
  assert.equal(snapSwipeIndex(0.8, 100, 0), 1);
  assert.equal(snapSwipeIndex(1.2, -100, 2), 1);
  assert.equal(snapSwipeIndex(0.2, 0, 0), 0);
  assert.equal(snapSwipeIndex(0.6, 0, 0), 1);
});

test("Classic pill tracks fractional page positions without resizing or crossing its rounded bar", () => {
  const { classicTabBarGeometry } = loader()("modules/Main/pagerGeometry.ts");
  for (const width of [280, 350, 720]) {
    const left = classicTabBarGeometry(width, 0);
    const middle = classicTabBarGeometry(width, 1);
    const right = classicTabBarGeometry(width, 2);
    const partial = classicTabBarGeometry(width, 0.5);
    assert.equal(partial.pillWidth, middle.pillWidth);
    assert.equal(partial.pillLeft, (left.pillLeft + middle.pillLeft) / 2);
    assert.ok(right.pillLeft + right.pillWidth <= width - 5);
    assert.equal(classicTabBarGeometry(width, -999).pillLeft, left.pillLeft);
    assert.equal(classicTabBarGeometry(width, 999).pillLeft, right.pillLeft);
  }
});

test("navigation pill may cross the entire bar while screen swipes remain adjacent", () => {
  const { clampTabPosition, snapTabIndex, snapSwipeIndex, tabWeight } =
    loader()("modules/Main/pagerGeometry.ts");
  assert.equal(snapTabIndex(clampTabPosition(2), 0), 2);
  assert.equal(snapTabIndex(clampTabPosition(0), 0), 0);
  assert.equal(snapSwipeIndex(2, 0, 0), 1);
  assert.equal(snapSwipeIndex(0, 0, 2), 1);
  assert.equal(tabWeight(0.5, 0), 0.5);
  assert.equal(tabWeight(0.5, 1), 0.5);
  assert.equal(tabWeight(1.5, 0), 0);
});
