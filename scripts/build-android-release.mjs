import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertFontsInstalled } from "./check-fonts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const abiArg = args.find(arg => arg.startsWith("--abi="));
const abi = abiArg?.slice(6) ?? "arm64-v8a";
const architectures = {
  "arm64-v8a": "arm64-v8a",
  "armeabi-v7a": "armeabi-v7a",
  "x86_64": "x86_64",
  universal: "armeabi-v7a,arm64-v8a,x86,x86_64",
};
const testSigning = args.includes("--test-signing");
if (!Object.hasOwn(architectures, abi) || args.some(arg => arg !== abiArg && arg !== "--test-signing")) {
  throw new Error("Usage: npm run build:android:release -- [--abi=arm64-v8a|armeabi-v7a|x86_64|universal] [--test-signing]");
}
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const signingNames = ["TALLY_ANDROID_KEYSTORE_PATH", "TALLY_ANDROID_KEYSTORE_PASSWORD", "TALLY_ANDROID_KEY_ALIAS", "TALLY_ANDROID_KEY_PASSWORD"];
const releaseSigned = signingNames.every(name => process.env[name]);
if (signingNames.some(name => process.env[name]) && !releaseSigned) throw new Error("Set all four TALLY_ANDROID signing variables or unset them all to build unsigned.");
if (testSigning && releaseSigned) throw new Error("Unset release signing variables before using --test-signing.");

assertFontsInstalled(root);
run("npm", ["run", "check:release"]);
run(process.execPath, ["node_modules/expo/bin/cli", "prebuild", "--platform", "android", "--no-install"]);
run(process.platform === "win32" ? "gradlew.bat" : "./gradlew", [
  ":app:assembleRelease", `-PreactNativeArchitectures=${architectures[abi]}`, "--console=plain",
  "-Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g",
  ...(testSigning ? ["-Ptally.allowDebugSigning=true"] : []),
], path.join(root, "android"));

const signed = releaseSigned || testSigning;
const source = path.join(root, "android/app/build/outputs/apk/release", signed ? "app-release.apk" : "app-release-unsigned.apk");
const version = JSON.parse(readFileSync(path.join(root, "app.json"))).expo.version;
const outputDir = path.join(root, "dist/releases");
mkdirSync(outputDir, { recursive: true });
const label = releaseSigned ? "signed" : testSigning ? "test-signed" : "unsigned";
const filename = `tally-${version}-${abi}-${label}.apk`;
const target = path.join(outputDir, filename);
copyFileSync(source, target);
const bytes = readFileSync(target);
writeFileSync(`${target}.sha256`, `${createHash("sha256").update(bytes).digest("hex")}  ${filename}\n`);
const mapping = path.join(root, "android/app/build/outputs/mapping/release/mapping.txt");
if (existsSync(mapping)) copyFileSync(mapping, path.join(outputDir, `${filename}.mapping.txt`));
console.log(`\nBuilt ${target}\nSize: ${(bytes.length / 1048576).toFixed(2)} MiB`);
if (!signed) console.log("Unsigned release APK: sign with your own key before installing or distributing.");
if (testSigning) console.log("Release-mode test APK signed with the development key. Do not publish this APK.");
