'use client';

/**
 * hooks/use-plan-limits.js
 * Loads the live, admin-configurable plan limits from GET /api?path=plan-limits
 * (backed by lib/server-plans.js / the Admin → Plans panel). Components use
 * this instead of hardcoding which plan a feature requires, so a change made
 * in Admin takes effect in the UI without a redeploy.
 */

import { useState, useEffect } from 'react';

export function usePlanLimits() {
  const [planLimits, setPlanLimits] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api?path=plan-limits')
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.success) setPlanLimits(data.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  return { planLimits, loaded };
}
