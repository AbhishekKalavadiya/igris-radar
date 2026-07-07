/**
 * Layered Rate Limiting Store
 *
 * Backed by an in-memory Map. NOTE (SECURITY_CHECKLIST H1): this resets on
 * restart and is per-instance, so in a multi-instance deployment (Vercel, k8s)
 * an attacker can spread requests across instances. For production, back this
 * with Redis (e.g. @upstash/ratelimit or ioredis) using the same interface.
 * Entries are now evicted after their window expires to prevent memory growth.
 */
const rateLimitStore = new Map();

// Configuration
const GLOBAL_LIMIT = 500;     // max requests per window (raised - 100 was too low for dev + prefetching)
const GLOBAL_WINDOW = 60000;  // 1 minute
const API_KEY_LIMIT = 2000;   // max requests for API key holders
const API_KEY_WINDOW = 60000; // 1 minute
const CONTACT_LIMIT = 3;      // public contact form: max messages per IP per window
const CONTACT_WINDOW = 600000; // 10 minutes
const RESET_LIMIT = 5;        // password reset requests: max per IP per window
const RESET_WINDOW = 600000;  // 10 minutes

// Lazy eviction bookkeeping — sweep stale entries occasionally rather than on
// every call to keep the hot path cheap.
let lastSweep = Date.now();
const SWEEP_INTERVAL = 60000;

function sweep(now) {
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [key, rec] of rateLimitStore) {
    if (now - rec.firstRequestTime > Math.max(GLOBAL_WINDOW, API_KEY_WINDOW)) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Checks and updates rate limits for a given identifier (IP or API Key).
 * @param {string} identifier - The IP address or API key hash
 * @param {string} type - 'global' | 'key' | 'contact' | 'reset'
 * @returns {boolean} True if the request should be blocked
 */
export function isRateLimited(identifier, type = 'global') {
  const limit = type === 'key' ? API_KEY_LIMIT : type === 'contact' ? CONTACT_LIMIT : type === 'reset' ? RESET_LIMIT : GLOBAL_LIMIT;
  const windowMs = type === 'key' ? API_KEY_WINDOW : type === 'contact' ? CONTACT_WINDOW : type === 'reset' ? RESET_WINDOW : GLOBAL_WINDOW;
  const now = Date.now();

  sweep(now);

  const record = rateLimitStore.get(identifier) || { count: 0, firstRequestTime: now };

  if (now - record.firstRequestTime > windowMs) {
    record.count = 1;
    record.firstRequestTime = now;
  } else {
    record.count += 1;
  }

  rateLimitStore.set(identifier, record);

  return record.count > limit;
}
