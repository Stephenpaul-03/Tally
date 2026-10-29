const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { initialPresence, reconcilePresence, settlePresence, presenceDeadline, settleExpiredPresence, mutationFrame } = loader()("modules/Management/Transaction/Components/mutationPresence.ts");
const key = (item) => item.id;
const row = (id) => ({ id });
test("inserting into an existing day retains the other rows and gives only the new row an entrance", () => {
  const a = row("a"), b = row("b"), c = row("c");
  const records = reconcilePresence(initialPresence([a, b], key), [c, a, b], key, 100);
  assert.deepEqual(records.map((r) => [r.key, r.phase]), [["c", "enter"], ["a", "steady"], ["b", "steady"]]);
  assert.equal(records[1].item, a);
});
test("deletion retains the row in its old flow slot until the single collapse/fade finishes", () => {
  const a = row("a"), b = row("b"), c = row("c");
  const records = reconcilePresence(initialPresence([a, b, c], key), [a, c], key, 100);
  assert.deepEqual(records.map((r) => [r.key, r.phase]), [["a", "steady"], ["b", "leave"], ["c", "steady"]]);
  const final = settlePresence(records, "b", records[1].version);
  assert.deepEqual(final.map((r) => r.key), ["a", "c"]);
});
test("interrupted removal can reverse smoothly and stale completion cannot remove the revived row", () => {
  const a = row("a");
  const leaving = reconcilePresence(initialPresence([a], key), [], key, 100);
  const revived = reconcilePresence(leaving, [a], key, 110);
  assert.equal(revived[0].phase, "enter");
  assert.equal(settlePresence(revived, "a", leaving[0].version), revived);
  assert.equal(settlePresence(revived, "a", revived[0].version)[0].phase, "steady");
});
test("rapid updates preserve pending exits without duplicate IDs or restarting their clock", () => {
  const a = row("a"), b = row("b"), c = row("c");
  const first = reconcilePresence(initialPresence([a, b], key), [b], key, 100);
  const next = reconcilePresence(first, [c, b], key, 110);
  assert.equal(next.filter((r) => r.key === "a").length, 1);
  assert.equal(next.find((r) => r.key === "a").changedAt, 100);
  assert.deepEqual(next.map((r) => r.key), ["a", "c", "b"]);
});
test("new/last day cards enter and leave as one retained record; settled recycled data stays still", () => {
  const day = row("2026-10-30");
  const entered = reconcilePresence([], [day], key, 100);
  const steady = settlePresence(entered, day.id, entered[0].version);
  assert.equal(reconcilePresence(steady, [day], key, 110)[0].phase, "steady");
  const leaving = reconcilePresence(steady, [], key, 120);
  assert.equal(leaving[0].phase, "leave");
  assert.deepEqual(settlePresence(leaving, day.id, leaving[0].version), []);
});

test("new rows start from the layout event even when the UI-thread height write is still pending", () => {
  const effects = [], timings = [], delays = [], shared = [];
  const React = {
    createContext: (value) => ({ value, Provider: "Provider" }),
    useContext: (context) => context.value,
    useRef: (current) => ({ current }),
    useCallback: (fn) => fn,
    useLayoutEffect: (effect) => effects.push(effect),
  };
  const animated = {
    __esModule: true,
    default: { View: "AnimatedView" },
    useSharedValue(initial) {
      const value = { current: initial, pending: undefined, get value() { return this.current; }, set value(next) { this.pending = next; } };
      shared.push(value);
      return value;
    },
    useAnimatedStyle: () => ({}),
    cancelAnimation: () => {},
    Easing: { out: (v) => v, cubic: "cubic" },
    withTiming: (target, config) => { timings.push({ target, config }); return target; },
    withDelay: (delay, target) => { delays.push(delay); return target; },
    runOnJS: (fn) => fn,
  };
  const { TransactionPresenceItem } = loader({
    react: React,
    "react-native": { View: "View" },
    "react-native-reanimated": animated,
    "@/components/animations/Motion": { useMotionEnabled: () => true },
  })("modules/Management/Transaction/Components/TransactionMutation.tsx");
  const tree = TransactionPresenceItem({ record: { key: "new", item: {}, phase: "enter", version: 1, changedAt: 0 }, complete: () => {}, register: () => () => {}, children: "row" });
  effects.forEach((effect) => effect());
  assert.equal(timings.length, 0, "wait for the first measurement");
  tree.props.children.props.onLayout({ nativeEvent: { layout: { height: 80 } } });
  assert.equal(shared[1].value, 0, "simulate the asynchronous UI-thread write");
  assert.equal(timings.length, 1, "the event height must start the entrance without waiting for a second event");
  assert.deepEqual(delays, [220]);
  assert.equal(timings[0].config.duration, 200);
  tree.props.children.props.onLayout({ nativeEvent: { layout: { height: 80 } } });
  assert.equal(timings.length, 1, "repeated layout events must not restart the animation");
});

test("a mounted saved row becomes visible even if its measurement callback never arrives", () => {
  const records = reconcilePresence([], [row("new")], key, 100);
  const mounted = new Set(["new:1"]);
  const deadline = presenceDeadline(100, 220, true);
  assert.equal(settleExpiredPresence(records, mounted, 220, deadline - 1), records);
  const recovered = settleExpiredPresence(records, mounted, 220, deadline);
  assert.equal(recovered[0].phase, "steady");
  assert.deepEqual(mutationFrame(0, 0, false, true), { height: "auto", opacity: 1 });
});
test("unmounted rows settle earlier while mounted rows retain time to finish their animation", () => {
  const records = reconcilePresence([], [row("on"), row("off")], key, 100);
  const recovered = settleExpiredPresence(records, new Set(["on:1"]), 220, presenceDeadline(100, 220, false));
  assert.equal(recovered.find((record) => record.key === "on").phase, "enter");
  assert.equal(recovered.find((record) => record.key === "off").phase, "steady");
});
test("completed row height explicitly returns to auto instead of retaining a native zero height", () => {
  assert.deepEqual(mutationFrame(1, 80, true, false), { height: "auto", opacity: 1 });
  assert.deepEqual(mutationFrame(0.5, 80, false, false), { height: 40, opacity: 0.5 });
});
