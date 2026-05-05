'use client';

import { useEffect, type RefObject } from 'react';

export function useSidebarKeyboardNav(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      if (!root || !root.contains(document.activeElement)) return;

      const links = Array.from(
        root.querySelectorAll<HTMLAnchorElement>('a[href^="/learn/"]'),
      ).filter((el) => el.offsetParent !== null);
      if (links.length === 0) return;

      const idx = links.findIndex((el) => el === document.activeElement);
      const nextIdx =
        e.key === 'ArrowDown' ? Math.min(idx + 1, links.length - 1) : Math.max(idx - 1, 0);
      if (idx === nextIdx) return;
      e.preventDefault();
      links[nextIdx]?.focus();
    }

    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [rootRef]);
}
