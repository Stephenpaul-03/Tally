const assert = require("node:assert/strict");
const test = require("node:test");
const { updateAppBuildGradle, updateProguardRules } = require("../../plugins/withAndroidRelease");

const template = `android {
    signingConfigs {
        debug { storeFile file('debug.keystore') }
    }
    buildTypes {
        debug { signingConfig signingConfigs.debug }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}`;

test("release signing defaults to unsigned and debug signing stays opt-in", () => {
  const result = updateAppBuildGradle(template);
  assert.match(result, /debug \{ signingConfig signingConfigs.debug \}/);
  assert.match(result, /signingConfig tallyHasReleaseKey \? signingConfigs.release : \(tallyTestSigning \? signingConfigs.debug : null\)/);
  assert.match(result, /getDefaultProguardFile\("proguard-android-optimize.txt"\)/);
  assert.match(result, /Incomplete Tally release signing credentials/);
  assert.match(result, /applicationIdSuffix ".releasecheck"/);
  assert.equal(updateAppBuildGradle(result), result);
});

test("scanner exclusions apply only to release configurations", () => {
  const result = updateAppBuildGradle(template);
  assert.match(result, /configurations.matching \{ it.name.toLowerCase\(\).contains\("release"\)/);
  assert.match(result, /exclude group: "com.google.mlkit"/);
  assert.match(result, /module: "play-services-code-scanner"/);
});

test("unrecognized native templates fail rather than silently retaining debug release signing", () => {
  assert.throws(() => updateAppBuildGradle("android {}"), /unrecognized Android signing/);
});

test("reflection rules protect Expo bridge conversion and survive repeated prebuilds", () => {
  const result = updateProguardRules("# Existing rules\n");
  assert.match(result, /-keep class expo.modules.kotlin.records.\*\*/);
  assert.match(result, /-keep class expo.modules.kotlin.allocators.\*\*/);
  assert.match(result, /-keep class expo.modules.kotlin.types.\*\*/);
  assert.equal(updateProguardRules(result), result);
});
