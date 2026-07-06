/**
 * lib/security/originCheck.js
 * CSRF defense via Origin verification (SECURITY_CHECKLIST H2).
 *
 * SameSite=Lax cookies still allow top-level cross-site POST navigations, so
 * state-changing requests need an extra check. Browsers always attach an
 * `Origin` header to cross-origin (and same-origin) fetch/XHR requests, so:
 *   - Origin present and NOT same-origin  → reject (forged cross-site request).
 *   - Origin absent                       → allow (server-to-server: Stripe
 *     webhooks, cron, API-key clients — these carry no ambient cookies and
 *     have their own auth, so they are not CSRF-exploitable).
 *
 * Pure JS — safe to run in the Edge middleware runtime (no Node APIs).
 */

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * @param {Request} request
 * @param {string} selfOrigin - request.nextUrl.origin
 * @param {string[]} [extraAllowed] - additional allowed origins (e.g. CORS list)
 * @returns {boolean} true when the request passes the CSRF origin check
 */
export function isSameOriginRequest(request, selfOrigin, extraAllowed = []) {
  if (!STATE_CHANGING.has(request.method)) return true

  const origin = request.headers.get('origin')
  if (!origin) return true // non-browser / server-to-server caller

  if (origin === selfOrigin) return true

  const allowed = extraAllowed
    .map(o => o.trim())
    .filter(Boolean)
  return allowed.includes(origin)
}
