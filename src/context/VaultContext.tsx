/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../db/vaultRepository';
import { VaultService } from '../services/vaultService';
import { AppSettings, EncryptedVault, PasswordEntry } from '../types/vault';

export type VaultStatus = 'checking' | 'uninitialized' | 'locked' | 'unlocked';

interface VaultContextType {
  status: VaultStatus;
  entries: PasswordEntry[];
  settings: AppSettings;
  setupVault: (masterPassword: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<void>;
  lockVault: () => void;
  addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (entry: PasswordEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  importEntries: (newEntriesList: PasswordEntry[]) => Promise<void>;
  restoreBackup: (backup: EncryptedVault) => Promise<void>;
  deleteEntireVault: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  refreshVaultState: () => Promise<void>;
}

export const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<VaultStatus>('checking');
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);
  const [salt, setSalt] = useState<Uint8Array | null>(null);
  const [settings, setAppSettings] = useState<AppSettings>({
    autoLockMinutes: 15,
    theme: 'dark',
    defaultGeneratorLength: 20,
    defaultGeneratorUppercase: true,
    defaultGeneratorLowercase: true,
    defaultGeneratorNumbers: true,
    defaultGeneratorSymbols: true,
    defaultGeneratorExcludeAmbiguous: false,
    clipboardClearSeconds: 30,
  });

  // Apply dark/light theme class on documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Initial load: check if vault exists in IndexedDB and load settings
  const refreshVaultState = useCallback(async () => {
    try {
      const storedSettings = await getSettings();
      setAppSettings(storedSettings);

      const exists = await VaultService.hasExistingVault();
      if (!exists) {
        setStatus('uninitialized');
        setEntries([]);
        setDerivedKey(null);
        setSalt(null);
      } else {
        setStatus(prev => (prev === 'unlocked' ? 'unlocked' : 'locked'));
      }
    } catch {
      setStatus('uninitialized');
    }
  }, []);

  useEffect(() => {
    refreshVaultState();
  }, [refreshVaultState]);

  // Lock action: immediately scrub all memory
  const lockVault = useCallback(() => {
    setEntries([]);
    setDerivedKey(null);
    setSalt(null);
    setStatus('locked');
  }, []);

  const setupVault = useCallback(async (masterPassword: string) => {
    const result = await VaultService.createNewVault(masterPassword);
    setDerivedKey(result.derivedKey);
    setSalt(result.salt);
    setEntries(result.entries);
    setStatus('unlocked');
  }, []);

  const unlockVault = useCallback(async (masterPassword: string) => {
    const result = await VaultService.unlockVault(masterPassword);
    setDerivedKey(result.derivedKey);
    setSalt(result.salt);
    setEntries(result.entries);
    setStatus('unlocked');
  }, []);

  const addEntry = useCallback(
    async (entryData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!derivedKey || !salt) {
        throw new Error('Vault is locked. Cannot write data.');
      }
      const updated = await VaultService.addEntry(entryData, entries, derivedKey, salt);
      setEntries(updated);
    },
    [derivedKey, salt, entries]
  );

  const updateEntry = useCallback(
    async (entryData: PasswordEntry) => {
      if (!derivedKey || !salt) {
        throw new Error('Vault is locked. Cannot write data.');
      }
      const updated = await VaultService.updateEntry(entryData, entries, derivedKey, salt);
      setEntries(updated);
    },
    [derivedKey, salt, entries]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!derivedKey || !salt) {
        throw new Error('Vault is locked. Cannot write data.');
      }
      const updated = await VaultService.deleteEntry(id, entries, derivedKey, salt);
      setEntries(updated);
    },
    [derivedKey, salt, entries]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const target = entries.find(e => e.id === id);
      if (!target) return;
      await updateEntry({
        ...target,
        favorite: !target.favorite,
      });
    },
    [entries, updateEntry]
  );

  const importEntries = useCallback(
    async (newEntriesList: PasswordEntry[]) => {
      if (!derivedKey || !salt) {
        throw new Error('Vault is locked. Cannot write data.');
      }
      await VaultService.saveEntries(newEntriesList, derivedKey, salt);
      setEntries(newEntriesList);
    },
    [derivedKey, salt]
  );

  const restoreBackup = useCallback(async (backup: EncryptedVault) => {
    await VaultService.restoreEncryptedVault(backup);
    setEntries([]);
    setDerivedKey(null);
    setSalt(null);
    setStatus('locked');
  }, []);

  const deleteEntireVault = useCallback(async () => {
    await VaultService.wipeDatabase();
    setEntries([]);
    setDerivedKey(null);
    setSalt(null);
    setStatus('uninitialized');
  }, []);

  const updateSettingsHandler = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const merged = { ...settings, ...newSettings };
      setAppSettings(merged);
      await saveSettings(merged);
    },
    [settings]
  );

  return (
    <VaultContext.Provider
      value={{
        status,
        entries,
        settings,
        setupVault,
        unlockVault,
        lockVault,
        addEntry,
        updateEntry,
        deleteEntry,
        toggleFavorite,
        importEntries,
        restoreBackup,
        deleteEntireVault,
        updateSettings: updateSettingsHandler,
        refreshVaultState,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};
