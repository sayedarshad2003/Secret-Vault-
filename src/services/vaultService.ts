/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { decryptVault } from '../crypto/decrypt';
import { DEFAULT_PBKDF2_ITERATIONS, deriveKeyFromPassword } from '../crypto/deriveKey';
import { encryptVault } from '../crypto/encrypt';
import { base64ToUint8Array } from '../crypto/helpers';
import { getRandomBytes, generateSecureUUID } from '../crypto/random';
import {
  deleteVault as dbDeleteVault,
  getEncryptedVault,
  saveEncryptedVault,
  vaultExists as dbVaultExists,
} from '../db/vaultRepository';
import { EncryptedVault, PasswordEntry, Vault } from '../types/vault';

export class VaultService {
  /**
   * Checks whether an encrypted vault exists in IndexedDB.
   */
  public static async hasExistingVault(): Promise<boolean> {
    return dbVaultExists();
  }

  /**
   * Initializes a brand-new encrypted vault with a master password.
   * Generates a 16-byte cryptographically secure random salt.
   * Derives AES-GCM-256 key via PBKDF2 (600,000 iterations).
   * Encrypts initial empty vault with a fresh random 12-byte IV and stores only in IndexedDB.
   */
  public static async createNewVault(
    masterPassword: string
  ): Promise<{ derivedKey: CryptoKey; salt: Uint8Array; entries: PasswordEntry[] }> {
    const salt = getRandomBytes(16);
    const derivedKey = await deriveKeyFromPassword(
      masterPassword,
      salt,
      DEFAULT_PBKDF2_ITERATIONS
    );

    const initialVault: Vault = {
      version: 1,
      entries: [],
    };

    const encryptedVault = await encryptVault(
      initialVault,
      derivedKey,
      salt,
      DEFAULT_PBKDF2_ITERATIONS
    );

    await saveEncryptedVault(encryptedVault);

    return {
      derivedKey,
      salt,
      entries: initialVault.entries,
    };
  }

  /**
   * Unlocks an existing vault using the master password.
   * Decrypts and authenticates using AES-GCM tag.
   * Throws VaultDecryptionError if the password is incorrect.
   */
  public static async unlockVault(
    masterPassword: string
  ): Promise<{ derivedKey: CryptoKey; salt: Uint8Array; entries: PasswordEntry[] }> {
    const encrypted = await getEncryptedVault();
    if (!encrypted) {
      throw new Error('No vault found. Please create a new vault first.');
    }

    const salt = base64ToUint8Array(encrypted.salt);
    const iterations = encrypted.kdf?.iterations || DEFAULT_PBKDF2_ITERATIONS;

    const derivedKey = await deriveKeyFromPassword(masterPassword, salt, iterations);

    // Attempt decryption with AES-GCM authentication
    const decryptedVault = await decryptVault(encrypted, derivedKey);

    return {
      derivedKey,
      salt,
      entries: decryptedVault.entries,
    };
  }

  /**
   * Encrypts and persists updated entries using current in-memory key and salt.
   * Uses a fresh 12-byte IV every time.
   */
  public static async saveEntries(
    entries: PasswordEntry[],
    derivedKey: CryptoKey,
    salt: Uint8Array
  ): Promise<void> {
    const vault: Vault = {
      version: 1,
      entries,
    };

    const encrypted = await encryptVault(vault, derivedKey, salt, DEFAULT_PBKDF2_ITERATIONS);
    await saveEncryptedVault(encrypted);
  }

  /**
   * Restores an encrypted vault envelope (e.g. from a .pmvault backup file).
   */
  public static async restoreEncryptedVault(encryptedVault: EncryptedVault): Promise<void> {
    await saveEncryptedVault(encryptedVault);
  }

  /**
   * Adds a new entry, re-encrypts, and persists to IndexedDB.
   */
  public static async addEntry(
    newEntry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>,
    currentEntries: PasswordEntry[],
    derivedKey: CryptoKey,
    salt: Uint8Array
  ): Promise<PasswordEntry[]> {
    const now = new Date().toISOString();
    const entry: PasswordEntry = {
      id: generateSecureUUID(),
      name: newEntry.name.trim() || 'Untitled Account',
      url: newEntry.url.trim(),
      username: newEntry.username.trim(),
      password: newEntry.password,
      note: newEntry.note.trim(),
      favorite: Boolean(newEntry.favorite),
      createdAt: now,
      updatedAt: now,
    };

    const updated = [entry, ...currentEntries];
    await this.saveEntries(updated, derivedKey, salt);
    return updated;
  }

  /**
   * Updates an existing entry, re-encrypts, and persists to IndexedDB.
   */
  public static async updateEntry(
    updatedEntry: PasswordEntry,
    currentEntries: PasswordEntry[],
    derivedKey: CryptoKey,
    salt: Uint8Array
  ): Promise<PasswordEntry[]> {
    const now = new Date().toISOString();
    const updated = currentEntries.map(e =>
      e.id === updatedEntry.id
        ? {
            ...updatedEntry,
            name: updatedEntry.name.trim() || 'Untitled Account',
            url: updatedEntry.url.trim(),
            username: updatedEntry.username.trim(),
            note: updatedEntry.note.trim(),
            updatedAt: now,
          }
        : e
    );

    await this.saveEntries(updated, derivedKey, salt);
    return updated;
  }

  /**
   * Deletes an entry by ID, re-encrypts, and persists to IndexedDB.
   */
  public static async deleteEntry(
    id: string,
    currentEntries: PasswordEntry[],
    derivedKey: CryptoKey,
    salt: Uint8Array
  ): Promise<PasswordEntry[]> {
    const updated = currentEntries.filter(e => e.id !== id);
    await this.saveEntries(updated, derivedKey, salt);
    return updated;
  }

  /**
   * Permanently wipes the vault database.
   */
  public static async wipeDatabase(): Promise<void> {
    await dbDeleteVault();
  }
}
