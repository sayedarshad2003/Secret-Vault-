/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Key derivation using Web Crypto API.
 * Uses PBKDF2 with HMAC-SHA-256 and high iteration counts (OWASP standard: 600,000 iterations).
 * The resulting CryptoKey is marked non-extractable (extractable: false)
 * to ensure raw key material cannot be extracted from browser memory.
 */

export const DEFAULT_PBKDF2_ITERATIONS = 600000;

/**
 * Derives an AES-GCM-256 CryptoKey from a user master password and a 16-byte random salt.
 */
export async function deriveKeyFromPassword(
  masterPassword: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  if (!masterPassword || masterPassword.length < 1) {
    throw new Error('Master password cannot be empty');
  }

  if (salt.byteLength < 16) {
    throw new Error('Salt must be at least 16 bytes');
  }

  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);

  // 1. Import the raw password as a PBKDF2 base key (non-extractable)
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // 2. Derive the AES-GCM 256-bit encryption key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // extractable: false — prevents export via subtle.exportKey
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}
