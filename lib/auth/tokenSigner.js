/**
 * lib/auth/tokenSigner.js
 * Tamper-proof token signing using HMAC-SHA256 (Node built-in crypto).
 *
 * Architecture role: Identity & Access Management - cryptographic primitive.
 *
 * This is the free, dependency-less alternative to jsonwebtoken/iron-session.
 * A token is `base64url(payloadJSON).base64url(hmac)`. Any modification to the
 * payload invalidates the signature, so a client can no longer forge `plan`,
 * `role`, or `id` fields (see SECURITY_CHECKLIST C1/C3).
 *
 * Node runtime only (uses `crypto`). Never import from Edge middleware.
 */

import crypto from 'crypto'
import { env } from '@/lib/env'

/** @returns {string} the signing secret (validated for strength in lib/env.js) */
function getSecret() {
  return env.sessionSecret
}

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url')
}

/**
 * Signs an arbitrary JSON-serializable payload into a tamper-proof token.
 *
 * @param {Object} payload
 * @returns {string} signed token `payload.signature`
 */
export function signToken(payload) {
  const payloadB64 = base64url(JSON.stringify(payload))
  return `${payloadB64}.${sign(payloadB64)}`
}

/**
 * Verifies a signed token and returns its payload, or null when the token is
 * missing, malformed, has an invalid signature, or is expired (`exp` in ms).
 *
 * Uses a constant-time comparison to avoid signature timing oracles.
 *
 * @param {string|null|undefined} token
 * @returns {Object|null}
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null

  const dot = token.indexOf('.')
  if (dot <= 0) return null

  const payloadB64 = token.slice(0, dot)
  const providedSig = token.slice(dot + 1)
  if (!providedSig) return null

  const expectedSig = sign(payloadB64)

  // Constant-time compare — bail early only on length mismatch (safe to leak).
  const a = Buffer.from(providedSig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'))
  } catch {
    return null
  }

  if (payload && typeof payload.exp === 'number' && Date.now() > payload.exp) {
    return null
  }

  return payload
}
