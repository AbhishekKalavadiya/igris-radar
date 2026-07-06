/**
 * lib/notifications.js
 * Shared notification dispatch — the single place scan endpoints call after a
 * scan completes (DRY: never duplicate this in individual handlers).
 *
 * Respects the user's Settings → Notifications preferences and is always
 * best-effort: failures are logged, never thrown.
 */

import { getCollection } from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schemas'
import { getUserSettings, mergeSettings } from '@/lib/settings'
import { sendEmail } from '@/lib/email/mailer'
import { scanAlertEmail, weeklyDigestEmail } from '@/lib/email/templates'

const SCAN_TYPE_LABELS = {
  security: 'Security',
  seo: 'SEO',
  aeo: 'AEO',
  geo: 'GEO',
  performance: 'Performance',
}

/**
 * Emails a scan summary to the user if they have Email Alerts enabled.
 * @param {string|null} userId - session user id ('anonymous' and null are skipped)
 * @param {Object} scan
 * @param {'security'|'seo'|'aeo'|'geo'|'performance'} scan.type
 * @param {string} scan.url
 * @param {number} scan.score
 * @param {Array}  [scan.findings]
 */
export async function notifyScanComplete(userId, { type, url, score, findings = [] }) {
  if (!userId || userId === 'anonymous') return
  try {
    const info = await getUserSettings(userId)
    if (!info || !info.settings.notifications.emailAlerts || !info.email) return

    const criticalCount = findings.filter(
      f => !f.passed && (f.severity === 'critical' || f.severity === 'high')
    ).length

    const mail = scanAlertEmail({
      name: info.name,
      scanType: SCAN_TYPE_LABELS[type] || type,
      url,
      score,
      findingsCount: findings.length,
      criticalCount,
    })
    await sendEmail({ to: info.email, ...mail })
  } catch (error) {
    console.error('[notifications] scan alert failed:', error.message)
  }
}

/**
 * Sends the weekly SEO & visibility digest to every user who opted in
 * (Settings → Notifications → Weekly Digest). Called by the cron endpoint
 * and by the built-in monitoring loop (lib/monitoring.js).
 * @returns {Promise<{recipients: number, emailsSent: number}>}
 */
export async function sendWeeklyDigests() {
  const usersCol = await getCollection(COLLECTIONS.USERS)
  const recipients = await usersCol
    .find({ 'settings.notifications.weeklyReport': true }, { projection: { id: 1, name: 1, email: 1, settings: 1 } })
    .toArray()

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const periodLabel = `${since.toLocaleDateString('en-GB')} – ${new Date().toLocaleDateString('en-GB')}`
  const [seoCol, aeoCol, geoCol] = await Promise.all([
    getCollection(COLLECTIONS.SEO_SCANS),
    getCollection(COLLECTIONS.AEO_SCANS),
    getCollection(COLLECTIONS.GEO_SCANS),
  ])

  let emailsSent = 0
  for (const user of recipients) {
    const filter = { userId: user.id, createdAt: { $gte: since } }
    const [seo, aeo, geo] = await Promise.all([
      seoCol.find(filter).sort({ createdAt: -1 }).toArray(),
      aeoCol.find(filter).sort({ createdAt: -1 }).toArray(),
      geoCol.find(filter).sort({ createdAt: -1 }).toArray(),
    ])

    // Latest score per domain per scan type
    const sites = {}
    const toDomain = (u) => { try { return new URL(u.startsWith('http') ? u : `https://${u}`).hostname } catch { return u } }
    for (const [key, scans] of [['seoScore', seo], ['aeoScore', aeo], ['geoScore', geo]]) {
      for (const scan of scans) {
        const domain = toDomain(scan.url)
        sites[domain] = sites[domain] || { domain }
        if (sites[domain][key] == null) sites[domain][key] = scan.score
      }
    }

    const totals = { scans: seo.length + aeo.length + geo.length, sites: Object.keys(sites).length }
    const to = mergeSettings(user.settings).notifications.notificationEmail || user.email
    if (!to) continue

    const mail = weeklyDigestEmail({ name: user.name, periodLabel, totals, sites: Object.values(sites) })
    const result = await sendEmail({ to, ...mail })
    if (result.sent) emailsSent++
  }

  return { recipients: recipients.length, emailsSent }
}
