const { withAppBuildGradle, withGradleProperties, withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs/promises");
const path = require("node:path");

const releaseProperties = {
  "android.enableMinifyInReleaseBuilds": "true",
  "android.enableShrinkResourcesInReleaseBuilds": "true",
  // Keep native libraries directly loadable instead of extracting them at install time.
  "expo.useLegacyPackaging": "false",
  "expo.gif.enabled": "false",
  "expo.webp.enabled": "false",
};

const signingSetup = `// Tally release signing: credentials stay outside source control.
def tallySigningNames = ["TALLY_ANDROID_KEYSTORE_PATH", "TALLY_ANDROID_KEYSTORE_PASSWORD", "TALLY_ANDROID_KEY_ALIAS", "TALLY_ANDROID_KEY_PASSWORD"]
def tallyHasReleaseKey = tallySigningNames.every { System.getenv(it) }
def tallyTestSigning = (findProperty("tally.allowDebugSigning") ?: "false").toBoolean()
if (gradle.startParameter.taskNames.any { it.toLowerCase().contains("release") } &&
    tallySigningNames.any { System.getenv(it) } && !tallyHasReleaseKey) {
    throw new GradleException("Incomplete Tally release signing credentials. Set all four TALLY_ANDROID signing variables.")
}
`;

const releaseSigning = `if (tallyHasReleaseKey) {
            release {
                storeFile file(System.getenv("TALLY_ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("TALLY_ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("TALLY_ANDROID_KEY_ALIAS")
                keyPassword System.getenv("TALLY_ANDROID_KEY_PASSWORD")
            }
        }`;

const scannerExclusions = `
// Tally has no barcode scanning. Expo's debug launcher brings ML Kit into
// release dependencies even though its release implementation never uses it.
configurations.matching { it.name.toLowerCase().contains("release") }.configureEach {
    exclude group: "com.google.mlkit"
    exclude group: "com.google.android.gms", module: "play-services-code-scanner"
    exclude group: "com.google.android.gms", module: "play-services-mlkit-barcode-scanning"
}
`;

function updateProguardRules(source) {
  if (source.includes("# Tally: Expo record reflection")) return source;
  return source + `
# Tally: Expo record reflection must retain converter/allocator implementations.
# Otherwise R8 class merging breaks SQLite OpenDatabaseOptions at startup.
-keep class expo.modules.kotlin.records.** { *; }
-keep class expo.modules.kotlin.allocators.** { *; }
-keep class expo.modules.kotlin.types.** { *; }
-keepattributes Signature,InnerClasses,EnclosingMethod,*Annotation*
`;
}

function updateAppBuildGradle(source) {
  const previewConfig = `
// Tally isolated release check: test builds never replace the user's installed app.
android.defaultConfig {
    if ((findProperty("tally.allowDebugSigning") ?: "false").toBoolean()) {
        applicationIdSuffix ".releasecheck"
    }
}
`;
  if (source.includes("// Tally release signing:")) {
    let result = source.includes("// Tally isolated release check:") ? source : source + previewConfig;
    if (!result.includes("// Tally has no barcode scanning.")) result += scannerExclusions;
    return result;
  }
  const releaseSigningPattern = /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
  if (!source.includes("signingConfigs {") || !releaseSigningPattern.test(source)) {
    throw new Error("Tally release plugin: unrecognized Android signing configuration.");
  }
  return source
    .replace("android {", `${signingSetup}\nandroid {`)
    .replace("signingConfigs {", `signingConfigs {\n        ${releaseSigning}`)
    .replace(releaseSigningPattern, "$1signingConfig tallyHasReleaseKey ? signingConfigs.release : (tallyTestSigning ? signingConfigs.debug : null)")
    .replace('getDefaultProguardFile("proguard-android.txt")', 'getDefaultProguardFile("proguard-android-optimize.txt")') + previewConfig + scannerExclusions;
}

function withAndroidRelease(config) {
  config = withGradleProperties(config, mod => {
    mod.modResults = mod.modResults.filter(item => item.type !== "property" || !(item.key in releaseProperties));
    for (const [key, value] of Object.entries(releaseProperties)) mod.modResults.push({ type: "property", key, value });
    return mod;
  });
  config = withAppBuildGradle(config, mod => {
    mod.modResults.contents = updateAppBuildGradle(mod.modResults.contents);
    return mod;
  });
  return withDangerousMod(config, ["android", async mod => {
    const file = path.join(mod.modRequest.platformProjectRoot, "app/proguard-rules.pro");
    const current = await fs.readFile(file, "utf8");
    await fs.writeFile(file, updateProguardRules(current));
    return mod;
  }]);
}

module.exports = withAndroidRelease;
module.exports.updateAppBuildGradle = updateAppBuildGradle;
module.exports.updateProguardRules = updateProguardRules;
