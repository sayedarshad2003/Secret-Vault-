/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PasswordEntry {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  note: string;
  favorite: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Vault {
  version: number;
  entries: PasswordEntry[];
}

export interface EncryptedVault {
  version: number;
  salt: string; // Base64 encoded 16-byte random salt
  iv: string;   // Base64 encoded 12-byte random IV
  ciphertext: string; // Base64 encoded ciphertext including AES-GCM tag
  kdf: {
    algorithm: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
  };
  encryption: {
    algorithm: 'AES-GCM';
    keyLength: 256;
  };
}

export type AutoLockTimeout = 1 | 5 | 15 | 30 | 0; // minutes, 0 means Never

export interface AppSettings {
  autoLockMinutes: AutoLockTimeout;
  theme: 'dark' | 'light' | 'system';
  defaultGeneratorLength: number;
  defaultGeneratorUppercase: boolean;
  defaultGeneratorLowercase: boolean;
  defaultGeneratorNumbers: boolean;
  defaultGeneratorSymbols: boolean;
  defaultGeneratorExcludeAmbiguous: boolean;
  clipboardClearSeconds: number;
}

export interface ImportCandidate {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  note: string;
  isDuplicate: boolean;
  duplicateOfId?: string;
  duplicateOfName?: string;
  isValid: boolean;
  validationError?: string;
}

export type DuplicateResolutionStrategy = 'skip' | 'replace' | 'keep_both';

export interface PasswordAnalysisResult {
  entry: PasswordEntry;
  issues: {
    type: 'weak' | 'reused' | 'old';
    message: string;
    details?: string;
  }[];
  strengthScore: number; // 0 to 4
  strengthLabel: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
}
