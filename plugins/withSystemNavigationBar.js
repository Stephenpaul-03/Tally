const { withAndroidStyles } = require("expo/config-plugins");

// Expo restores this theme flag after React Native enables edge-to-edge.
// Tally draws the bar surface and supplies contrasting system-button colors.
module.exports = function withSystemNavigationBar(config) {
  return withAndroidStyles(config, (mod) => {
    const appTheme = mod.modResults.resources.style?.find(
      (style) => style.$.name === "AppTheme",
    );
    if (!appTheme) throw new Error("Tally system bars: missing AppTheme");
    appTheme.item ??= [];
    const existing = appTheme.item.find(
      (item) => item.$.name === "android:enforceNavigationBarContrast",
    );
    if (existing) existing._ = "false";
    else
      appTheme.item.push({
        $: {
          name: "android:enforceNavigationBarContrast",
          "tools:targetApi": "29",
        },
        _: "false",
      });
    return mod;
  });
};
