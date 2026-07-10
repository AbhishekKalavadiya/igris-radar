/**
 * lib/branding.js
 * White-label PDF report branding - gated by the `whiteLabel` plan feature.
 * Stored on the user document's `branding` field (see BrandingConfig in
 * lib/db/schemas.js), separate from UserSettings so the logo payload doesn't
 * ride along with every notification/security preference save.
 */

import { getCollection } from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schemas'

export const DEFAULT_BRANDING = {
  companyName: '',
  logoDataUri: '',
  footerText: '',
  hideDefaultBranding: false,
}

/** @param {Object} [stored] @returns {typeof DEFAULT_BRANDING} */
export function mergeBranding(stored = {}) {
  return { ...DEFAULT_BRANDING, ...stored }
}

/**
 * @param {string} userId
 * @returns {Promise<typeof DEFAULT_BRANDING|null>}
 */
export async function getUserBranding(userId) {
  const col = await getCollection(COLLECTIONS.USERS)
  const user = await col.findOne({ id: userId }, { projection: { branding: 1 } })
  if (!user) return null
  return mergeBranding(user.branding)
}

/**
 * Resolves the branding to actually apply to a PDF export: the user's custom
 * branding only if their plan grants `whiteLabel` access - otherwise the
 * default Igris Radar identity, regardless of what they have saved (so a
 * downgraded plan can't leave stale custom branding active).
 * @param {string} userId
 * @param {boolean} hasWhiteLabelAccess
 */
export async function resolveReportBranding(userId, hasWhiteLabelAccess) {
  if (!hasWhiteLabelAccess) return { ...DEFAULT_BRANDING }
  const branding = await getUserBranding(userId)
  return branding || { ...DEFAULT_BRANDING }
}
