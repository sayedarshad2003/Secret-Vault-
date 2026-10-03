/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Sparkles, X } from 'lucide-react';
import { PasswordEntry } from '../types/vault';
import { evaluatePasswordStrength } from '../utils/validation';
import { isSafeUrl } from '../utils/url';
import { PasswordGenerator } from './PasswordGenerator';

interface PasswordFormProps {
  initialEntry?: PasswordEntry | null;
  onSave: (entryData: {
    name: string;
    url: string;
    username: string;
    password: string;
    note: string;
    favorite: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export const PasswordForm: React.FC<PasswordFormProps> = ({
  initialEntry,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialEntry?.name || '');
  const [url, setUrl] = useState(initialEntry?.url || '');
  const [username, setUsername] = useState(initialEntry?.username || '');
  const [password, setPassword] = useState(initialEntry?.password || '');
  const [note, setNote] = useState(initialEntry?.note || '');
  const [favorite, setFavorite] = useState(initialEntry?.favorite || false);

  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initialEntry);
  const strength = evaluatePasswordStrength(password);
  const urlWarning = url.trim().length > 0 && !isSafeUrl(url.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an account or website name.');
      return;
    }
    if (!password) {
      setError('Password cannot be empty.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        url: url.trim(),
        username: username.trim(),
        password,
        note: note.trim(),
        favorite,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isEditing ? 'Edit Password' : 'Add Password'}
              </h2>
              <p className="text-xs text-slate-400">
                Encrypted locally with AES-256-GCM before saving.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Account / Service Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GitHub, Google, Instagram"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Website URL
            </label>
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {urlWarning && (
              <p className="text-[11px] text-amber-400 mt-1">
                Note: Only http://, https://, or registered app links are permitted.
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              placeholder="user@example.com"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Password <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showGenerator ? 'Hide Generator' : 'Generate Secure Password'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter or generate password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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

            {/* Password strength mini indicator */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Strength:</span>
                  <span
                    className={`font-medium ${
                      strength.score >= 3
                        ? 'text-emerald-400'
                        : strength.score === 2
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1">
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
              </div>
            )}
          </div>

          {/* Embedded generator panel if toggled */}
          {showGenerator && (
            <div className="pt-2">
              <PasswordGenerator
                onSelectPassword={newPwd => {
                  setPassword(newPwd);
                  setShowGenerator(false);
                }}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Secure Notes (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Private notes, recovery codes, or security answers"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="favorite-toggle"
              checked={favorite}
              onChange={e => setFavorite(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
            />
            <label htmlFor="favorite-toggle" className="text-xs text-slate-300 select-none cursor-pointer">
              Mark as Favorite (quick access on dashboard)
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Encrypting & Saving...' : isEditing ? 'Save Changes' : 'Add Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
