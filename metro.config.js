const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// Work around packages that publish a broken/unsupported "module" entry.
// Prefer the CommonJS "main" entry when present.
config.resolver.resolverMainFields = ["react-native", "main", "module"];

// Allow Metro to bundle .wasm files (required for expo-sqlite web support)
config.resolver.assetExts.push("wasm");

// Polyfill Node built-ins required by react-native-quick-crypto
config.resolver.extraNodeModules = {
  stream: require.resolve("readable-stream"),
  buffer: require.resolve("@craftzdog/react-native-buffer"),
};

const browserBuffer = require.resolve("buffer/");
const nativeCrypto = require.resolve("react-native-quick-crypto");
const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // react-native-quick-crypto depends on native TurboModules and cannot load
  // in Electron's browser renderer. Keep the Node crypto shim on native only.
  if (platform !== "web" && moduleName === "crypto") {
    return { filePath: nativeCrypto, type: "sourceFile" };
  }
  if (platform === "web" && moduleName === "react-native-quick-base64") {
    // The buffer package only needs base64-js in web. This package's native
    // entry eagerly requests a TurboModule, which crashes Electron at boot.
    return { filePath: require.resolve("base64-js"), type: "sourceFile" };
  }
  if (platform === "web" && moduleName === "buffer") {
    return { filePath: browserBuffer, type: "sourceFile" };
  }
  return previousResolveRequest
    ? previousResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
