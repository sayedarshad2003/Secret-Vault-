/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sanitizes and validates user-supplied URLs to prevent XSS (e.g. javascript: schemes).
 */
export function isSafeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) return false;

  // Explicitly deny dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  // Support web protocols or well-structured custom schemes (e.g. android://, chrome://)
  try {
    const parsed = new URL(trimmed);
    const validProtocols = ['http:', 'https:', 'android:'];
    return validProtocols.includes(parsed.protocol);
  } catch {
    // If it looks like a domain without scheme (e.g. github.com), check if adding https:// works
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
      return true;
    }
    return false;
  }
}

/**
 * Normalizes a URL for safe opening in a browser tab.
 */
export function normalizeUrlForOpen(rawUrl: string): string | null {
  if (!isSafeUrl(rawUrl)) return null;
  const trimmed = rawUrl.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    if (parsed.protocol === 'android:') {
      return parsed.href;
    }
    return null;
  } catch {
    // If lacks protocol, default to https://
    return `https://${trimmed}`;
  }
}

/**
 * Extracts a clean domain or host name for display in lists.
 */
export function extractDomainDisplay(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    // Fallback: strip leading android:// or return truncated string
    if (trimmed.startsWith('android://')) {
      const match = trimmed.match(/@([a-zA-Z0-9._]+)/);
      if (match && match[1]) return match[1];
      return 'Android App';
    }
    return trimmed.slice(0, 30);
  }
}

/**
 * Normalizes a URL for duplicate detection (strips query, hash, trailing slashes, www).
 */
export function normalizeUrlForDeduplication(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim().toLowerCase();
  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${host}${path}`;
  } catch {
    return trimmed.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  }
}
