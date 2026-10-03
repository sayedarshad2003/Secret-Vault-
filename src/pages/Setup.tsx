/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, EyeOff, FolderLock, Shield, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useVault } from '../hooks/useVault';
import { evaluatePasswordStrength, validateMasterPassword } from '../utils/validation';

export const Setup: React.FC = () => {
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setupVault } = useVault();
  const { showToast } = useToast();

  const strength = evaluatePasswordStrength(masterPassword);
  const validation = validateMasterPassword(masterPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validation.valid) {
      setError(validation.error || 'Password must be at least 12 characters.');
      return;
    }

    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    try {
      setIsCreating(true);
      await setupVault(masterPassword);
      showToast('Vault created and encrypted successfully with AES-256-GCM.', 'success', 'Vault Ready');
    } catch (err) {
      setError((err as Error).message || 'Failed to create vault.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <FolderLock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create Master Password</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Your master password derives an AES-256-GCM encryption key to secure your local vault. It is never stored or transmitted anywhere.
          </p>
        </div>

        {/* Security Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-100">Zero-Knowledge Guarantee:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              We cannot recover or reset your master password. Be sure to remember it or store a copy in a safe offline location.
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {/* Master Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Master Password <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">Min 12 chars</span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Enter a strong master password"
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

            {/* Strength Meter */}
            {masterPassword && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Strength: <strong className="text-slate-200">{strength.label}</strong>
                  </span>
                  <span className="text-slate-400 font-mono">~{strength.entropyBits} bits entropy</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-200 ${
                        i <= strength.score - 1
                          ? strength.score >= 3
                            ? 'bg-emerald-500'
                            : strength.score === 2
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                {strength.feedback.length > 0 && strength.score < 3 && (
                  <p className="text-[11px] text-amber-400/90 leading-tight">
                    {strength.feedback[0]}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm Master Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Confirm Master Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Confirm your master password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && masterPassword !== confirmPassword && (
              <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating || !validation.valid || masterPassword !== confirmPassword}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isCreating ? 'Deriving Keys & Initializing...' : 'Create Secure Vault'}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          PBKDF2-HMAC-SHA-256 · 600,000 Iterations · IndexedDB
        </div>
      </div>
    </div>
  );
};
