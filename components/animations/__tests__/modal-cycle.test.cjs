/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
function harness({ windowWidth = 390, safeInsets = { top: 0, bottom: 0, left: 0, right: 0 } } = {}) {
  let cursor = 0;
  const slots = [],
    effects = [],
    timings = [];
  const React = {
    useContext: () => false,
    useRef(value) {
      const i = cursor++;
      return (slots[i] ??= { current: value });
    },
    useState(value) {
      const ref = React.useRef(value);
      return [
        ref.current,
        (v) => {
          ref.current = typeof v === "function" ? v(ref.current) : v;
        },
      ];
    },
    useEffect(effect) {
      effects.push(effect);
    },
    useCallback(callback) {
      return callback;
    },
    createElement(type, props, ...children) {
      return { type, props: { ...props, children } };
    },
  };
  let height = 844;
  let screen;
  const keyboardListeners = new Map();
  const native = {
    ScrollView: "ScrollView",
    useWindowDimensions: () => ({ width: windowWidth, height }),
    Dimensions: { get: () => screen || { width: windowWidth, height } },
    Platform: { OS: "android" },
    StyleSheet: { absoluteFillObject: {}, flatten: (style) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean)) },
    BackHandler: { addEventListener: () => ({ remove() {} }) },
    Keyboard: { dismiss() {}, addListener: (event, callback) => {
      keyboardListeners.set(event, callback);
      return { remove: () => keyboardListeners.delete(event) };
    } },
  };
  const aliases = {
    "@/hooks/use-tablet-layout": loader({ "react-native": native })("hooks/use-tablet-layout.ts"),
    react: React,
    "react-native": native,
    "react-native-paper": {
      useTheme: () => ({ colors: {} }),
      Portal: "Portal",
    },
    "react-native-gesture-handler": {
      Gesture: { Pan: () => new Proxy({}, { get: (_, key) => () => pan }) },
    },
    "react-native-reanimated": {
      useSharedValue: (value) => {
        const ref = React.useRef({ value });
        return ref.current;
      },
      useAnimatedStyle: (style) => style(),
      useReducedMotion: () => false,
      cancelAnimation() {},
      runOnJS: (callback) => callback,
      withTiming: (value, options, complete) => {
        timings.push({ value, options, complete });
        return value === 1 ? 0.2 : value;
      },
      Easing: { bezier() {}, out() {}, cubic() {} },
    },
    "react-native-safe-area-context": {
      useSafeAreaInsets: () => safeInsets,
    },
    "@/hooks/use-addon-prefs": {
      useAddonPrefs: () => ({ animationsEnabled: true }),
    },
    "@/hooks/use-escape-to-close": { useEscapeToClose() {} },
    "@/modules/Settings/Layouts/SettingsDetailContext": {
      InlineSettingsModalContext: { Provider: ({ children }) => children[0] },
      SettingsDetailContext: { Provider: ({ children }) => children[0] },
    },
  };
  const pan = new Proxy({}, { get: () => () => pan });
  const file = path.resolve(__dirname, "../../modal/modal.tsx");
  const loaded = new Module(file, module);
  loaded.require = (id) => aliases[id] ?? {};
  loaded._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    file,
  );
  function layout(node, size) {
    if (!node || typeof node !== "object") return;
    node.props?.onLayout?.({ nativeEvent: { layout: { height: size } } });
    node.props?.children?.flat().forEach((child) => layout(child, size));
  }
  function renderComponents(node) {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map(renderComponents);
    if (typeof node.type === "function") return renderComponents(node.type(node.props));
    return { ...node, props: { ...node.props, children: node.props.children.map(renderComponents) } };
  }
  return {
    render(visible, windowHeight = 844, onHidden, extraProps = {}) {
      cursor = 0;
      height = windowHeight;
      screen ??= { width: windowWidth, height: windowHeight };
      return renderComponents(loaded.exports.AnimatedPaperModal({
        visible,
        onDismiss() {},
        onHidden,
        presentation: "sheet",
        children: "content",
        ...extraProps,
      }));
    },
    keyboard(event, coordinates) {
      keyboardListeners.get(event)?.({ endCoordinates: coordinates });
    },
    flush() {
      while (effects.length) effects.shift()();
    },
    layout,
    timings,
  };
}
function findNode(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of node.props?.children?.flat(Infinity) ?? []) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return null;
}
const flattenStyle = (style) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

