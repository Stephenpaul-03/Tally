// global.ts
import { Buffer as BufferPolyfill } from "@craftzdog/react-native-buffer";
import "react-native-get-random-values";

declare global {
  var Buffer: typeof BufferPolyfill;
}

globalThis.Buffer = BufferPolyfill;
