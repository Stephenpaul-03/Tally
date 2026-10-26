const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { validGoal, goalProgress } = loader()("modules/Goals/model.ts");
const goal = {
  id: "g",
  workspaceId: "personal",
  name: "Trip",
  icon: "airplane",
  reason: "See family",
  target: 1000,
  saved: 200,
  currencyCode: "INR",
  currencySymbol: "₹",
  createdAt: "2026-10-25",
  updatedAt: "2026-10-25",
};
test("goals accept optional dates, reject malformed/negative amounts and invalid calendar dates", () => {
  assert.ok(validGoal(goal));
  assert.ok(validGoal({ ...goal, deadline: "2028-02-29" }));
  for (const edit of [
    { target: 0 },
    { saved: -1 },
    { deadline: "2026-02-30" },
    { deadline: "2026-13-01" },
    { name: "" },
    { target: Infinity },
  ])
    assert.equal(validGoal({ ...goal, ...edit }), false);
});
test("manual progress is bounded for display while preserving overachievement", () => {
  assert.deepEqual(goalProgress(goal), {
    fraction: 0.2,
    remaining: 800,
    complete: false,
  });
  assert.deepEqual(goalProgress({ ...goal, saved: 1200 }), {
    fraction: 1,
    remaining: 0,
    complete: true,
  });
});
