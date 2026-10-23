const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { homeGreeting } = loader()("modules/Main/homeGreeting.ts");
test("greetings change at local time boundaries, including overnight", () => {
  for (const hour of [22, 23, 0, 3])
    assert.equal(homeGreeting(hour), "Up late");
  for (const hour of [4, 5]) assert.equal(homeGreeting(hour), "An early start");
  for (const hour of [6, 11]) assert.equal(homeGreeting(hour), "Good morning");
  for (const hour of [12, 16])
    assert.equal(homeGreeting(hour), "Good afternoon");
  for (const hour of [17, 21]) assert.equal(homeGreeting(hour), "Good evening");
});
