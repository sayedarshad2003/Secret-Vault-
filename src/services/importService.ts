/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { generateSecureUUID } from '../crypto/random';
import {
  DuplicateResolutionStrategy,
  ImportCandidate,
  PasswordEntry,
} from '../types/vault';
import { parseCSV } from '../utils/csv';
import { normalizeUrlForDeduplication } from '../utils/url';

interface RawRow {
  name: string;
  url: string;
  username: string;
  password: string;
  note: string;
}

/**
 * Maps varying header names to standard keys.
 */
function normalizeHeaders(headerRow: string[]): { [stdKey in keyof RawRow]?: number } {
  const mapping: { [stdKey in keyof RawRow]?: number } = {};

  headerRow.forEach((col, index) => {
    const clean = col.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (['name', 'title', 'service', 'account', 'app', 'label'].includes(clean)) {
      if (mapping.name === undefined) mapping.name = index;
    } else if (['url', 'website', 'link', 'webaddress', 'uri'].includes(clean)) {
      if (mapping.url === undefined) mapping.url = index;
    } else if (['username', 'user', 'login', 'email', 'accountname', 'userid'].includes(clean)) {
      if (mapping.username === undefined) mapping.username = index;
    } else if (['password', 'pass', 'secret', 'pwd'].includes(clean)) {
      if (mapping.password === undefined) mapping.password = index;
    } else if (['note', 'notes', 'comment', 'comments', 'description', 'extra'].includes(clean)) {
      if (mapping.note === undefined) mapping.note = index;
    }
  });

  return mapping;
}

/**
 * Extracts raw records from 2D array of string cells.
 */
function extractRecords(rows: string[][]): RawRow[] {
  if (rows.length < 2) return [];

  const headers = rows[0];
  const mapping = normalizeHeaders(headers);

  // If no identifiable headers, assume column order: name, url, username, password, note
  const nameIdx = mapping.name ?? 0;
  const urlIdx = mapping.url ?? 1;
  const usernameIdx = mapping.username ?? 2;
  const passwordIdx = mapping.password ?? 3;
  const noteIdx = mapping.note ?? 4;

  const records: RawRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(c => !c.trim())) continue; // Skip empty rows

    records.push({
      name: (row[nameIdx] || '').trim(),
      url: (row[urlIdx] || '').trim(),
      username: (row[usernameIdx] || '').trim(),
      password: (row[passwordIdx] || '').trim(),
      note: (row[noteIdx] || '').trim(),
    });
  }

  return records;
}

/**
 * Parses raw CSV text into import candidates with duplicate detection against current vault.
 */
export function parseCSVFile(
  csvContent: string,
  existingEntries: PasswordEntry[]
): ImportCandidate[] {
  const table = parseCSV(csvContent);
  const records = extractRecords(table);
  return evaluateImportCandidates(records, existingEntries);
}

/**
 * Parses Excel workbook (.xlsx / .xls) locally into import candidates.
 */
export function parseExcelFile(
  fileBuffer: ArrayBuffer,
  existingEntries: PasswordEntry[]
): ImportCandidate[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const stringRows: string[][] = rows.map(r =>
    Array.isArray(r) ? r.map(c => (c !== undefined && c !== null ? String(c) : '')) : []
  );

  const records = extractRecords(stringRows);
  return evaluateImportCandidates(records, existingEntries);
}

/**
 * Validates extracted records and compares against existing vault entries to detect duplicates.
 */
function evaluateImportCandidates(
  records: RawRow[],
  existingEntries: PasswordEntry[]
): ImportCandidate[] {
  return records.map(record => {
    const id = generateSecureUUID();
    const hasName = Boolean(record.name);
    const hasSecret = Boolean(record.password || record.username);

    if (!hasName && !hasSecret) {
      return {
        id,
        ...record,
        isValid: false,
        validationError: 'Missing entry name and credentials.',
        isDuplicate: false,
      };
    }

    const normName = record.name.toLowerCase();
    const normUser = record.username.toLowerCase();
    const normUrl = normalizeUrlForDeduplication(record.url);

    // Find duplicate in existing vault
    const duplicate = existingEntries.find(exist => {
      const existUser = exist.username.toLowerCase();
      const existName = exist.name.toLowerCase();
      const existUrl = normalizeUrlForDeduplication(exist.url);

      const userMatch = normUser && existUser && normUser === existUser;

      // Duplicate by name + username
      if (normName && existName && normName === existName && userMatch) {
        return true;
      }

      // Duplicate by normalized URL + username
      if (normUrl && existUrl && normUrl === existUrl && userMatch) {
        return true;
      }

      return false;
    });

    return {
      id,
      name: record.name || 'Untitled Account',
      url: record.url,
      username: record.username,
      password: record.password,
      note: record.note,
      isValid: true,
      isDuplicate: Boolean(duplicate),
      duplicateOfId: duplicate?.id,
      duplicateOfName: duplicate?.name,
    };
  });
}

/**
 * Resolves candidates into final PasswordEntry list to commit into vault.
 */
export function resolveImportMerge(
  candidates: ImportCandidate[],
  existingEntries: PasswordEntry[],
  strategy: DuplicateResolutionStrategy
): PasswordEntry[] {
  const now = new Date().toISOString();
  let result = [...existingEntries];

  const validCandidates = candidates.filter(c => c.isValid);

  for (const candidate of validCandidates) {
    if (candidate.isDuplicate && candidate.duplicateOfId) {
      if (strategy === 'skip') {
        continue;
      } else if (strategy === 'replace') {
        result = result.map(entry => {
          if (entry.id === candidate.duplicateOfId) {
            return {
              ...entry,
              name: candidate.name,
              url: candidate.url || entry.url,
              username: candidate.username || entry.username,
              password: candidate.password || entry.password,
              note: candidate.note || entry.note,
              updatedAt: now,
            };
          }
          return entry;
        });
      } else if (strategy === 'keep_both') {
        result.push({
          id: candidate.id,
          name: `${candidate.name} (Imported)`,
          url: candidate.url,
          username: candidate.username,
          password: candidate.password,
          note: candidate.note,
          favorite: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      // New non-duplicate entry
      result.push({
        id: candidate.id,
        name: candidate.name,
        url: candidate.url,
        username: candidate.username,
        password: candidate.password,
        note: candidate.note,
        favorite: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return result;
}
