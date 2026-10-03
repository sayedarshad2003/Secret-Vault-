/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  resultCount?: number;
  totalCount?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  resultCount,
  totalCount,
}) => {
  return (
    <div className="relative flex-1">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        placeholder="Search passwords, usernames, websites, notes..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-20 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
      />
      <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {typeof resultCount === 'number' && (
          <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
            {resultCount}
            {typeof totalCount === 'number' && totalCount !== resultCount ? ` / ${totalCount}` : ''}
          </span>
        )}
      </div>
    </div>
  );
};
