const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  loader,
} = require("../../../../../../scripts/test-support/load-ts.cjs");

function harness() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const react = {
    useState(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = value;
      return [
        slots[index],
        (next) => {
          slots[index] = typeof next === "function" ? next(slots[index]) : next;
        },
      ];
    },
    useRef(value) {
      const index = cursor++;
      return (slots[index] ??= { current: value });
    },
    useCallback(callback) {
      return callback;
    },
    useEffect(effect) {
      effects.push(effect);
    },
    useLayoutEffect(effect) {
      effects.push(effect);
    },
  };
  const { useTransactionPresentation: invokePresentation } = loader({ react })(
    "modules/Management/Transaction/Components/TransactionModal/useTransactionPresentation.ts",
  );
  const requests = [];
  const props = {
    isOpen: true,
    mode: "view",
    transactionId: "transaction-1",
    onEdit: (id) => requests.push(id),
  };
  return {
    props,
    requests,
    render() {
      cursor = 0;
      effects = [];
      return invokePresentation(props);
    },
    flush() {
      effects.forEach((effect) => effect());
      effects = [];
    },
  };
}

test("View exits once, then Edit gets a new panel and waits for its content", () => {
  const h = harness();
  const view = h.render();
  h.flush();
  view.requestEdit();
  view.requestEdit();
  const closing = h.render();
  h.flush();
  assert.equal(closing.visible, false);
  assert.equal(closing.presentationId, view.presentationId);
  assert.deepEqual(h.requests, []);
  closing.onHidden();
  const waiting = h.render();
  h.flush();
  assert.deepEqual(h.requests, ["transaction-1"]);
  assert.notEqual(waiting.presentationId, view.presentationId);
  assert.equal(
    waiting.visible,
    false,
    "old View content must never reopen while Edit is pending",
  );
  waiting.onHidden();
  assert.deepEqual(h.requests, ["transaction-1"]);
  h.props.mode = "edit";
  assert.equal(h.render().visible, false);
  h.flush();
  const edit = h.render();
  h.flush();
  assert.equal(edit.visible, true);
  assert.equal(edit.presentationId, waiting.presentationId);
});

test("closing the transaction during the handoff cancels Edit", () => {
  const h = harness();
  h.render().requestEdit();
  h.flush();
  h.render();
  h.flush();
  h.props.isOpen = false;
  const closed = h.render();
  h.flush();
  closed.onHidden();
  assert.deepEqual(h.requests, []);
  assert.equal(h.render().visible, false);
});
