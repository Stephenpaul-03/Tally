const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");

function preferenceHarness(savedSide) {
  const stored = new Map([["tabletNavigationSide", savedSide]]);
  const slots = [];
  let cursor = 0;
  const effects = [];
  const changed = (old, next) => !old || next.some((value, index) => value !== old[index]);
  const React = {
    createContext: () => ({ Provider: "Provider" }),
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial, set: (value) => { slots[index].value = value; } };
      return [slots[index].value, slots[index].set];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!changed(previous?.deps, deps)) return;
      previous?.cleanup?.();
      const slot = slots[index] = { deps };
      effects.push(() => { slot.cleanup = effect(); });
    },
    useMemo(factory, deps) {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) slots[index] = { deps, value: factory() };
      return slots[index].value;
    },
    useCallback(callback, deps) {
      const remember = React.useMemo;
      return remember(() => callback, deps);
    },
  };
  const { TabBarModePreferenceProvider } = loader({
    react: React,
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "@react-native-async-storage/async-storage": {
      getItem: async (key) => stored.get(key) ?? null,
      setItem: async (key, value) => { stored.set(key, value); },
    },
  })("components/tabbar/TabBarModePreference.tsx");
  return {
    stored,
    render() {
      cursor = 0;
      return TabBarModePreferenceProvider({ children: null }).props.value;
    },
    async flush() {
      effects.splice(0).forEach((effect) => effect());
      await new Promise(setImmediate);
    },
    close() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}

test("tablet navigation restores the selected side and persists changes across reopen", async () => {
  const h = preferenceHarness("right");
  try {
    h.render();
    await h.flush();
    const value = h.render();
    assert.equal(value.tabletNavigationSide, "right");
    value.setTabletNavigationSide("left");
    h.render();
    await h.flush();
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(h.stored.get("tabletNavigationSide"), "left");
    const reopened = preferenceHarness(h.stored.get("tabletNavigationSide"));
    reopened.render();
    await reopened.flush();
    assert.equal(reopened.render().tabletNavigationSide, "left");
    reopened.close();
  } finally { h.close(); }
});

test("unknown saved navigation sides fall back to the left", async () => {
  const h = preferenceHarness("invalid");
  try {
    h.render();
    await h.flush();
    assert.equal(h.render().tabletNavigationSide, "left");
  } finally { h.close(); }
});

test("tablet device detection covers 600-720dp portrait displays and excludes phones", () => {
  let dimensions;
  const readTablet = loader({ "react-native": { Platform: { OS: "android" }, Dimensions: { get: () => dimensions }, useWindowDimensions: () => dimensions } })("hooks/use-tablet-layout.ts").useTabletLayout;
  for (const [width, height, expected] of [[720, 1152, true], [1152, 720, true], [600, 960, true], [800, 1280, true], [1280, 800, true], [390, 844, false], [844, 390, false]]) {
    dimensions = { width, height };
    assert.equal(readTablet(), expected);
  }
});

test("a smaller native window does not turn the tablet into a phone; browser layouts use the viewport", () => {
  const platform = { OS: "android" };
  let window = { width: 720, height: 400 };
  const readTablet = loader({ "react-native": { Platform: platform, Dimensions: { get: () => ({ width: 720, height: 1152 }) }, useWindowDimensions: () => window } })("hooks/use-tablet-layout.ts").useTabletLayout;
  assert.equal(readTablet(), true);
  window = { width: 1152, height: 400 };assert.equal(readTablet(), true);
  platform.OS = "web";assert.equal(readTablet(), false);
  window = { width: 720, height: 1152 };assert.equal(readTablet(), true);
});
