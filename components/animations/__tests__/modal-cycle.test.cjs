/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");
function harness() {
  let cursor = 0;
  const slots = [],
    effects = [],
    timings = [];
  const React = {
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
  const native = {
    useWindowDimensions: () => ({ height }),
    Platform: { OS: "android" },
    StyleSheet: { absoluteFillObject: {} },
    BackHandler: { addEventListener: () => ({ remove() {} }) },
    Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) },
  };
  const aliases = {
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
      withTiming: (value, options) => {
        timings.push({ value, options });
        return value === 1 ? 0.2 : value;
      },
      Easing: { bezier() {}, out() {}, cubic() {} },
    },
    "react-native-safe-area-context": {
      useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
    },
    "@/hooks/use-addon-prefs": {
      useAddonPrefs: () => ({ animationsEnabled: true }),
    },
    "@/hooks/use-escape-to-close": { useEscapeToClose() {} },
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
  return {
    render(visible, windowHeight = 844) {
      cursor = 0;
      height = windowHeight;
      return loaded.exports.AnimatedPaperModal({
        visible,
        onDismiss() {},
        presentation: "sheet",
        children: "content",
      });
    },
    flush() {
      while (effects.length) effects.shift()();
    },
    layout,
    timings,
  };
}
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
