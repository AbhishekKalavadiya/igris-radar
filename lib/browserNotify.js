/**
 * lib/browserNotify.js
 * Client-side browser (push) notification helpers — used by the Settings page
 * (permission request on toggle) and audit pages (notify on scan completion).
 */

/** @returns {boolean} whether the Notification API exists in this browser */
export function browserNotificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Requests notification permission from the browser.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export async function requestNotificationPermission() {
  if (!browserNotificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/**
 * Fires a desktop notification if the user enabled push notifications and the
 * browser granted permission. Silently no-ops otherwise.
 * @param {boolean} enabled - the user's pushNotifications setting
 * @param {string} title
 * @param {string} body
 */
export function notifyScanDone(enabled, title, body) {
  if (!enabled || !browserNotificationsSupported()) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.ico' })
  } catch (error) {
    console.error('[browserNotify] failed:', error.message)
  }
}
