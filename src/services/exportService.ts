/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EncryptedVault, PasswordEntry } from '../types/vault';
import { serializeCSV } from '../utils/csv';

/**
 * Triggers a secure client-side browser file download from memory without external network calls.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports the raw encrypted vault envelope as a `.pmvault` JSON backup file.
 * This backup remains 100% encrypted with AES-256-GCM and PBKDF2-SHA256.
 */
export function exportEncryptedBackup(encryptedVault: EncryptedVault): void {
  const json = JSON.stringify(encryptedVault, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `password-vault-backup-${dateStr}.pmvault`);
}

/**
 * Exports decrypted entries as a plaintext CSV file.
 * CALL ONLY AFTER USER EXPLICITLY ACCEPTS WARNING!
 */
export function exportPlaintextCSV(entries: PasswordEntry[]): void {
  const rows: string[][] = [
    ['name', 'url', 'username', 'password', 'note'],
    ...entries.map(e => [
      e.name || '',
      e.url || '',
      e.username || '',
      e.password || '',
      e.note || '',
    ]),
  ];

  const csvContent = serializeCSV(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `aegisvault-plaintext-passwords-${dateStr}.csv`);
}

/**
 * Validates and parses an uploaded .pmvault file structure.
 */
export function parseEncryptedBackupFile(fileContent: string): EncryptedVault {
  const parsed = JSON.parse(fileContent);

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.salt !== 'string' ||
    typeof parsed.iv !== 'string' ||
    typeof parsed.ciphertext !== 'string' ||
    !parsed.kdf ||
    !parsed.encryption
  ) {
    throw new Error('Invalid .pmvault backup format: missing cryptographic properties.');
  }

  return parsed as EncryptedVault;
}
