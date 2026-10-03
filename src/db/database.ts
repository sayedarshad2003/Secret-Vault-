/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IndexedDB Database Connection Manager.
 * Database: SecurePasswordManager
 * Stores:
 *  - "vault": contains strictly encrypted vault records (never plaintext)
 *  - "settings": harmless client preferences (theme, auto-lock timeout)
 */

export const DB_NAME = 'SecurePasswordManager';
export const DB_VERSION = 1;
export const VAULT_STORE = 'vault';
export const SETTINGS_STORE = 'settings';
export const VAULT_PRIMARY_KEY = 'encryptedVault';

let dbInstance: IDBDatabase | null = null;

export async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Primary vault store for encrypted blob
      if (!db.objectStoreNames.contains(VAULT_STORE)) {
        db.createObjectStore(VAULT_STORE);
      }

      // Non-sensitive settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;

      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to open IndexedDB: ${(event.target as IDBOpenDBRequest).error?.message}`));
    };

    request.onblocked = () => {
      // Database blocked by older connection
      console.warn('Database upgrade blocked. Please close other tabs.');
    };
  });
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
