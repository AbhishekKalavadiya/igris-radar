'use client';

/**
 * hooks/use-bfcache-reload.js
 * When a user is sent to an external checkout (Dodo) via window.location.href
 * and hits the browser back button without paying, some browsers restore the
 * previous page from the back/forward cache (bfcache) instead of a fresh
 * network load. That resurrects a frozen JS/DOM snapshot - which can be
 * stale (an old deployed bundle/copy) and leaves any "redirecting..." button
 * state stuck forever, since no code ever runs to clear it.
 *
 * Forcing a full reload on bfcache restoration guarantees the current
 * deployed bundle and fresh data, and naturally resets all component state.
 */
import { useEffect } from 'react';

export function useBfcacheReload() {
  useEffect(() => {
    const onPageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);
}
