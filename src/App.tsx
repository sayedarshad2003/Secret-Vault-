/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ExportModal } from './components/ExportModal';
import { Header } from './components/Header';
import { ImportModal } from './components/ImportModal';
import { PasswordForm } from './components/PasswordForm';
import { PasswordGenerator } from './components/PasswordGenerator';
import { NavigationTab, Sidebar } from './components/Sidebar';
import { ToastProvider, useToast } from './context/ToastContext';
import { VaultProvider } from './context/VaultContext';
import { useAutoLock } from './hooks/useAutoLock';
import { useVault } from './hooks/useVault';
import { Dashboard, DashboardFilter } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Security } from './pages/Security';
import { Settings } from './pages/Settings';
import { Setup } from './pages/Setup';
import { auditVaultSecurity } from './services/passwordService';
import { FolderLock, KeyRound, X } from 'lucide-react';

const VaultWorkspace: React.FC = () => {
  const { status, entries, addEntry, importEntries } = useVault();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Attach auto-lock hook
  useAutoLock();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Compute navigation tab based on URL path
  const currentTab: NavigationTab = useMemo(() => {
    const path = location.pathname.replace(/^\//, '');
    if (['all', 'favorites', 'weak', 'reused', 'security', 'settings'].includes(path)) {
      return path as NavigationTab;
    }
    return 'all';
  }, [location.pathname]);

  // Counts for sidebar badges
  const counts = useMemo(() => {
    const audit = auditVaultSecurity(entries);
    const weakCount = audit.results.filter(r => r.issues.some(i => i.type === 'weak')).length;
    const reusedCount = audit.results.filter(r => r.issues.some(i => i.type === 'reused')).length;

    return {
      all: entries.length,
      favorites: entries.filter(e => e.favorite).length,
      weak: weakCount,
      reused: reusedCount,
    };
  }, [entries]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
          <FolderLock className="w-5 h-5" />
        </div>
        <div className="text-xs font-mono">Initializing Secure Environment...</div>
      </div>
    );
  }

  if (status === 'uninitialized') {
    return <Setup />;
  }

  if (status === 'locked') {
    return <Login />;
  }

  const handleSelectTab = (tab: NavigationTab) => {
    navigate(`/${tab}`);
  };

  const handleQuickAdd = async (entryData: {
    name: string;
    url: string;
    username: string;
    password: string;
    note: string;
    favorite: boolean;
  }) => {
    await addEntry(entryData);
    showToast(`Added "${entryData.name}" to encrypted vault.`, 'success');
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenImport={() => setShowImportModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenGenerator={() => setShowGeneratorModal(true)}
        counts={counts}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAddPassword={() => setShowAddForm(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route
              path="/all"
              element={
                <Dashboard
                  initialFilter="all"
                  onOpenGenerator={() => setShowGeneratorModal(true)}
                  onOpenImport={() => setShowImportModal(true)}
                />
              }
            />
            <Route
              path="/favorites"
              element={
                <Dashboard
                  initialFilter="favorites"
                  onOpenGenerator={() => setShowGeneratorModal(true)}
                  onOpenImport={() => setShowImportModal(true)}
                />
              }
            />
            <Route
              path="/weak"
              element={
                <Dashboard
                  initialFilter="weak"
                  onOpenGenerator={() => setShowGeneratorModal(true)}
                  onOpenImport={() => setShowImportModal(true)}
                />
              }
            />
            <Route
              path="/reused"
              element={
                <Dashboard
                  initialFilter="reused"
                  onOpenGenerator={() => setShowGeneratorModal(true)}
                  onOpenImport={() => setShowImportModal(true)}
                />
              }
            />
            <Route path="/security" element={<Security />} />
            <Route
              path="/settings"
              element={
                <Settings
                  onOpenImport={() => setShowImportModal(true)}
                  onOpenExport={() => setShowExportModal(true)}
                />
              }
            />
            <Route path="*" element={<Navigate to="/all" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      {showImportModal && (
        <ImportModal
          existingEntries={entries}
          onCommitImport={async merged => {
            await importEntries(merged);
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showExportModal && (
        <ExportModal entries={entries} onClose={() => setShowExportModal(false)} />
      )}

      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowGeneratorModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <PasswordGenerator />
          </div>
        </div>
      )}

      {showAddForm && (
        <PasswordForm
          onSave={handleQuickAdd}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <VaultProvider>
        <HashRouter>
          <VaultWorkspace />
        </HashRouter>
      </VaultProvider>
    </ToastProvider>
  );
}
