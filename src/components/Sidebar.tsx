/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertTriangle,
  Download,
  FolderLock,
  Lock,
  RefreshCw,
  Settings,
  ShieldAlert,
  Star,
  Upload,
  KeyRound,
  X,
} from 'lucide-react';
import { useVault } from '../hooks/useVault';

export type NavigationTab =
  | 'all'
  | 'favorites'
  | 'weak'
  | 'reused'
  | 'security'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenGenerator: () => void;
  counts: {
    all: number;
    favorites: number;
    weak: number;
    reused: number;
  };
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenImport,
  onOpenExport,
  onOpenGenerator,
  counts,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { lockVault } = useVault();

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    countAlert?: boolean;
  }[] = [
    { id: 'all', label: 'All Passwords', icon: KeyRound, count: counts.all },
    { id: 'favorites', label: 'Favorites', icon: Star, count: counts.favorites },
    { id: 'weak', label: 'Weak Passwords', icon: AlertTriangle, count: counts.weak, countAlert: counts.weak > 0 },
    { id: 'reused', label: 'Reused Passwords', icon: RefreshCw, count: counts.reused, countAlert: counts.reused > 0 },
    { id: 'security', label: 'Security Health', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-40 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FolderLock className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-100 tracking-tight text-base font-sans">
                AegisVault
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-200 rounded-md"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Vault Items
            </div>

            {navItems.slice(0, 4).map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-emerald-400'
                          : item.countAlert
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                        item.countAlert
                          ? 'bg-amber-500/15 text-amber-300 font-semibold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Tools & Security
            </div>

            {navItems.slice(4).map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => {
                onOpenGenerator();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span>Password Generator</span>
            </button>

            <div className="pt-3 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Data Management
            </div>

            <button
              onClick={() => {
                onOpenImport();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Import CSV / Excel</span>
            </button>

            <button
              onClick={() => {
                onOpenExport();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export Vault</span>
            </button>
          </div>
        </div>

        {/* Bottom Lock Action */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={lockVault}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700/60 text-slate-200 text-xs font-medium transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>Lock Vault</span>
          </button>
          <div className="mt-2 text-center text-[10px] text-slate-400 font-mono">
            AES-256-GCM · PBKDF2
          </div>
        </div>
      </aside>
    </>
  );
};
