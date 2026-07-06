/**
 * lib/security/loginThrottle.js
 * Per-account brute-force protection for the login endpoint
 * (SECURITY_CHECKLIST M1 / A1).
 *
 * The global IP rate limit (in lib/rateLimit.js) is far too high to stop a
 * targeted password-guessing attack against one account. This tracks failed
 * attempts per (email + ip) key and locks the pair out after a threshold.
 *
 * Limitation (same as lib/rateLimit.js): the store is in-memory, so it resets
 * on restart and is per-instance. For multi-instance production, back this with
 * Redis. Entries are lazily evicted to prevent unbounded memory growth.
 */

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes
const WINDOW_MS = 15 * 60 * 1000  // attempts older than this don't count

const attempts = new Map() // key -> { count, firstAt, lockedUntil }

function keyFor(email, ip) {
  return `${String(email || '').toLowerCase()}|${ip || 'unknown'}`
}

function evictExpired(now) {
  for (const [k, v] of attempts) {
    const stale = now - v.firstAt > WINDOW_MS
    const unlocked = !v.lockedUntil || now > v.lockedUntil
    if (stale && unlocked) attempts.delete(k)
  }
}

/**
 * Returns lockout state for an (email, ip) pair. Call before verifying the
 * password.
 *
 * @param {string} email
 * @param {string} ip
 * @returns {{ locked: boolean, retryAfterSeconds: number }}
 */
export function checkLoginAllowed(email, ip) {
  const now = Date.now()
  const rec = attempts.get(keyFor(email, ip))
  if (rec?.lockedUntil && now < rec.lockedUntil) {
    return { locked: true, retryAfterSeconds: Math.ceil((rec.lockedUntil - now) / 1000) }
  }
  return { locked: false, retryAfterSeconds: 0 }
}

/**
 * Records a failed login attempt and locks the pair once the threshold is hit.
 *
 * @param {string} email
 * @param {string} ip
 */
export function recordFailedLogin(email, ip) {
  const now = Date.now()
  if (attempts.size > 10000) evictExpired(now) // cap memory
  const key = keyFor(email, ip)
  const rec = attempts.get(key)

  if (!rec || now - rec.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now, lockedUntil: 0 })
    return
  }

  rec.count += 1
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = now + LOCKOUT_MS
  }
  attempts.set(key, rec)
}

/**
 * Clears the failed-attempt record after a successful login.
 *
 * @param {string} email
 * @param {string} ip
 */
export function recordSuccessfulLogin(email, ip) {
  attempts.delete(keyFor(email, ip))
}
