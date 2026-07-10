/**
 * lib/security/regex.js
 * Regex safety helpers.
 *
 * User-supplied strings must never be passed raw into a `$regex` MongoDB query
 * or a `new RegExp()` - an attacker could inject regex operators (data
 * exfiltration) or a catastrophic-backtracking payload (ReDoS).
 * See SECURITY_CHECKLIST H3 / C-I2 / C-I3.
 */

/**
 * Escapes all regex metacharacters in a string so it matches literally.
 *
 * @param {string} input
 * @returns {string}
 */
export function escapeRegex(input) {
  if (typeof input !== 'string') return ''
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Builds a case-insensitive "contains" filter that is safe against injection
 * and ReDoS (the needle is escaped and length-capped).
 *
 * @param {string} needle
 * @returns {{ $regex: string, $options: string }}
 */
export function safeContainsFilter(needle) {
  const capped = String(needle ?? '').slice(0, 256)
  return { $regex: escapeRegex(capped), $options: 'i' }
}
