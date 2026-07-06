/**
 * lib/auth/session.js
 * Session encoding/decoding utilities.
 *
 * Architecture role: Identity & Access Management - session layer.
 *
 * Implementation: HMAC-SHA256 signed tokens (see lib/auth/tokenSigner.js).
 * The payload is readable but NOT modifiable by the client — any tampering with
 * `id`, `role`, or `plan` invalidates the signature and the session is rejected
 * (SECURITY_CHECKLIST C1/C3). Tokens also carry an absolute `exp` expiry.
 *
 * The cookie is set server-side via Set-Cookie response header (HttpOnly).
 * The middleware reads it server-side via request.cookies (presence only —
 * signature verification happens here, in the Node runtime API route).
 *
 * Node runtime only. Never import from Edge middleware.
 */

import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/constants'
import { signToken, verifyToken } from '@/lib/auth/tokenSigner'

/**
 * Encodes a user object into a signed session token.
 *
 * Only include non-sensitive fields — this value is readable (but not writable)
 * by the client.
 *
 * @param {{ id: string, email: string, name: string, role?: string, plan?: string, orgId?: string }} user
 * @returns {string} signed session token
 */
export function encodeSession(user) {
  const now = Date.now()
  const payload = {
    id:    user.id,
    email: user.email,
    name:  user.name,
    role:  user.role  || 'member',
    plan:  user.plan  || 'free',
    orgId: user.orgId || null,
    iat:   now,
    exp:   now + SESSION_MAX_AGE * 1000,
  }
  return signToken(payload)
}

/**
 * Decodes and verifies a session token back to a user payload.
 * Returns null if the token is malformed, tampered, expired, or missing.
 *
 * @param {string|null|undefined} token
 * @returns {{ id: string, email: string, name: string, role: string, plan: string, orgId: string|null } | null}
 */
export function decodeSession(token) {
  return verifyToken(token)
}

/**
 * Returns a cookie string that sets the session.
 * Use this in API route responses (set-cookie header).
 *
 * @param {string} token
 * @returns {string}
 */
export function buildSessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax; HttpOnly${secure}`
}

/**
 * Returns a cookie string that clears the session.
 * Mirrors the flags of buildSessionCookie so security scanners don't flag an
 * inconsistency (SECURITY_CHECKLIST M2).
 *
 * @returns {string}
 */
export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly${secure}`
}
