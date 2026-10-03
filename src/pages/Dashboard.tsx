/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  FolderOpen,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Star,
  Clock,
} from 'lucide-react';
import { PasswordCard } from '../components/PasswordCard';
import { PasswordForm } from '../components/PasswordForm';
import { SearchBar } from '../components/SearchBar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useVault } from '../hooks/useVault';
import { PasswordEntry } from '../types/vault';
import { auditVaultSecurity } from '../services/passwordService';

export type DashboardFilter = 'all' | 'favorites' | 'recent' | 'weak' | 'reused';

interface DashboardProps {
  initialFilter?: DashboardFilter;
  onOpenGenerator: () => void;
  onOpenImport: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  initialFilter = 'all',
  onOpenGenerator,
  onOpenImport,
}) => {
  const { entries, addEntry, updateEntry, deleteEntry, toggleFavorite, settings } = useVault();
  const [filter, setFilter] = useState<DashboardFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  // Audit for security filter tabs
  const audit = useMemo(() => auditVaultSecurity(entries), [entries]);

  // Set of weak IDs and reused IDs
  const weakIds = useMemo(() => {
    return new Set(
      audit.results.filter(r => r.issues.some(i => i.type === 'weak')).map(r => r.entry.id)
    );
  }, [audit]);

  const reusedIds = useMemo(() => {
    return new Set(
      audit.results.filter(r => r.issues.some(i => i.type === 'reused')).map(r => r.entry.id)
    );
  }, [audit]);

  // Filtered and searched entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // 1. Filter tab
    if (filter === 'favorites') {
      result = result.filter(e => e.favorite);
    } else if (filter === 'recent') {
      result = result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (filter === 'weak') {
      result = result.filter(e => weakIds.has(e.id));
    } else if (filter === 'reused') {
      result = result.filter(e => reusedIds.has(e.id));
    }

    // 2. Search query (runs entirely in memory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          e.url.toLowerCase().includes(q) ||
          e.note.toLowerCase().includes(q)
      );
    }

    return result;
  }, [entries, filter, searchQuery, weakIds, reusedIds]);

  const handleSaveEntry = async (entryData: {
    name: string;
    url: string;
    username: string;
    password: string;
    note: string;
    favorite: boolean;
  }) => {
    if (editingEntry) {
      await updateEntry({
        ...editingEntry,
        ...entryData,
      });
      showToast(`Updated "${entryData.name}"`, 'success');
      setEditingEntry(null);
    } else {
      await addEntry(entryData);
      showToast(`Added "${entryData.name}" to encrypted vault`, 'success');
      setShowAddForm(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteEntry(deletingId);
      showToast('Entry removed from vault.', 'info');
    } catch (err) {
      showToast('Failed to delete entry.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const tabs: { id: DashboardFilter; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: 'all', label: 'All Items', icon: KeyRound, count: entries.length },
    { id: 'favorites', label: 'Favorites', icon: Star, count: entries.filter(e => e.favorite).length },
    { id: 'recent', label: 'Recently Added', icon: Clock, count: Math.min(entries.length, 10) },
    { id: 'weak', label: 'Weak Passwords', icon: AlertTriangle, count: weakIds.size },
    { id: 'reused', label: 'Reused Passwords', icon: RefreshCw, count: reusedIds.size },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={filteredEntries.length}
          totalCount={entries.length}
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Password</span>
          </button>
        </div>
      </div>

      {/* Filter Segmented Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/80 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Password Grid / Empty State */}
      {filteredEntries.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30 p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            {searchQuery ? <Search className="w-5 h-5" /> : <FolderOpen className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              {searchQuery ? 'No matching passwords found' : 'No passwords in this category'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No credentials matching "${searchQuery}". Check spelling or clear search.`
                : filter === 'favorites'
                ? 'Star any entry to quickly access it from Favorites.'
                : filter === 'weak'
                ? 'Great news! You have no passwords flagged as weak.'
                : filter === 'reused'
                ? 'No reused passwords detected across your accounts.'
                : 'Get started by adding your first password or importing an Excel or CSV file.'}
            </p>
          </div>
          {!searchQuery && entries.length === 0 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                Add First Password
              </button>
              <button
                onClick={onOpenImport}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                Import CSV / Excel
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEntries.map(entry => (
            <PasswordCard
              key={entry.id}
              entry={entry}
              onEdit={item => setEditingEntry(item)}
              onDelete={id => setDeletingId(id)}
              onToggleFavorite={toggleFavorite}
              clipboardClearSeconds={settings.clipboardClearSeconds}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {(showAddForm || editingEntry) && (
        <PasswordForm
          initialEntry={editingEntry}
          onSave={handleSaveEntry}
          onClose={() => {
            setShowAddForm(false);
            setEditingEntry(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <ConfirmDialog
          title="Delete Password Entry"
          message="Are you sure you want to remove this password from your vault? It will be permanently removed upon re-encryption."
          confirmText="Delete Entry"
          isDestructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
};
