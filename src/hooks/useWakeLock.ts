import { useCallback, useRef } from 'react';

export function useWakeLock() {
  const sentinel = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async (): Promise<boolean> => {
    if (!('wakeLock' in navigator)) return false;
    try {
      sentinel.current = await navigator.wakeLock.request('screen');
      sentinel.current.addEventListener('release', () => {
        sentinel.current = null;
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const release = useCallback(async (): Promise<void> => {
    try {
      await sentinel.current?.release();
    } catch {
      /* ignore */
    }
    sentinel.current = null;
  }, []);

  return { request, release };
}