test("tablet auto-height dialogs get a bounded scroll surface without changing phone sheets", () => {
  for (const [windowWidth, windowHeight] of [[1200, 800], [800, 1200], [720, 1112]]) {
    const tree = harness({ windowWidth }).render(true, windowHeight, undefined, { scrollable: true });
    const scroll = findNode(tree, node => node.type === "ScrollView");
    assert.ok(scroll);
    assert.equal(scroll.props.nestedScrollEnabled, true);
    assert.equal(flattenStyle(scroll.props.style).minHeight, 0);
    assert.equal(scroll.props.contentContainerStyle.flexGrow, 0);
    const panel = flattenStyle(findNode(tree, node => Boolean(node.props?.onLayout)).props.style);
    assert.equal(panel.maxHeight, windowHeight - 48);
    assert.equal(panel.height, undefined);
  }
  const phone = harness().render(true, 844, undefined, { scrollable: true });
  assert.equal(findNode(phone, node => node.type === "ScrollView"), null);
});

test("dialog content drops tablet insets while phones and full screens retain them", () => {
  let dimensions = { width: 800, height: 1200 };
  const insets = { top: 24, bottom: 34, left: 12, right: 8 };
  const file = path.resolve(__dirname, "../../../hooks/use-modal-insets.ts");
  const loaded = new Module(file, module);
  const native = { Platform: { OS: "android" }, Dimensions: { get: () => dimensions }, useWindowDimensions: () => dimensions };
  const tabletHook = loader({ "react-native": native })("hooks/use-tablet-layout.ts");
  loaded.require = (id) => id === "./use-tablet-layout" ? tabletHook
    : id === "react-native" ? native : { useSafeAreaInsets: () => insets };
  loaded._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, file);
  const readInsets = loaded.exports.useModalInsets;
  for (const [width, height] of [[800, 1200], [1200, 800], [720, 1112]]) {
    dimensions = { width, height };
    assert.deepEqual(readInsets(), { top: 0, bottom: 0, left: 0, right: 0 });
    assert.equal(readInsets(false), insets);
  }
  for (const [width, height] of [[390, 844], [844, 390]]) {
    dimensions = { width, height };
    assert.equal(readInsets(), insets);
  }
});

test("centered tablet cards keep system insets outside and balance all four inside edges", () => {
  const safeInsets = { top: 24, bottom: 34, left: 12, right: 8 };
  for (const [windowWidth, windowHeight] of [[1200, 800], [800, 1200]]) {
    const tree = harness({ windowWidth, safeInsets }).render(true, windowHeight);
    const panel = flattenStyle(findNode(tree, (node) => Boolean(node.props?.onLayout)).props.style);
    const frame = flattenStyle(findNode(tree, (node) => node.props?.pointerEvents === "box-none").props.style);
    assert.deepEqual([panel.paddingTop, panel.paddingBottom, panel.paddingLeft, panel.paddingRight], [8, 8, 8, 8]);
    assert.equal(panel.maxHeight, windowHeight - 24 - 34 - 48);
    assert.equal(frame.marginTop, 24);
    assert.equal(frame.marginBottom, 34);
    assert.equal(frame.marginLeft, 12);
    assert.equal(frame.marginRight, 8);
    assert.equal(frame.padding, 24);
  }
});

test("phone sheets retain bottom safe-area padding without tablet card padding", () => {
  const tree = harness({ safeInsets: { top: 24, bottom: 34, left: 0, right: 0 } }).render(true);
  const panel = flattenStyle(findNode(tree, (node) => Boolean(node.props?.onLayout)).props.style);
  const frame = flattenStyle(findNode(tree, (node) => node.props?.pointerEvents === "box-none").props.style);
  assert.equal(panel.paddingBottom, 34);
  assert.equal(panel.paddingLeft, undefined);
  assert.equal(frame.marginTop, 0);
  assert.equal(frame.padding, undefined);
});

