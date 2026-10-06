import { useCallback, useState } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enter = useCallback(async (el: HTMLElement) => {
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (
        'webkitRequestFullscreen' in el &&
        typeof (el as HTMLElement & { webkitRequestFullscreen: () => void })
          .webkitRequestFullscreen === 'function'
      ) {
        (
          el as HTMLElement & { webkitRequestFullscreen: () => void }
        ).webkitRequestFullscreen();
      } else {
        return false;
      }
      setIsFullscreen(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const exit = useCallback(async () => {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
    };
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    async (el: HTMLElement) => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      const active =
        document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      if (active) await exit();
      else await enter(el);
    },
    [enter, exit],
  );

  return { isFullscreen, enter, exit, toggle };
}
