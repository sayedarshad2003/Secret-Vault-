/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cryptographically secure random number generators.
 * Uses window.crypto.getRandomValues. Math.random() is strictly forbidden.
 */

export function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function generateSecureUUID(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 using crypto.getRandomValues
  const bytes = getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Ambiguous characters: O, 0, o, l, 1, I, |, `, '
const AMBIGUOUS = new Set(['O', '0', 'o', 'l', '1', 'I', '|', '`', "'", '"', ';', ':']);

/**
 * Returns a cryptographically secure random integer in the range [0, max).
 * Uses rejection sampling to eliminate modulo bias.
 */
function getSecureRandomInt(max: number): number {
  if (max <= 0) return 0;
  if (max > 256) {
    const range = 65536;
    const limit = range - (range % max);
    const array = new Uint16Array(1);
    let val: number;
    do {
      crypto.getRandomValues(array);
      val = array[0];
    } while (val >= limit);
    return val % max;
  }
  const limit = 256 - (256 % max);
  const array = new Uint8Array(1);
  let val: number;
  do {
    crypto.getRandomValues(array);
    val = array[0];
  } while (val >= limit);
  return val % max;
}

/**
 * Generates a high-entropy password guaranteed to contain at least one
 * character from each requested category, using cryptographically secure random values.
 */
export function generateSecurePassword(options: PasswordGeneratorOptions): string {
  let charPool = '';
  const requiredChars: string[] = [];

  const filterAmbiguous = (charset: string) => {
    if (!options.excludeAmbiguous) return charset;
    return charset
      .split('')
      .filter(c => !AMBIGUOUS.has(c))
      .join('');
  };

  const upper = filterAmbiguous(UPPERCASE);
  const lower = filterAmbiguous(LOWERCASE);
  const num = filterAmbiguous(NUMBERS);
  const sym = filterAmbiguous(SYMBOLS);

  if (options.uppercase && upper.length > 0) {
    charPool += upper;
    requiredChars.push(upper[getSecureRandomInt(upper.length)]);
  }
  if (options.lowercase && lower.length > 0) {
    charPool += lower;
    requiredChars.push(lower[getSecureRandomInt(lower.length)]);
  }
  if (options.numbers && num.length > 0) {
    charPool += num;
    requiredChars.push(num[getSecureRandomInt(num.length)]);
  }
  if (options.symbols && sym.length > 0) {
    charPool += sym;
    requiredChars.push(sym[getSecureRandomInt(sym.length)]);
  }

  // Fallback if user unchecks everything
  if (charPool.length === 0) {
    charPool = lower.length > 0 ? lower : LOWERCASE;
  }

  const length = Math.max(8, Math.min(128, options.length));
  const result: string[] = [...requiredChars];

  while (result.length < length) {
    const char = charPool[getSecureRandomInt(charPool.length)];
    result.push(char);
  }

  // Cryptographically shuffle using Fisher-Yates with secure random values
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result.join('');
}