test("sheet entrance starts once when layout arrives before the visibility effect", () => {
  const h = harness();
  const tree = h.render(true);
  h.layout(tree, 200);
  h.flush();
  h.layout(tree, 700);
  h.render(true, 800);
  h.flush();
  assert.equal(h.timings.filter((t) => t.value === 1).length, 1);
});
test("closed sheets open once per presentation across delayed layout and content growth", () => {
  const h = harness();
  h.render(false);
  h.flush();
  h.render(true);
  h.flush();
  let tree = h.render(true);
  h.flush();
  h.layout(tree, 200);
  h.layout(tree, 700);
  h.render(true);
  h.flush();
  assert.equal(h.timings.filter((t) => t.value === 1).length, 1);
  h.render(false);
  h.flush();
  h.render(true);
  h.flush();
  tree = h.render(true);
  h.flush();
  h.layout(tree, 650);
  assert.equal(h.timings.filter((t) => t.value === 1).length, 2);
});

test("content measurements cannot move a partially opened sheet back toward its starting edge", () => {
  const h = harness();
  let tree = h.render(true);
  h.layout(tree, 200);
  h.flush();
  tree = h.render(true);
  h.flush();
  function offset(node) {
    if (!node || typeof node !== "object") return undefined;
    if (node.props?.onLayout)
      return node.props.style.at(-1).transform[0].translateY;
    for (const child of node.props?.children?.flat() ?? []) {
      const value = offset(child);
      if (value !== undefined) return value;
    }
  }
  const before = offset(tree);
  h.layout(tree, 700);
  tree = h.render(true, 760);
  h.flush();
  assert.equal(offset(tree), before);
  assert.equal(before, 844 * 0.8);
});

test("after-exit handoff waits for completion and ignores interrupted closes", () => {
  const h = harness();
  let exits = 0;
  const afterExit = () => exits++;
  const tree = h.render(true, 844, afterExit);
  h.layout(tree, 400);
  h.flush();
  h.render(false, 844, afterExit);
  h.flush();
  const interruptedExit = h.timings.at(-1);
  assert.equal(exits, 0);
  interruptedExit.complete(false);
  assert.equal(exits, 0);
  h.render(true, 844, afterExit);
  h.flush();
  interruptedExit.complete(true);
  assert.equal(exits, 0);
  h.render(false, 844, afterExit);
  h.flush();
  h.timings.at(-1).complete(true);
  assert.equal(
    exits,
    0,
    "animation completion must not reopen a still-mounted panel",
  );
  assert.equal(h.render(false, 844, afterExit), null);
  h.flush();
  assert.equal(exits, 1);
});

test("an after-exit reopen starts once after the old panel unmounts", () => {
  const h = harness();
  let visible = true;
  const reopen = () => {
    visible = true;
  };
  let tree = h.render(visible, 844, reopen);
  h.layout(tree, 300);
  h.flush();
  visible = false;
  h.render(visible, 844, reopen);
  h.flush();
  h.timings.at(-1).complete(true);
  assert.equal(visible, false);
  assert.equal(h.render(visible, 844, reopen), null);
  h.flush();
  assert.equal(visible, true);
  assert.equal(h.render(visible, 844, reopen), null);
  h.flush();
  tree = h.render(visible, 844, reopen);
  h.layout(tree, 650); // New edit form is taller than the read-only panel.
  h.flush();
  h.layout(tree, 700);
  h.render(visible, 844, reopen);
  h.flush();
  assert.equal(h.timings.filter((t) => t.value === 1).length, 2);
});


test("centered keyboard-aware dialogs reserve only the keyboard overlap and restore on hide", () => {
  const h = harness({ windowWidth: 1200 });
  h.render(true, 800, undefined, { keyboardAware: true });
  h.flush();
  h.keyboard("keyboardDidShow", { height: 360, screenY: 440 });
  let tree = h.render(true, 800, undefined, { keyboardAware: true });
  const frame = () => flattenStyle(findNode(tree, node => node.props?.pointerEvents === "box-none").props.style);
  assert.equal(frame().marginBottom, 360);
  h.keyboard("keyboardDidHide");
  tree = h.render(true, 800, undefined, { keyboardAware: true });
  assert.equal(frame().marginBottom, 0);
  // A window already resized by Android must not subtract the keyboard twice.
  h.render(true, 600, undefined, { keyboardAware: true });
  h.flush();
  h.keyboard("keyboardDidShow", { height: 360, screenY: 600 });
  tree = h.render(true, 600, undefined, { keyboardAware: true });
  assert.equal(frame().marginBottom, 0);
});
