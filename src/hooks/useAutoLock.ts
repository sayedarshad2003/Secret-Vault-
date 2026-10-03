/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useVault } from './useVault';

export function useAutoLock() {
  const { status, lockVault, settings } = useVault();
  const lastActivityRef = useRef<number>(Date.now());
  const hiddenTimestampRef = useRef<number | null>(null);

  const timeoutMinutes = settings.autoLockMinutes;

  useEffect(() => {
    if (status !== 'unlocked' || timeoutMinutes === 0) {
      return;
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    lastActivityRef.current = Date.now();

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    // User activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });

    // Inactivity check interval (runs every 5 seconds)
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current >= timeoutMs) {
        lockVault();
      }
    }, 5000);

    // Tab visibility handling: track when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTimestampRef.current = Date.now();
      } else {
        if (hiddenTimestampRef.current) {
          const elapsed = Date.now() - hiddenTimestampRef.current;
          if (elapsed >= timeoutMs) {
            lockVault();
          }
          hiddenTimestampRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, resetTimer);
      });
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, timeoutMinutes, lockVault]);
}
