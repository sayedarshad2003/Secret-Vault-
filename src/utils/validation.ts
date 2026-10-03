/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PasswordScore {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  feedback: string[];
  entropyBits: number;
}

/**
 * Calculates entropy and evaluates password strength locally without sending to any server.
 */
export function evaluatePasswordStrength(password: string): PasswordScore {
  if (!password || password.length === 0) {
    return {
      score: 0,
      label: 'Very Weak',
      feedback: ['Password is empty'],
      entropyBits: 0,
    };
  }

  const length = password.length;
  let poolSize = 0;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumbers) poolSize += 10;
  if (hasSymbols) poolSize += 33;

  const entropyBits = Math.round(length * Math.log2(Math.max(2, poolSize)));
  const feedback: string[] = [];

  if (length < 8) {
    feedback.push('Too short (at least 12 characters recommended)');
  } else if (length < 12) {
    feedback.push('Consider using at least 12 characters');
  }

  const varietyCount = [hasLower, hasUpper, hasNumbers, hasSymbols].filter(Boolean).length;
  if (varietyCount < 3) {
    feedback.push('Include a mix of uppercase, lowercase, numbers, and symbols');
  }

  // Common patterns
  if (/^[a-zA-Z]+$/.test(password)) feedback.push('Add numbers or symbols');
  if (/^[0-9]+$/.test(password)) feedback.push('Add letters and symbols');
  if (/(.)\1{2,}/.test(password)) feedback.push('Avoid repeating identical characters');

  let score = 0;
  if (entropyBits >= 80 && length >= 14 && varietyCount >= 3) {
    score = 4;
  } else if (entropyBits >= 60 && length >= 12 && varietyCount >= 3) {
    score = 3;
  } else if (entropyBits >= 45 && length >= 10 && varietyCount >= 2) {
    score = 2;
  } else if (entropyBits >= 28 && length >= 8) {
    score = 1;
  } else {
    score = 0;
  }

  const labels: PasswordScore['label'][] = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  return {
    score,
    label: labels[score],
    feedback: feedback.length === 0 ? ['Good, resilient password'] : feedback,
    entropyBits,
  };
}

/**
 * Validates master password criteria:
 * - Minimum 12 characters
 * - Must not be empty
 */
export function validateMasterPassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Master password cannot be empty.' };
  }
  if (password.length < 12) {
    return { valid: false, error: 'Master password must be at least 12 characters long.' };
  }
  return { valid: true };
}
