/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, RefreshCw, Check, ShieldCheck } from 'lucide-react';
import { generateSecurePassword, PasswordGeneratorOptions } from '../crypto/random';
import { evaluatePasswordStrength } from '../utils/validation';
import { useClipboard } from '../hooks/useClipboard';

interface PasswordGeneratorProps {
  onSelectPassword?: (password: string) => void;
  initialOptions?: Partial<PasswordGeneratorOptions>;
  clipboardClearSeconds?: number;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  onSelectPassword,
  initialOptions,
  clipboardClearSeconds = 30,
}) => {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: initialOptions?.length ?? 20,
    uppercase: initialOptions?.uppercase ?? true,
    lowercase: initialOptions?.lowercase ?? true,
    numbers: initialOptions?.numbers ?? true,
    symbols: initialOptions?.symbols ?? true,
    excludeAmbiguous: initialOptions?.excludeAmbiguous ?? false,
  });

  const [generatedPassword, setGeneratedPassword] = useState<string>(() =>
    generateSecurePassword({
      length: initialOptions?.length ?? 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
    })
  );

  const { copyText } = useClipboard({ clearAfterSeconds: clipboardClearSeconds });
  const strength = evaluatePasswordStrength(generatedPassword);

  const handleGenerate = () => {
    const newPwd = generateSecurePassword(options);
    setGeneratedPassword(newPwd);
  };

  const updateOption = <K extends keyof PasswordGeneratorOptions>(
    key: K,
    value: PasswordGeneratorOptions[K]
  ) => {
    const updated = { ...options, [key]: value };
    // Prevent unchecking all character sets
    if (
      !updated.uppercase &&
      !updated.lowercase &&
      !updated.numbers &&
      !updated.symbols
    ) {
      updated[key] = true as PasswordGeneratorOptions[K];
    }
    setOptions(updated);
    setGeneratedPassword(generateSecurePassword(updated));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">Password Generator</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Web Crypto API (RNG)</span>
      </div>

      {/* Generated Display */}
      <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex items-center justify-between gap-3">
        <div className="font-mono text-sm sm:text-base text-emerald-400 tracking-wider break-all select-all flex-1 min-w-0">
          {generatedPassword}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleGenerate}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Generate new"
            aria-label="Generate new password"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => copyText(generatedPassword, 'Password', true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Copy to clipboard (clears in 30s)"
            aria-label="Copy password to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Strength Bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">Entropy: ~{strength.entropyBits} bits</span>
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
        <div className="grid grid-cols-4 gap-1.5 h-1.5">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-200 ${
                idx <= strength.score - 1
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

      {/* Length Slider */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
          <span>Length</span>
          <span className="font-mono text-emerald-400 font-semibold">{options.length}</span>
        </div>
        <input
          type="range"
          min="8"
          max="64"
          value={options.length}
          onChange={e => updateOption('length', parseInt(e.target.value, 10))}
          className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span>8</span>
          <span>24</span>
          <span>48</span>
          <span>64</span>
        </div>
      </div>

      {/* Checkbox Toggles */}
      <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={options.uppercase}
            onChange={e => updateOption('uppercase', e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
          />
          <span>Uppercase (A-Z)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={options.lowercase}
            onChange={e => updateOption('lowercase', e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
          />
          <span>Lowercase (a-z)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={options.numbers}
            onChange={e => updateOption('numbers', e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
          />
          <span>Numbers (0-9)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={options.symbols}
            onChange={e => updateOption('symbols', e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
          />
          <span>Symbols (!@#$...)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none col-span-2">
          <input
            type="checkbox"
            checked={options.excludeAmbiguous}
            onChange={e => updateOption('excludeAmbiguous', e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
          />
          <span className="text-slate-400">Exclude Ambiguous (0, O, l, 1, I)</span>
        </label>
      </div>

      {onSelectPassword && (
        <button
          type="button"
          onClick={() => onSelectPassword(generatedPassword)}
          className="w-full mt-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" />
          <span>Use This Password</span>
        </button>
      )}
    </div>
  );
};
