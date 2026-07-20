/**
 * lib/scanAnalytics.js
 * Aggregates scan volume across all 7 scan collections for the admin
 * Analytics tab. No new collection - derives everything from createdAt
 * on documents that already exist.
 */
import { getCollection } from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schemas'

/** SCANNERS key -> collection name (mirrors lib/scannerAccents.js keys) */
const TYPE_COLLECTIONS = {
  security: COLLECTIONS.SECURITY_SCANS,
  seo:      COLLECTIONS.SEO_SCANS,
  aeo:      COLLECTIONS.AEO_SCANS,
  geo:      COLLECTIONS.GEO_SCANS,
  aso:      COLLECTIONS.ASO_SCANS,
  health:   COLLECTIONS.PERFORMANCE_SCANS,
  brand:    COLLECTIONS.BRAND_VISIBILITY,
}

const TYPE_KEYS = Object.keys(TYPE_COLLECTIONS)

/**
 * @param {string} typeKey
 * @param {Date} since
 * @returns {Promise<{ total: number, byDay: Record<string, number> }>}
 */
async function getTypeStats(typeKey, since) {
  try {
    const col = await getCollection(TYPE_COLLECTIONS[typeKey])
    const total = await col.countDocuments({})
    const rows = await col.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          count: { $sum: 1 },
        } },
    ]).toArray()

    const byDay = {}
    for (const row of rows) byDay[row._id] = row.count
    return { total, byDay }
  } catch (error) {
    console.error(`[scanAnalytics] ${typeKey} query failed:`, error.message)
    return { total: 0, byDay: {} }
  }
}

/**
 * @param {number} days - 30 or 90
 * @returns {Promise<{ totals: Record<string, number>, series: Array<Record<string, number|string>> }>}
 */
export async function getScanAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const results = await Promise.all(TYPE_KEYS.map((key) => getTypeStats(key, since)))

  const totals = {}
  const byDayPerType = {}
  TYPE_KEYS.forEach((key, i) => {
    totals[key] = results[i].total
    byDayPerType[key] = results[i].byDay
  })

  const series = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().slice(0, 10)
    const entry = { date: dateStr }
    for (const key of TYPE_KEYS) entry[key] = byDayPerType[key][dateStr] || 0
    series.push(entry)
  }

  return { totals, series }
}
