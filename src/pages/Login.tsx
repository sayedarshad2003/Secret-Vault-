/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, FolderLock, HelpCircle, Lock, ShieldCheck, Upload } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useVault } from '../hooks/useVault';
import { parseEncryptedBackupFile } from '../services/exportService';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Login: React.FC = () => {
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { unlockVault, restoreBackup, deleteEntireVault } = useVault();
  const { showToast } = useToast();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword) return;

    try {
      setIsUnlocking(true);
      setError(null);
      await unlockVault(masterPassword);
      showToast('Vault unlocked successfully.', 'success');
    } catch (err) {
      setError('Incorrect master password. Please verify and try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = parseEncryptedBackupFile(text);
      await restoreBackup(backup);
      showToast('Encrypted backup loaded into IndexedDB. Please unlock using the backup password.', 'info');
      setShowForgotModal(false);
    } catch (err) {
      showToast((err as Error).message || 'Invalid backup file.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <FolderLock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Vault Locked</h1>
          <p className="text-xs text-slate-400">
            Your passwords are encrypted locally on this device.
          </p>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Enter master password"
                value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUnlocking || !masterPassword}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Lock className="w-4 h-4" />
            <span>{isUnlocking ? 'Authenticating & Decrypting...' : 'Unlock Vault'}</span>
          </button>
        </form>

        {/* Forgot Password and Options */}
        <div className="pt-2 text-center space-y-2">
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
          >
            Forgot Master Password?
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800 text-center text-[10px] text-slate-400 font-mono">
          Zero-Knowledge Architecture · No Cloud Sync
        </div>
      </div>

      {/* Forgot Password Modal (Zero-Knowledge truth) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">No Password Recovery</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Your master password is never stored or transmitted. Because this is a zero-knowledge, local-only vault, <strong>it cannot be reset or recovered</strong>.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-slate-100">Recovery Options:</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>If you created an encrypted backup (<code className="text-emerald-400 font-mono">.pmvault</code>), you can restore it.</li>
                <li>Otherwise, data encrypted with an unknown master password cannot be decrypted.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pmvault, application/json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Encrypted Backup (.pmvault)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setShowResetConfirm(true);
                }}
                className="w-full py-2 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors"
              >
                Wipe Local Vault & Start Fresh
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe Vault Confirmation */}
      {showResetConfirm && (
        <ConfirmDialog
          title="Permanently Reset Vault"
          message="This will delete the local encrypted vault from this browser. All passwords will be lost if you do not have an encrypted backup."
          confirmText="Reset Vault"
          isDestructive={true}
          requiredTypedConfirmation="DELETE MY VAULT"
          onConfirm={async () => {
            setShowResetConfirm(false);
            await deleteEntireVault();
            showToast('Local vault has been reset. You may now create a new master password.', 'info');
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
};
