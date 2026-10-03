/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { useClipboard } from '../hooks/useClipboard';
import { PasswordEntry } from '../types/vault';
import { evaluatePasswordStrength } from '../utils/validation';
import { extractDomainDisplay, normalizeUrlForOpen } from '../utils/url';

interface PasswordCardProps {
  entry: PasswordEntry;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  clipboardClearSeconds?: number;
}

export const PasswordCard: React.FC<PasswordCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
  clipboardClearSeconds = 30,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { copyText } = useClipboard({ clearAfterSeconds: clipboardClearSeconds });

  const safeOpenUrl = normalizeUrlForOpen(entry.url);
  const domainDisplay = extractDomainDisplay(entry.url);
  const strength = evaluatePasswordStrength(entry.password);

  const formattedDate = entry.updatedAt
    ? new Date(entry.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between shadow-sm">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-slate-300 font-semibold text-sm">
              {entry.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-white">
                {entry.name}
              </h3>
              {entry.url ? (
                safeOpenUrl ? (
                  <a
                    href={safeOpenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors truncate max-w-[200px]"
                    title={`Open ${entry.url}`}
                  >
                    <span>{domainDisplay || entry.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-500 truncate block">
                    {domainDisplay || entry.url}
                  </span>
                )
              ) : (
                <span className="text-xs text-slate-500">No URL</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleFavorite(entry.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                entry.favorite
                  ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={entry.favorite ? 'Favorited' : 'Not favorited'}
            >
              <Star className={`w-4 h-4 ${entry.favorite ? 'fill-amber-400' : ''}`} />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-slate-900 border border-slate-700/80 rounded-lg shadow-xl py-1 z-30 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(entry);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(entry.id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-950/60 flex items-center gap-2 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Username Row */}
        <div className="mt-3 bg-slate-950/50 rounded-lg p-2 border border-slate-800/80 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-medium text-slate-400 tracking-wider block">
              Username
            </span>
            <div className="text-xs text-slate-200 truncate font-mono select-all">
              {entry.username || <span className="text-slate-400 italic">None</span>}
            </div>
          </div>
          {entry.username && (
            <button
              onClick={() => copyText(entry.username, 'Username', false)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
              title="Copy username"
              aria-label="Copy username"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Password Row */}
        <div className="mt-2 bg-slate-950/50 rounded-lg p-2 border border-slate-800/80 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                Password
              </span>
              <span
                className={`text-[10px] font-medium ${
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
            <div className="text-xs font-mono select-all truncate text-slate-100">
              {showPassword ? (
                entry.password
              ) : (
                <span className="tracking-widest text-slate-400">••••••••••••••</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => copyText(entry.password, 'Password', true)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Copy password (auto-clears in 30s)"
              aria-label="Copy password"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Note if present */}
        {entry.note && (
          <div className="mt-2 text-xs text-slate-400 line-clamp-2 bg-slate-950/30 p-2 rounded border border-slate-800/40">
            {entry.note}
          </div>
        )}
      </div>

      {/* Footer metadata */}
      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Updated {formattedDate}</span>
        <button
          onClick={() => onEdit(entry)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          Details
        </button>
      </div>
    </div>
  );
};
