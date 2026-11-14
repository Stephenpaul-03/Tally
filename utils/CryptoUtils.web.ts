/** Browser Web Crypto implementation used by Expo web and Electron. */
export type EncryptedEnvelope = {
  encrypted: true;
  version: 1;
  iv: string;
  salt: string;
  data: string;
};

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof subtle.importKey !== "function") {
    throw new Error("Web Crypto is unavailable in this runtime.");
  }
  return subtle;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const baseKey = await subtle.importKey(
    "raw",
    toBuffer(new TextEncoder().encode(password)),
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
    usages,
  );
}

export async function encryptJson(
  plaintext: string,
  password: string,
): Promise<EncryptedEnvelope> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt, ["encrypt"]);
  const ciphertext = await getSubtle().encrypt(
    { name: "AES-GCM", iv: toBuffer(iv), tagLength: 128 },
    key,
    toBuffer(new TextEncoder().encode(plaintext)),
  );
  return {
    encrypted: true,
    version: 1,
    iv: toBase64(iv),
    salt: toBase64(salt),
    data: toBase64(ciphertext),
  };
}

export async function decryptEnvelope(
  envelope: EncryptedEnvelope,
  password: string,
): Promise<string> {
  const key = await deriveKey(password, fromBase64(envelope.salt), ["decrypt"]);
  const plaintext = await getSubtle().decrypt(
    {
      name: "AES-GCM",
      iv: toBuffer(fromBase64(envelope.iv)),
      tagLength: 128,
    },
    key,
    toBuffer(fromBase64(envelope.data)),
  );
  return new TextDecoder().decode(plaintext);
}

export function isEncryptedEnvelope(raw: unknown): raw is EncryptedEnvelope {
  if (typeof raw !== "object" || raw === null) return false;
  const value = raw as Record<string, unknown>;
  return value.encrypted === true && value.version === 1 &&
    typeof value.iv === "string" && typeof value.salt === "string" &&
    typeof value.data === "string";
}

export function isEncryptionSupported(): boolean {
  return typeof globalThis.crypto?.subtle?.importKey === "function";
}
