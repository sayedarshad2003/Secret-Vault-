/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EncryptedVault, Vault } from '../types/vault';
import { base64ToUint8Array } from './helpers';

export class VaultDecryptionError extends Error {
  constructor(message: string = 'Incorrect master password or corrupted vault.') {
    super(message);
    this.name = 'VaultDecryptionError';
  }
}

/**
 * Decrypts an EncryptedVault structure using the supplied AES-GCM CryptoKey.
 * Authenticates the ciphertext via AES-GCM's 128-bit integrity tag.
 *
 * If the master password is wrong or ciphertext is modified, Web Crypto throws an OperationError.
 * This is caught and translated to a zero-knowledge VaultDecryptionError.
 */
export async function decryptVault(
  encryptedVault: EncryptedVault,
  key: CryptoKey
): Promise<Vault> {
  try {
    const iv = base64ToUint8Array(encryptedVault.iv);
    const ciphertext = base64ToUint8Array(encryptedVault.ciphertext);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
        tagLength: 128,
      },
      key,
      ciphertext as BufferSource
    );

    const decoder = new TextDecoder('utf-8', { fatal: true });
    const plaintext = decoder.decode(decryptedBuffer);
    const parsed = JSON.parse(plaintext) as Vault;

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
      throw new VaultDecryptionError('Decrypted data does not match vault schema.');
    }

    return parsed;
  } catch (err) {
    if (err instanceof VaultDecryptionError) {
      throw err;
    }
    // Any AES-GCM tag mismatch or parsing issue yields identical error
    throw new VaultDecryptionError('Incorrect master password or corrupted vault.');
  }
}
