/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, Download, FileText, Lock, ShieldCheck, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getEncryptedVault } from '../db/vaultRepository';
import { exportEncryptedBackup, exportPlaintextCSV } from '../services/exportService';
import { PasswordEntry } from '../types/vault';

interface ExportModalProps {
  entries: PasswordEntry[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ entries, onClose }) => {
  const [activeTab, setActiveTab] = useState<'encrypted' | 'csv'>('encrypted');
  const [csvConfirmed, setCsvConfirmed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const handleExportEncrypted = async () => {
    try {
      setIsExporting(true);
      const encrypted = await getEncryptedVault();
      if (!encrypted) {
        throw new Error('Encrypted vault could not be found.');
      }
      exportEncryptedBackup(encrypted);
      showToast('Encrypted backup (.pmvault) exported successfully.', 'success');
      onClose();
    } catch (err) {
      showToast((err as Error).message || 'Failed to export backup.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (!csvConfirmed) return;
    try {
      setIsExporting(true);
      exportPlaintextCSV(entries);
      showToast('Plaintext CSV exported. Remember to securely delete this file after use!', 'warning');
      onClose();
    } catch (err) {
      showToast((err as Error).message || 'Failed to export CSV.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Export Vault</h2>
              <p className="text-xs text-slate-400">
                Choose between secure encrypted backup or plaintext CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4">
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('encrypted')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'encrypted'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Encrypted Backup (Recommended)</span>
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'csv'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Plaintext CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'encrypted' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200 space-y-1">
                  <div className="font-semibold text-white">Cryptographically Secure Backup</div>
                  <p className="leading-relaxed text-emerald-300/90">
                    Exports an exact snapshot of your encrypted vault as a <code className="font-mono text-white">.pmvault</code> file.
                    All passwords remain encrypted with AES-256-GCM. You can safely store this backup on cloud drives or external USBs.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">File Type:</span>
                  <span>.pmvault (Encrypted JSON envelope)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Encryption:</span>
                  <span>AES-256-GCM (128-bit tag)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Key Derivation:</span>
                  <span>PBKDF2-SHA-256 (600,000 iter)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Records Included:</span>
                  <span className="text-emerald-400 font-semibold">{entries.length}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportEncrypted}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export Encrypted Backup (.pmvault)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-200 space-y-1">
                  <div className="font-bold text-rose-100 uppercase tracking-wider text-[11px]">
                    Security Warning
                  </div>
                  <p className="leading-relaxed">
                    CSV exports contain your passwords in <strong className="text-white underline">PLAINTEXT</strong>.
                    Anyone who gets this file can read all your passwords without a master password.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={csvConfirmed}
                    onChange={e => setCsvConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/20"
                  />
                  <span>
                    I understand this file contains plaintext passwords and must be stored or destroyed safely.
                  </span>
                </label>
              </div>

              <button
                type="button"
                disabled={!csvConfirmed || isExporting}
                onClick={handleExportCSV}
                className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Export Plaintext CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
