/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext';

interface UseClipboardOptions {
  clearAfterSeconds?: number;
}

export function useClipboard(options: UseClipboardOptions = {}) {
  const { showToast } = useToast();
  const clearTimerRef = useRef<number | null>(null);
  const lastCopiedValueRef = useRef<string | null>(null);

  const copyText = useCallback(
    async (text: string, label: string = 'Text', isSensitive: boolean = false) => {
      try {
        await navigator.clipboard.writeText(text);

        if (clearTimerRef.current) {
          window.clearTimeout(clearTimerRef.current);
          clearTimerRef.current = null;
        }

        if (isSensitive) {
          const timeoutSec = options.clearAfterSeconds ?? 30;
          lastCopiedValueRef.current = text;

          showToast(
            `${label} copied. Clipboard will automatically clear in ${timeoutSec}s.`,
            'info',
            'Copied to Clipboard'
          );

          if (timeoutSec > 0) {
            clearTimerRef.current = window.setTimeout(async () => {
              try {
                // If supported, check if clipboard still holds what we copied
                if (navigator.clipboard && navigator.clipboard.readText) {
                  const currentClip = await navigator.clipboard.readText().catch(() => null);
                  if (currentClip === lastCopiedValueRef.current) {
                    await navigator.clipboard.writeText('');
                  }
                } else {
                  // Direct overwrite if read is restricted
                  await navigator.clipboard.writeText('');
                }
                lastCopiedValueRef.current = null;
              } catch {
                // Ignore permissions failures silently without leaking value
              }
            }, timeoutSec * 1000);
          }
        } else {
          showToast(`${label} copied to clipboard.`, 'success');
        }
        return true;
      } catch (err) {
        showToast(`Could not copy ${label.toLowerCase()} to clipboard.`, 'error');
        return false;
      }
    },
    [options.clearAfterSeconds, showToast]
  );

  return { copyText };
}
