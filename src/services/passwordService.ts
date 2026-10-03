/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PasswordAnalysisResult, PasswordEntry } from '../types/vault';
import { evaluatePasswordStrength } from '../utils/validation';

export interface SecurityAuditSummary {
  total: number;
  weakCount: number;
  reusedCount: number;
  oldCount: number;
  healthyCount: number;
  overallScore: number; // 0-100
  results: PasswordAnalysisResult[];
}

/**
 * Runs a 100% client-side security analysis on decrypted vault entries.
 * Never connects to any third-party leak databases or remote endpoints.
 */
export function auditVaultSecurity(
  entries: PasswordEntry[],
  oldThresholdDays: number = 90
): SecurityAuditSummary {
  if (entries.length === 0) {
    return {
      total: 0,
      weakCount: 0,
      reusedCount: 0,
      oldCount: 0,
      healthyCount: 0,
      overallScore: 100,
      results: [],
    };
  }

  const now = new Date().getTime();
  const oldThresholdMs = oldThresholdDays * 24 * 60 * 60 * 1000;

  // Build password frequency map for reused password detection
  const passwordFrequency = new Map<string, string[]>();
  for (const entry of entries) {
    if (!entry.password) continue;
    const existing = passwordFrequency.get(entry.password) || [];
    existing.push(entry.name || 'Unnamed Account');
    passwordFrequency.set(entry.password, existing);
  }

  let weakCount = 0;
  let reusedCount = 0;
  let oldCount = 0;

  const results: PasswordAnalysisResult[] = entries.map(entry => {
    const issues: PasswordAnalysisResult['issues'] = [];
    const strength = evaluatePasswordStrength(entry.password);

    // 1. Weak check
    if (strength.score < 3) {
      weakCount++;
      issues.push({
        type: 'weak',
        message: `Password is ${strength.label.toLowerCase()}`,
        details: strength.feedback.join('; '),
      });
    }

    // 2. Reused check
    const reuseList = passwordFrequency.get(entry.password) || [];
    if (reuseList.length > 1) {
      reusedCount++;
      const otherAccounts = reuseList.filter(name => name !== entry.name);
      issues.push({
        type: 'reused',
        message: `Reused across ${reuseList.length} accounts`,
        details: otherAccounts.length > 0 ? `Shared with: ${otherAccounts.slice(0, 3).join(', ')}` : undefined,
      });
    }

    // 3. Old check
    const updatedAt = entry.updatedAt ? new Date(entry.updatedAt).getTime() : 0;
    if (updatedAt > 0 && now - updatedAt > oldThresholdMs) {
      oldCount++;
      const daysOld = Math.floor((now - updatedAt) / (24 * 60 * 60 * 1000));
      issues.push({
        type: 'old',
        message: `Last updated ${daysOld} days ago`,
        details: 'Consider rotating credentials periodically.',
      });
    }

    return {
      entry,
      issues,
      strengthScore: strength.score,
      strengthLabel: strength.label,
    };
  });

  const healthyCount = results.filter(r => r.issues.length === 0).length;

  // Calculate overall score (0-100)
  const penalty =
    (weakCount / entries.length) * 50 +
    (reusedCount / entries.length) * 35 +
    (oldCount / entries.length) * 15;
  const overallScore = Math.max(10, Math.min(100, Math.round(100 - penalty)));

  return {
    total: entries.length,
    weakCount,
    reusedCount,
    oldCount,
    healthyCount,
    overallScore,
    results,
  };
}
