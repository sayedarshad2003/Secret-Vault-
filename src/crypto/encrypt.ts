/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EncryptedVault, Vault } from '../types/vault';
import { DEFAULT_PBKDF2_ITERATIONS } from './deriveKey';
import { uint8ArrayToBase64 } from './helpers';
import { getRandomBytes } from './random';

/**
 * Encrypts a Vault object using AES-256-GCM with a freshly generated 12-byte random IV.
 * An IV is NEVER reused with the same derived key.
 *
 * @param vault - Plaintext vault object to serialize and encrypt
 * @param key - AES-GCM 256-bit CryptoKey derived from master password
 * @param salt - The 16-byte PBKDF2 salt associated with this vault
 * @param iterations - PBKDF2 iteration count
 * @returns EncryptedVault ready for storage in IndexedDB
 */
export async function encryptVault(
  vault: Vault,
  key: CryptoKey,
  salt: Uint8Array,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<EncryptedVault> {
  const encoder = new TextEncoder();
  const plaintext = JSON.stringify(vault);
  const plaintextBytes = encoder.encode(plaintext);

  // Generate a fresh, cryptographically secure 12-byte (96-bit) random IV
  const iv = getRandomBytes(12);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: 128, // 128-bit authentication tag
    },
    key,
    plaintextBytes
  );

  const ciphertextBytes = new Uint8Array(ciphertextBuffer);

  return {
    version: vault.version || 1,
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(ciphertextBytes),
    kdf: {
      algorithm: 'PBKDF2',
      hash: 'SHA-256',
      iterations,
    },
    encryption: {
      algorithm: 'AES-GCM',
      keyLength: 256,
    },
  };
}
