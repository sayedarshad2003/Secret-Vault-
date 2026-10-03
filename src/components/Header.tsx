/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lock, Menu, Plus } from 'lucide-react';
import { useVault } from '../hooks/useVault';
import { NavigationTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavigationTab;
  onOpenMobileMenu: () => void;
  onOpenAddPassword: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenAddPassword,
}) => {
  const { lockVault } = useVault();

  const tabLabels: Record<NavigationTab, string> = {
    all: 'All Passwords',
    favorites: 'Favorites',
    weak: 'Weak Passwords',
    reused: 'Reused Passwords',
    security: 'Security Health',
    settings: 'Settings',
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
      {/* Zone 1: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Vault</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-semibold">{tabLabels[currentTab]}</span>
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenAddPassword}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Password</span>
        </button>

        <button
          onClick={lockVault}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700/60 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Lock Vault immediately"
          aria-label="Lock Vault"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
    </header>
  );
};
