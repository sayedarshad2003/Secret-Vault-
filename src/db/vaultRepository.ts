/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSettings, EncryptedVault } from '../types/vault';
import {
  closeDatabase,
  DB_NAME,
  openDatabase,
  SETTINGS_STORE,
  VAULT_PRIMARY_KEY,
  VAULT_STORE,
} from './database';

export const DEFAULT_SETTINGS: AppSettings = {
  autoLockMinutes: 15,
  theme: 'dark',
  defaultGeneratorLength: 20,
  defaultGeneratorUppercase: true,
  defaultGeneratorLowercase: true,
  defaultGeneratorNumbers: true,
  defaultGeneratorSymbols: true,
  defaultGeneratorExcludeAmbiguous: false,
  clipboardClearSeconds: 30,
};

/**
 * Initializes the IndexedDB database instance.
 */
export async function initializeDatabase(): Promise<IDBDatabase> {
  return openDatabase();
}

/**
 * Checks whether an encrypted vault exists in IndexedDB.
 */
export async function vaultExists(): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VAULT_STORE, 'readonly');
      const store = tx.objectStore(VAULT_STORE);
      const req = store.get(VAULT_PRIMARY_KEY);

      req.onsuccess = () => {
        resolve(Boolean(req.result));
      };

      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (err) {
    return false;
  }
}

/**
 * Retrieves the encrypted vault envelope from IndexedDB.
 * Never exposes plaintext data.
 */
export async function getEncryptedVault(): Promise<EncryptedVault | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VAULT_STORE, 'readonly');
    const store = tx.objectStore(VAULT_STORE);
    const req = store.get(VAULT_PRIMARY_KEY);

    req.onsuccess = () => {
      resolve(req.result ? (req.result as EncryptedVault) : null);
    };

    req.onerror = () => {
      reject(new Error(`Failed to read encrypted vault: ${req.error?.message}`));
    };
  });
}

/**
 * Saves or updates the encrypted vault envelope in IndexedDB.
 */
export async function saveEncryptedVault(encryptedVault: EncryptedVault): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VAULT_STORE, 'readwrite');
    const store = tx.objectStore(VAULT_STORE);
    const req = store.put(encryptedVault, VAULT_PRIMARY_KEY);

    req.onsuccess = () => {
      resolve();
    };

    req.onerror = () => {
      reject(new Error(`Failed to save encrypted vault: ${req.error?.message}`));
    };
  });
}

/**
 * Permanently deletes the local encrypted vault and clears the IndexedDB database.
 */
export async function deleteVault(): Promise<void> {
  closeDatabase();
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => {
      resolve();
    };
    req.onerror = () => {
      reject(new Error(`Failed to delete database: ${req.error?.message}`));
    };
    req.onblocked = () => {
      // Still resolve once blocked connection unloads
      resolve();
    };
  });
}

/**
 * Retrieves non-sensitive preferences (e.g. theme, auto-lock timeout).
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const store = tx.objectStore(SETTINGS_STORE);
      const req = store.get('app_settings');

      req.onsuccess = () => {
        if (req.result) {
          resolve({ ...DEFAULT_SETTINGS, ...(req.result as AppSettings) });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };

      req.onerror = () => {
        resolve(DEFAULT_SETTINGS);
      };
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Saves non-sensitive preferences.
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = tx.objectStore(SETTINGS_STORE);
      const req = store.put(settings, 'app_settings');

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save settings to IndexedDB', err);
  }
}
