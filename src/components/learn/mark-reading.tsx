'use client';

import { useEffect, useRef } from 'react';

import { useMarkReading } from '@/lib/hooks/use-progress';

const THRESHOLD_MS = 5000;

export function MarkReading({ nodeSlug, enabled }: { nodeSlug: string; enabled: boolean }) {
  const { mutate } = useMarkReading();
  const accumulatedMs = useRef(0);
  const visibleSinceMs = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled || firedRef.current) return;

    function onVisible() {
      if (document.visibilityState === 'visible') {
        visibleSinceMs.current = Date.now();
      } else {
        if (visibleSinceMs.current !== null) {
          accumulatedMs.current += Date.now() - visibleSinceMs.current;
          visibleSinceMs.current = null;
        }
      }
      checkAndFire();
    }

    function checkAndFire() {
      const live = visibleSinceMs.current !== null ? Date.now() - visibleSinceMs.current : 0;
      if (accumulatedMs.current + live >= THRESHOLD_MS && !firedRef.current) {
        firedRef.current = true;
        mutate(nodeSlug);
      }
    }

    if (document.visibilityState === 'visible') {
      visibleSinceMs.current = Date.now();
    }
    const interval = window.setInterval(checkAndFire, 500);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, nodeSlug, mutate]);

  return null;
}
