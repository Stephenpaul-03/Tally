/**
 * CryptoUtils.ts
 *
 * AES-256-GCM encrypt / decrypt.
 *
 * Crypto backend: react-native-quick-crypto
 *   Install: npm install react-native-quick-crypto
 *   (No native rebuild needed for Expo SDK 54+ with the New Architecture;
 *    older bare-workflow apps need `npx pod-install` / a new EAS build.)
 *
 * Why react-native-quick-crypto instead of expo-crypto?
 *   expo-crypto ~13–15 exposes hashing and RNG helpers but does NOT ship
 *   a SubtleCrypto shim. The `subtle` / `webcrypto` properties are absent
 *   at runtime, so AES-GCM and PBKDF2 are unavailable through that package.
 *   react-native-quick-crypto provides a fully-working webcrypto.subtle
 *   backed by OpenSSL on both iOS and Android.
 *
 * Key derivation: PBKDF2-SHA256  (100 000 iterations, 256-bit key)
 * Encryption:     AES-256-GCM    (128-bit auth tag, random 96-bit IV)
 * Encoding:       Base64 (pure-JS helpers, no native dependency)
 */

import webcrypto from "react-native-quick-crypto";
// expo-crypto is still used for getRandomValues — it's reliable for RNG.
import * as ExpoCrypto from "expo-crypto";

// ─── SubtleCrypto handle ──────────────────────────────────────────────────────

/**
 * Returns the SubtleCrypto instance from react-native-quick-crypto.
 * Throws a clear error if the library is not installed / linked correctly.
 */
function getSubtle(): SubtleCrypto {
  const subtle = webcrypto?.subtle;
  if (!subtle || typeof subtle.importKey !== "function") {
    throw new Error(
      "SubtleCrypto is not available. " +
        "Make sure react-native-quick-crypto is installed and the native " +
        "module is linked (run `npx pod-install` for bare iOS, or trigger " +
        "a new EAS build).",
    );
  }
  return subtle as unknown as SubtleCrypto;
}

// ─── Random bytes ─────────────────────────────────────────────────────────────

/**
 * Fill a Uint8Array with cryptographically random bytes.
 * expo-crypto's getRandomValues is reliable on all platforms for RNG.
 */
function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  // expo-crypto exposes getRandomValues through the standard interface
  ExpoCrypto.getRandomValues(buf);
  return buf;
}

// ─── Buffer helpers ───────────────────────────────────────────────────────────

/**
 * TypeScript 5.x tightened Uint8Array to Uint8Array<ArrayBufferLike>.
 * SubtleCrypto demands the concrete ArrayBuffer type, so we copy bytes into
 * a fresh one. Inputs are always tiny (12–32 bytes) so cost is negligible.
 */
function toBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

function bufToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary);
}

function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i) as number;
  }
  return bytes;
}

// ─── Key derivation ───────────────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

async function deriveKey(
  password: string,
  salt: Uint8Array,
  usage: KeyUsage[],
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const enc = new TextEncoder();

  const baseKey = await subtle.importKey(
    "raw",
    toBuffer(enc.encode(password)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    usage,
  );
}

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * The envelope written to / read from the .json export file when encryption
 * is enabled. The plain-JSON path is untouched (backwards-compatible).
 */
export type EncryptedEnvelope = {
  encrypted: true;
  version: 1;
  /** Base64-encoded 96-bit AES-GCM initialisation vector */
  iv: string;
  /** Base64-encoded 128-bit PBKDF2 salt */
  salt: string;
  /** Base64-encoded AES-GCM ciphertext (includes 128-bit auth tag) */
  data: string;
};

// ─── Encrypt ──────────────────────────────────────────────────────────────────

/**
 * Encrypt a JSON string with AES-256-GCM.
 *
 * @param plaintext  The serialised JSON you want to protect.
 * @param password   User-supplied passphrase (any length).
 * @returns          An {@link EncryptedEnvelope} ready to be JSON.stringify'd.
 */
export async function encryptJson(
  plaintext: string,
  password: string,
): Promise<EncryptedEnvelope> {
  const subtle = getSubtle();

  const salt = randomBytes(16); // 128-bit salt
  const iv   = randomBytes(12); // 96-bit IV (GCM standard)

  const key = await deriveKey(password, salt, ["encrypt"]);

  const cipherBuf = await subtle.encrypt(
    { name: "AES-GCM", iv: toBuffer(iv), tagLength: 128 },
    key,
    toBuffer(new TextEncoder().encode(plaintext)),
  );

  return {
    encrypted: true,
    version: 1,
    iv:   bufToBase64(iv),
    salt: bufToBase64(salt),
    data: bufToBase64(cipherBuf),
  };
}

// ─── Decrypt ──────────────────────────────────────────────────────────────────

/**
 * Decrypt an {@link EncryptedEnvelope} back to the original JSON string.
 *
 * @throws  If the password is wrong or the ciphertext is corrupted the
 *          SubtleCrypto layer throws a `DOMException` (OperationError).
 *          Catch this in the caller and show a friendly error to the user.
 */
export async function decryptEnvelope(
  envelope: EncryptedEnvelope,
  password: string,
): Promise<string> {
  const subtle = getSubtle();

  const salt = base64ToBuf(envelope.salt);
  const iv   = base64ToBuf(envelope.iv);
  const data = base64ToBuf(envelope.data);

  const key = await deriveKey(password, salt, ["decrypt"]);

  const plainBuf = await subtle.decrypt(
    { name: "AES-GCM", iv: toBuffer(iv), tagLength: 128 },
    key,
    toBuffer(data),
  );

  return new TextDecoder().decode(plainBuf);
}

// ─── Type guard ───────────────────────────────────────────────────────────────

/**
 * Returns `true` when the parsed JSON object looks like an {@link EncryptedEnvelope}.
 * Use this in the import path before attempting decryption.
 */
export function isEncryptedEnvelope(raw: unknown): raw is EncryptedEnvelope {
  if (typeof raw !== "object" || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return (
    obj.encrypted === true &&
    obj.version === 1 &&
    typeof obj.iv   === "string" &&
    typeof obj.salt === "string" &&
    typeof obj.data === "string"
  );
}

// ─── Runtime capability check ─────────────────────────────────────────────────

/**
 * Returns `true` when AES-GCM encryption is available at runtime.
 *
 * Checks that react-native-quick-crypto's webcrypto.subtle is present and
 * functional. Use this to gate the "Encrypt backup" toggle in the UI.
 *
 * Returns `true` on all Expo SDK 54 builds (iOS + Android) when
 * react-native-quick-crypto is installed and linked correctly.
 */
export function isEncryptionSupported(): boolean {
  try {
    const subtle = webcrypto?.subtle;
    return subtle != null && typeof subtle.importKey === "function";
  } catch {
    return false;
  }
}