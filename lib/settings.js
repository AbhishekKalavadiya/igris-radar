/**
 * lib/settings.js
 * Single source of truth for user settings defaults and server-side access.
 *
 * User settings live on the user document (`settings` field, see
 * lib/db/schemas.js → UserSettings). Documents created before this feature
 * have no `settings` field, so every read must merge over DEFAULT_SETTINGS.
 */

import { getCollection } from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schemas'

export const DEFAULT_SETTINGS = {
  notifications: {
    emailAlerts: true,
    notificationEmail: '',
    pushNotifications: true,
    weeklyReport: false,
    marketingEmails: false,
  },
  security: {
    loginAlerts: true,
  },
  audit: {
    defaultProvider: 'gemini',
    targetLocale: 'global',
    enableDeepAnalysis: false,
    defaultCompetitor: '',
  },
}

/**
 * Deep-merges stored settings over defaults so missing keys never surface
 * as `undefined` to callers.
 * @param {Object} [stored] - the `settings` field from a user document
 * @returns {import('@/lib/db/schemas').UserSettings}
 */
export function mergeSettings(stored = {}) {
  return {
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(stored.notifications || {}) },
    security: { ...DEFAULT_SETTINGS.security, ...(stored.security || {}) },
    audit: { ...DEFAULT_SETTINGS.audit, ...(stored.audit || {}) },
  }
}

/**
 * Loads a user's settings (merged with defaults) plus the resolved
 * notification email address.
 * @param {string} userId
 * @returns {Promise<{settings: Object, email: string|null, name: string|null}|null>}
 */
export async function getUserSettings(userId) {
  const col = await getCollection(COLLECTIONS.USERS)
  const user = await col.findOne({ id: userId }, { projection: { settings: 1, email: 1, name: 1 } })
  if (!user) return null
  const settings = mergeSettings(user.settings)
  return {
    settings,
    email: settings.notifications.notificationEmail || user.email || null,
    name: user.name || null,
  }
}
