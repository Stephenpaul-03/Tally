const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../test-support/load-ts.cjs");
const withSystemNavigationBar = loader({
  "expo/config-plugins": { withAndroidStyles: (_config, apply) => apply },
})("plugins/withSystemNavigationBar.js");

test("native regeneration preserves app styles and disables only the navigation contrast scrim", () => {
  const apply = withSystemNavigationBar({});
  const mod = {
    modResults: {
      resources: {
        style: [
          {
            $: { name: "AppTheme" },
            item: [
              { $: { name: "colorPrimary" }, _: "@color/colorPrimary" },
              {
                $: { name: "android:enforceNavigationBarContrast" },
                _: "true",
              },
            ],
          },
        ],
      },
    },
  };
  apply(mod);
  apply(mod);
  const items = mod.modResults.resources.style[0].item;
  assert.equal(items.length, 2);
  assert.equal(items[0]._, "@color/colorPrimary");
  assert.equal(items[1]._, "false");
});
