const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");

function harness() {
  let cursor = 0;
  let focused = true;
  let starts = 0;
  const slots = [];
  const effects = [];
  class Value {
    constructor(value) {
      this.value = value;
      this.writes = 0;
    }
    setValue(value) {
      this.value = value;
      this.writes++;
    }
  }
  const React = {
    useRef(initial) {
      const i = cursor++;
      return (slots[i] ??= { current: initial });
    },
    useEffect(effect, deps) {
      const i = cursor++;
      const previous = slots[i];
      if (!previous || deps.some((v, j) => !Object.is(v, previous[j]))) {
        effects.push(effect);
        slots[i] = deps;
      }
    },
  };
  const animation = () => ({
    start() {
      starts++;
    },
    stop() {},
  });
  const { useStagger: renderStagger } = loader({
    react: React,
    "./Motion": { useMotionEnabled: () => true, useMotionFocus: () => focused },
    "react-native": {
      Animated: {
        Value,
        parallel: animation,
        timing: animation,
        sequence: animation,
        delay: animation,
      },
      Easing: { out: (v) => v, quad: "quad", cubic: "cubic" },
    },
  })("components/animations/UseStagger.tsx");
  return {
    render(options, focus = true) {
      focused = focus;
      cursor = 0;
      const result = renderStagger(options);
      while (effects.length) effects.shift()();
      return result;
    },
    get starts() {
      return starts;
    },
  };
}

test("a once-only list entrance survives rerenders and nested route round trips", () => {
  const h = harness();
  const options = {
    count: 4,
    replayOnFocus: false,
    replayOnCountChange: false,
  };
  const list = h.render(options);
  const opacity = list.getAnimStyle(0).opacity;
  const writes = opacity.writes;
  assert.equal(h.starts, 1);
  h.render(options);
  h.render(options, false);
  h.render(options, true);
  assert.equal(h.starts, 1, "return navigation must not restart an entrance");
  assert.equal(
    opacity.writes,
    writes,
    "push/pop must not reset or dim the first card",
  );
  const expanded = h.render({ ...options, count: 5 });
  assert.equal(h.starts, 1);
  assert.equal(expanded.getAnimStyle(4).opacity.value, 1);
  const nextVisit = harness();
  nextVisit.render(options);
  assert.equal(
    nextVisit.starts,
    1,
    "a newly mounted Settings visit still animates",
  );
});

test("a list mounted before focus waits for focus and still supports data-triggered entrances", () => {
  const h = harness();
  const options = { count: 2, dataKey: "first", replayOnFocus: false };
  h.render(options, false);
  assert.equal(h.starts, 0);
  h.render(options);
  assert.equal(h.starts, 1);
  h.render({ ...options, dataKey: "second" });
  assert.equal(h.starts, 2);
});

test("cards wait for the page frame before running one entrance", () => {
  const h = harness();
  const options = { count: 4, ready: false, replayOnFocus: false };
  const pending = h.render(options);
  assert.equal(h.starts, 0);
  assert.equal(pending.getAnimStyle(0).opacity.value, 0);
  h.render({ ...options, count: 6 });
  assert.equal(h.starts, 0, "measurement rerenders must not start cards early");
  h.render({ ...options, count: 6, ready: true });
  assert.equal(h.starts, 1);
  h.render({ ...options, count: 6, ready: true });
  assert.equal(h.starts, 1);
});
