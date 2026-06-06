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
  crypto: require.resolve("react-native-quick-crypto"),
  buffer: require.resolve("@craftzdog/react-native-buffer"),
};

module.exports = config;
