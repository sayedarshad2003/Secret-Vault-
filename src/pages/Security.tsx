/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  KeyRound,
  Pencil,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { PasswordForm } from '../components/PasswordForm';
import { useToast } from '../context/ToastContext';
import { useVault } from '../hooks/useVault';
import { auditVaultSecurity } from '../services/passwordService';
import { PasswordEntry } from '../types/vault';

export const Security: React.FC = () => {
  const { entries, updateEntry } = useVault();
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'weak' | 'reused' | 'old'>('all');
  const { showToast } = useToast();

  const audit = useMemo(() => auditVaultSecurity(entries), [entries]);

  const filteredResults = useMemo(() => {
    if (activeTab === 'weak') {
      return audit.results.filter(r => r.issues.some(i => i.type === 'weak'));
    }
    if (activeTab === 'reused') {
      return audit.results.filter(r => r.issues.some(i => i.type === 'reused'));
    }
    if (activeTab === 'old') {
      return audit.results.filter(r => r.issues.some(i => i.type === 'old'));
    }
    return audit.results.filter(r => r.issues.length > 0);
  }, [audit, activeTab]);

  const handleSaveEntry = async (entryData: {
    name: string;
    url: string;
    username: string;
    password: string;
    note: string;
    favorite: boolean;
  }) => {
    if (!editingEntry) return;
    await updateEntry({
      ...editingEntry,
      ...entryData,
    });
    showToast(`Updated "${entryData.name}"`, 'success');
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Password Security Health</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Analyzed locally against entropy and duplication heuristics. Passwords are never sent to external leak checkers or remote APIs.
            </p>
          </div>

          {/* Health Score Pill */}
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                Vault Health
              </div>
              <div
                className={`text-xl font-bold font-mono tabular-nums ${
                  audit.overallScore >= 80
                    ? 'text-emerald-400'
                    : audit.overallScore >= 60
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {audit.overallScore}%
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                audit.overallScore >= 80
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  : audit.overallScore >= 60
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-rose-500 text-rose-400 bg-rose-500/10'
              }`}
            >
              {audit.overallScore >= 80 ? 'A' : audit.overallScore >= 60 ? 'B' : 'C'}
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`p-3.5 rounded-xl border text-left transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800/90 border-slate-700'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950'
            }`}
          >
            <div className="text-xs text-slate-400">Total Analyzed</div>
            <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
              {audit.total}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1">
              {audit.healthyCount} fully compliant
            </div>
          </button>

          <button
            onClick={() => setActiveTab('weak')}
            className={`p-3.5 rounded-xl border text-left transition-colors ${
              activeTab === 'weak'
                ? 'bg-rose-950/40 border-rose-500/50'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950'
            }`}
          >
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Weak</span>
            </div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-1 tabular-nums">
              {audit.weakCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Low entropy or short</div>
          </button>

          <button
            onClick={() => setActiveTab('reused')}
            className={`p-3.5 rounded-xl border text-left transition-colors ${
              activeTab === 'reused'
                ? 'bg-amber-950/40 border-amber-500/50'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950'
            }`}
          >
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reused</span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1 tabular-nums">
              {audit.reusedCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Identical passwords</div>
          </button>

          <button
            onClick={() => setActiveTab('old')}
            className={`p-3.5 rounded-xl border text-left transition-colors ${
              activeTab === 'old'
                ? 'bg-slate-800/90 border-slate-700'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950'
            }`}
          >
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Old (&gt;90d)</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-200 mt-1 tabular-nums">
              {audit.oldCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Candidate for rotation</div>
          </button>
        </div>
      </div>

      {/* Vulnerable / Flagged Records List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            {activeTab === 'all'
              ? 'All Flagged Items'
              : activeTab === 'weak'
              ? 'Weak Passwords'
              : activeTab === 'reused'
              ? 'Reused Passwords'
              : 'Old Passwords'}
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {filteredResults.length} issues identified
          </span>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-200">
              No security issues in this category!
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Your passwords meet recommended entropy and uniqueness criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredResults.map(res => (
              <div
                key={res.entry.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100 truncate">
                      {res.entry.name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono truncate">
                      ({res.entry.username || 'No username'})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {res.issues.map((issue, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] px-2 py-0.5 rounded border font-medium inline-flex items-center gap-1 ${
                          issue.type === 'weak'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : issue.type === 'reused'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {issue.type === 'weak' && <AlertTriangle className="w-3 h-3" />}
                        {issue.type === 'reused' && <RefreshCw className="w-3 h-3" />}
                        {issue.type === 'old' && <Clock className="w-3 h-3" />}
                        <span>{issue.message}</span>
                      </span>
                    ))}
                  </div>

                  {res.issues.some(i => i.details) && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      {res.issues.map(i => i.details).filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setEditingEntry(res.entry)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingEntry && (
        <PasswordForm
          initialEntry={editingEntry}
          onSave={handleSaveEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
};
