'use client';

/**
 * hooks/use-settings.js
 * Loads the current user's settings from GET /api?path=settings.
 * Used by audit pages to pre-fill Deep Analysis / competitor defaults and to
 * decide whether to fire browser notifications on scan completion.
 */

import { useState, useEffect } from 'react';

const FALLBACK = {
  notifications: {
    emailAlerts: true,
    notificationEmail: '',
    pushNotifications: true,
    weeklyReport: false,
    marketingEmails: false,
  },
  security: { loginAlerts: true },
  audit: {
    defaultProvider: 'gemini',
    targetLocale: 'global',
    enableDeepAnalysis: false,
    defaultCompetitor: '',
  },
};

export function useSettings() {
  const [settings, setSettings] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api?path=settings')
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.success) setSettings(data.data.settings);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  return { settings, loaded };
}
