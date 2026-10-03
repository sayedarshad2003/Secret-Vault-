/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { parseCSVFile, parseExcelFile, resolveImportMerge } from '../services/importService';
import { DuplicateResolutionStrategy, ImportCandidate, PasswordEntry } from '../types/vault';

interface ImportModalProps {
  existingEntries: PasswordEntry[];
  onCommitImport: (mergedEntries: PasswordEntry[]) => Promise<void>;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  existingEntries,
  onCommitImport,
  onClose,
}) => {
  const [candidates, setCandidates] = useState<ImportCandidate[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [strategy, setStrategy] = useState<DuplicateResolutionStrategy>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const lower = file.name.toLowerCase();
      let parsedCandidates: ImportCandidate[] = [];

      if (lower.endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text();
        parsedCandidates = parseCSVFile(text, existingEntries);
      } else if (
        lower.endsWith('.xlsx') ||
        lower.endsWith('.xls') ||
        file.type.includes('spreadsheet') ||
        file.type.includes('excel')
      ) {
        const buffer = await file.arrayBuffer();
        parsedCandidates = parseExcelFile(buffer, existingEntries);
      } else {
        throw new Error('Unsupported format. Please select a .csv, .xlsx, or .xls file.');
      }

      setCandidates(parsedCandidates);
    } catch (err) {
      showToast((err as Error).message || 'Failed to parse file.', 'error');
      setCandidates(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const newCount = candidates ? candidates.filter(c => c.isValid && !c.isDuplicate).length : 0;
  const duplicateCount = candidates ? candidates.filter(c => c.isValid && c.isDuplicate).length : 0;
  const invalidCount = candidates ? candidates.filter(c => !c.isValid).length : 0;
  const totalCount = candidates ? candidates.length : 0;

  const handleCommit = async () => {
    if (!candidates || candidates.length === 0) return;
    try {
      setIsImporting(true);
      const merged = resolveImportMerge(candidates, existingEntries, strategy);
      await onCommitImport(merged);
      const importedCount =
        strategy === 'skip' ? newCount : strategy === 'replace' ? newCount + duplicateCount : newCount + duplicateCount;
      showToast(`Successfully imported ${importedCount} records. Vault re-encrypted.`, 'success');
      onClose();
    } catch (err) {
      showToast((err as Error).message || 'Failed to encrypt and save import.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Import Passwords</h2>
              <p className="text-xs text-slate-400">
                100% Client-side parser · Never leaves your browser
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

        <div className="p-6 space-y-5">
          {/* File Picker Zone */}
          {!candidates ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-950/70"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">
                Select CSV or Excel (.xlsx, .xls) file
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Expected columns: <code className="font-mono text-emerald-400">name, url, username, password, note</code>
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 font-medium">
                {isProcessing ? 'Parsing File Locally...' : 'Browse Local Files'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400 font-mono">{fileName}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {totalCount} records identified
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {newCount} new
                  </span>
                  {duplicateCount > 0 && (
                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      {duplicateCount} duplicates
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                      {invalidCount} invalid
                    </span>
                  )}
                </div>
              </div>

              {/* Duplicate Strategy Option */}
              {duplicateCount > 0 && (
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-xs font-semibold text-slate-200 block">
                    Duplicate Conflict Resolution:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStrategy('skip')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-colors ${
                        strategy === 'skip'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold">Skip Duplicates</div>
                      <div className="text-[10px] opacity-80">Preserve existing records</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStrategy('replace')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-colors ${
                        strategy === 'replace'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold">Replace Existing</div>
                      <div className="text-[10px] opacity-80">Overwrite with imported data</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStrategy('keep_both')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-colors ${
                        strategy === 'keep_both'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold">Import As New</div>
                      <div className="text-[10px] opacity-80">Keep both records</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Table with Masked Passwords */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Record Preview (Passwords Masked)</span>
                  <button
                    onClick={() => {
                      setCandidates(null);
                      setFileName('');
                    }}
                    className="text-slate-400 hover:text-slate-200 text-[11px]"
                  >
                    Choose different file
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80 bg-slate-950/40 text-xs">
                  {candidates.slice(0, 50).map(c => (
                    <div
                      key={c.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 truncate">
                            {c.name || 'Untitled'}
                          </span>
                          {c.isDuplicate && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Duplicate of {c.duplicateOfName}
                            </span>
                          )}
                          {!c.isValid && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Invalid
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                          {c.username ? `${c.username} · ` : ''}
                          {c.url || 'No URL'}
                        </div>
                      </div>
                      <div className="font-mono text-slate-500 tracking-widest text-xs shrink-0">
                        ••••••••
                      </div>
                    </div>
                  ))}
                  {candidates.length > 50 && (
                    <div className="p-2 text-center text-[11px] text-slate-500">
                      Showing first 50 of {candidates.length} records...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {candidates && (
            <button
              type="button"
              disabled={isImporting || totalCount === 0 || (newCount === 0 && duplicateCount === 0)}
              onClick={handleCommit}
              className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isImporting
                  ? 'Encrypting & Saving...'
                  : `Import ${
                      strategy === 'skip'
                        ? newCount
                        : newCount + duplicateCount
                    } Records`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
