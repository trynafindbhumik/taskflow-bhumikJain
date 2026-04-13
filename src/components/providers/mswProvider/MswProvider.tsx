'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (typeof window === 'undefined') {
      setReady(true);
      return () => {
        cancelled = true;
      };
    }

    const init = async () => {
      try {
        if (process.env.NEXT_PUBLIC_USE_MSW !== 'false') {
          const { worker } = await import('@/mocks/browser');
          await worker.start({
            onUnhandledRequest: 'bypass',
            quiet: process.env.NODE_ENV === 'development',
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[MSW] Worker failed to start:', err);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
