/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Moon,
  Shield,
  Sun,
  Trash2,
  Upload,
  Lock,
  Sparkles,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useVault } from '../hooks/useVault';
import { parseEncryptedBackupFile } from '../services/exportService';
import { AutoLockTimeout } from '../types/vault';

interface SettingsProps {
  onOpenImport: () => void;
  onOpenExport: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenImport, onOpenExport }) => {
  const { settings, updateSettings, deleteEntireVault, restoreBackup, entries } = useVault();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = parseEncryptedBackupFile(text);
      await restoreBackup(backup);
      showToast('Encrypted backup successfully restored. Please unlock with backup master password.', 'success');
    } catch (err) {
      showToast((err as Error).message || 'Failed to restore backup.', 'error');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Vault Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure security timeouts, password generator preferences, and vault data.
        </p>
      </div>

      {/* 1. Security Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">Security & Privacy</h3>
        </div>

        <div className="space-y-4 text-xs">
          {/* Auto Lock */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-200">Auto-lock Inactivity Timeout</div>
              <div className="text-slate-400 text-[11px]">
                Locks vault after period of user inactivity or tab backgrounding.
              </div>
            </div>
            <select
              value={settings.autoLockMinutes}
              onChange={e =>
                updateSettings({
                  autoLockMinutes: parseInt(e.target.value, 10) as AutoLockTimeout,
                })
              }
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            >
              <option value={1}>1 Minute</option>
              <option value={5}>5 Minutes</option>
              <option value={15}>15 Minutes (Default)</option>
              <option value={30}>30 Minutes</option>
              <option value={0}>Never (Not Recommended)</option>
            </select>
          </div>

          {/* Clipboard Clear Timeout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            <div>
              <div className="font-semibold text-slate-200">Clipboard Auto-Clear Timer</div>
              <div className="text-slate-400 text-[11px]">
                Automatically scrubs copied passwords from system clipboard.
              </div>
            </div>
            <select
              value={settings.clipboardClearSeconds}
              onChange={e =>
                updateSettings({
                  clipboardClearSeconds: parseInt(e.target.value, 10),
                })
              }
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            >
              <option value={10}>10 Seconds</option>
              <option value={30}>30 Seconds (Standard)</option>
              <option value={60}>60 Seconds</option>
              <option value={0}>Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Password Generator Defaults */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">Password Generator Defaults</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1 text-slate-300">
              <span>Default Password Length</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {settings.defaultGeneratorLength} chars
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={settings.defaultGeneratorLength}
              onChange={e =>
                updateSettings({
                  defaultGeneratorLength: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.defaultGeneratorUppercase}
                onChange={e => updateSettings({ defaultGeneratorUppercase: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span>Uppercase (A-Z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.defaultGeneratorLowercase}
                onChange={e => updateSettings({ defaultGeneratorLowercase: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span>Lowercase (a-z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.defaultGeneratorNumbers}
                onChange={e => updateSettings({ defaultGeneratorNumbers: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span>Numbers (0-9)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.defaultGeneratorSymbols}
                onChange={e => updateSettings({ defaultGeneratorSymbols: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span>Symbols (!@#$...)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none col-span-2">
              <input
                type="checkbox"
                checked={settings.defaultGeneratorExcludeAmbiguous}
                onChange={e =>
                  updateSettings({ defaultGeneratorExcludeAmbiguous: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span>Exclude Ambiguous Characters (0, O, l, 1, I)</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Appearance */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Moon className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">Appearance</h3>
        </div>

        <div className="flex items-center gap-2">
          {(['dark', 'light', 'system'] as const).map(themeOption => (
            <button
              key={themeOption}
              onClick={() => updateSettings({ theme: themeOption })}
              className={`px-4 py-2 rounded-xl text-xs font-medium capitalize border transition-colors ${
                settings.theme === themeOption
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {themeOption}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Data Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Download className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">Data & Backups</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            onClick={onOpenExport}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-slate-200">Export Vault</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Download .pmvault encrypted backup or CSV
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <button
            onClick={onOpenImport}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-slate-200">Import CSV / Excel</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Import from Bitwarden, 1Password, or spreadsheets
              </div>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <div className="sm:col-span-2">
            <input
              ref={restoreInputRef}
              type="file"
              accept=".pmvault, application/json"
              onChange={handleRestoreFile}
              className="hidden"
            />
            <button
              onClick={() => restoreInputRef.current?.click()}
              className="w-full p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-slate-200">Restore from Encrypted Backup (.pmvault)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Overwrites local IndexedDB vault with backup envelope
                </div>
              </div>
              <Upload className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Danger Zone */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20 text-rose-400">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Danger Zone</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-white">Delete Entire Vault</div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Permanently drops the local IndexedDB database and wipes encrypted keys. Cannot be undone.
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Entire Vault</span>
          </button>
        </div>
      </div>

      {/* Strict Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmDialog
          title="Permanently Delete Local Vault?"
          message="This action will permanently purge the local encrypted vault from this device. If you don't have an exported .pmvault backup file, all saved passwords will be permanently unrecoverable."
          confirmText="Permanently Delete"
          isDestructive={true}
          requiredTypedConfirmation="DELETE MY VAULT"
          onConfirm={async () => {
            setShowDeleteModal(false);
            await deleteEntireVault();
            showToast('Local vault has been permanently erased.', 'info');
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};
