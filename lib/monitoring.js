/**
 * lib/monitoring.js
 * Built-in monitoring loop - makes scheduled audits and the weekly digest run
 * automatically inside the Node server (started from the API route module on
 * the first request), so no external cron is required. The CRON_SECRET
 * endpoints remain available for platforms like Vercel where a long-lived
 * process isn't guaranteed.
 *
 * Cadence: one tick per hour. Each tick runs any due scheduled audits
 * (daily/weekly/monthly, tracked per audit via lastRunAt) and sends the
 * weekly digest when 7 days have passed since the last send (tracked in the
 * system_config collection so it survives restarts).
 */

import { getCollection } from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schemas'
import { env } from '@/lib/env'

const TICK_MS = 60 * 60 * 1000       // hourly
const FIRST_TICK_MS = 60 * 1000      // 1 min after boot
const DIGEST_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000
const DIGEST_META_KEY = 'META_LAST_WEEKLY_DIGEST_AT'

async function runDueDigest() {
  const col = await getCollection(COLLECTIONS.SYSTEM_CONFIG)
  const meta = await col.findOne({ key: DIGEST_META_KEY })
  const lastAt = meta?.value ? new Date(meta.value) : null

  if (lastAt && Date.now() - lastAt.getTime() < DIGEST_INTERVAL_MS) return null

  const { sendWeeklyDigests } = await import('@/lib/notifications')
  const result = await sendWeeklyDigests()
  await col.updateOne(
    { key: DIGEST_META_KEY },
    { $set: { value: new Date().toISOString(), updatedAt: new Date() } },
    { upsert: true }
  )
  return result
}

export async function monitoringTick() {
  try {
    const { processScheduledAudits } = await import('@/lib/scanners/shared/scheduler')
    const audits = await processScheduledAudits()
    if (audits.processed > 0) {
      console.error(`[monitoring] ran ${audits.processed} scheduled audit(s), ${audits.alerts} alert(s)`)
    }
  } catch (error) {
    console.error('[monitoring] scheduled audits tick failed:', error.message)
  }

  try {
    const digest = await runDueDigest()
    if (digest) {
      console.error(`[monitoring] weekly digest sent to ${digest.emailsSent}/${digest.recipients} recipient(s)`)
    }
  } catch (error) {
    console.error('[monitoring] digest tick failed:', error.message)
  }
}

/**
 * Starts the hourly loop exactly once per process (survives dev hot-reload
 * via a global flag). No-ops when the database isn't configured.
 */
export function startMonitoring() {
  if (!env.mongoUrl) return
  if (globalThis.__igrisMonitoringStarted) return
  globalThis.__igrisMonitoringStarted = true

  setTimeout(() => {
    monitoringTick()
    setInterval(monitoringTick, TICK_MS)
  }, FIRST_TICK_MS)

  console.error('[monitoring] built-in scheduler started (hourly tick)')
}
