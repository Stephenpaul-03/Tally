const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { ringArcs, spendingRingItems, spendingRingSegments } = loader()(
  "modules/Insights/spendingRingModel.ts",
);
const group = (name, amount, count = 1) => ({
  name,
  amount,
  count,
  previous: 0,
  previousCount: 0,
  share: 0,
  transactions: [],
});
test("spending legend preserves every current amount in three categories and a remainder", () => {
  const rows = [
    group("Rent", 15000),
    group("Food & Dining", 2850),
    group("Education", 2500),
    group("Shopping", 10000),
    group("Other Expense", 205),
    group("Previous only", 0, 0),
  ];
  const items = spendingRingItems(rows);
  assert.deepEqual(
    items.map((item) => item.label),
    ["Rent", "Food & Dining", "Education", "2 more"],
  );
  assert.equal(items[3].amount, 10205);
  assert.equal(items[3].group, null);
  assert.equal(items[0].group, rows[0]);
  assert.equal(
    items.reduce((sum, item) => sum + item.amount, 0),
    30555,
  );
  assert.ok(
    Math.abs(items.reduce((sum, item) => sum + item.share, 0) - 1) < 1e-12,
  );
});
test("ring geometry covers the circle once for a single category and arbitrary proportions", () => {
  for (const shares of [
    [1],
    [0.491, 0.093, 0.082, 0.334],
    [0.9, 0.1],
    [0.001, 0.999],
    [7, 2, 1],
    [0, 0.5, 0.5],
  ]) {
    const arcs = ringArcs(shares);
    let edge = 0;
    for (const arc of arcs) {
      assert.ok(arc.sweep > 0 && arc.sweep <= 180);
      assert.ok(Math.abs(arc.start - edge) < 1e-9);
      edge += arc.sweep;
      const expected =
        (shares[arc.index] / shares.reduce((sum, share) => sum + share, 0)) *
        360;
      assert.ok(arc.sweep <= expected + 1e-9);
    }
    assert.ok(Math.abs(edge - 360) < 1e-9);
  }
});
test("empty and recorded-zero data never invent chart segments or shares", () => {
  assert.deepEqual(spendingRingItems([]), []);
  const zero = spendingRingItems([group("Recorded zero", 0)]);
  assert.equal(zero[0].share, 0);
  assert.deepEqual(ringArcs([0, 0]), []);
  assert.deepEqual(ringArcs([NaN, -1, Infinity]), []);
  assert.equal(
    spendingRingItems([group("Only category", 0.1), group("Second", 0.2)])
      .length,
    2,
  );
});

test("ring keeps remainder categories separate while the legend stays compact", () => {
  const groups = [group("Rent", 50), group("Food & Dining", 20), group("Education", 15), group("Shopping", 10), group("Other Expense", 5), group("Previous", 0, 0)];
  const segments = spendingRingSegments(groups);
  const legend = spendingRingItems(groups);
  assert.equal(segments.length, 5);
  assert.equal(legend.length, 4);
  assert.deepEqual(segments.slice(0, 3).map(s => s.label), legend.slice(0, 3).map(s => s.label));
  assert.equal(segments.slice(3).reduce((sum, s) => sum + s.amount, 0), legend[3].amount);
  assert.ok(Math.abs(segments.reduce((sum, s) => sum + s.share, 0) - 1) < 1e-12);
  assert.equal(new Set(segments.map(s => s.group.name)).size, 5);
  assert.deepEqual(spendingRingSegments([]), []);
  assert.equal(spendingRingSegments([group("Zero", 0)])[0].share, 0);
});
