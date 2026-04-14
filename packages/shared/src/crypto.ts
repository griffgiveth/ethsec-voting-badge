import { ml_kem768 } from "@noble/post-quantum/ml-kem";
import { gcm } from "@noble/ciphers/aes";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha2";
import { randomBytes } from "@noble/hashes/utils";
import { bytesToHex, utf8ToBytes, bytesToUtf8 } from "@noble/hashes/utils";
import { encodeBundle, decodeBundle, type Bundle } from "./bundle.js";

const HKDF_SALT = utf8ToBytes("ethsec-voting-badge-v1");
const HKDF_INFO = utf8ToBytes("aes-256-gcm");

const b64 = {
  enc: (u: Uint8Array) => Buffer.from(u).toString("base64"),
  dec: (s: string) => new Uint8Array(Buffer.from(s, "base64")),
};

export function sha256Hex(data: string | Uint8Array): `0x${string}` {
  const bytes = typeof data === "string" ? utf8ToBytes(data) : data;
  return ("0x" + bytesToHex(sha256(bytes))) as `0x${string}`;
}

export function encryptPayload(plaintext: object, publicKey: Uint8Array): { bundleB64: string; bundleHash: `0x${string}` } {
  const { cipherText: kemCT, sharedSecret } = ml_kem768.encapsulate(publicKey);
  const aesKey = hkdf(sha256, sharedSecret, HKDF_SALT, HKDF_INFO, 32);
  const aesNonce = randomBytes(12);
  const aead = gcm(aesKey, aesNonce);
  const pt = utf8ToBytes(JSON.stringify(plaintext));
  const sealed = aead.encrypt(pt);
  // AES-GCM returns ciphertext||tag; split at length-16
  const tag = sealed.slice(sealed.length - 16);
  const ct  = sealed.slice(0, sealed.length - 16);
  const bundle: Bundle = {
    v: 1,
    kemCiphertext: b64.enc(kemCT),
    aesNonce: b64.enc(aesNonce),
    aesCiphertext: b64.enc(ct),
    aesTag: b64.enc(tag),
  };
  const bundleB64 = encodeBundle(bundle);
  return { bundleB64, bundleHash: sha256Hex(bundleB64) };
}

export function decryptBundle(bundleB64: string, secretKey: Uint8Array): unknown {
  const b = decodeBundle(bundleB64);
  const kemCT = b64.dec(b.kemCiphertext);
  const sharedSecret = ml_kem768.decapsulate(kemCT, secretKey);
  const aesKey = hkdf(sha256, sharedSecret, HKDF_SALT, HKDF_INFO, 32);
  const aead = gcm(aesKey, b64.dec(b.aesNonce));
  const sealed = new Uint8Array([...b64.dec(b.aesCiphertext), ...b64.dec(b.aesTag)]);
  return JSON.parse(bytesToUtf8(aead.decrypt(sealed)));
}
