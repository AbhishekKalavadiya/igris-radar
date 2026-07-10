/**
 * lib/security/ssrf.js
 * Server-Side Request Forgery guard for user-supplied scan targets.
 *
 * The scanners fetch any URL a user submits. Without validation an attacker can
 * point them at internal services or the cloud metadata endpoint
 * (http://169.254.169.254) to steal credentials, or use a non-http scheme
 * (javascript:, file:) for injection. See SECURITY_CHECKLIST C-I4/C-I6.
 *
 * Node runtime only (uses dns/promises).
 */

import dns from 'dns/promises'
import net from 'net'

/** Hostnames that must never be fetched. */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
])

function isPrivateIPv4(ip) {
  const p = ip.split('.').map(Number)
  if (p.length !== 4 || p.some(n => Number.isNaN(n) || n < 0 || n > 255)) return true
  const [a, b] = p
  if (a === 10) return true                         // 10.0.0.0/8
  if (a === 127) return true                        // loopback
  if (a === 0) return true                          // 0.0.0.0/8
  if (a === 169 && b === 254) return true           // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true  // 172.16.0.0/12
  if (a === 192 && b === 168) return true           // 192.168.0.0/16
  if (a === 192 && b === 0) return true             // 192.0.0.0/24 (special)
  if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
  if (a >= 224) return true                         // multicast / reserved
  return false
}

function isPrivateIPv6(ip) {
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // unique-local
  if (lower.startsWith('fe80')) return true                          // link-local
  // IPv4-mapped (::ffff:169.254.x.x etc.)
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIPv4(mapped[1])
  return false
}

function isPrivateIP(ip) {
  return net.isIPv4(ip) ? isPrivateIPv4(ip) : isPrivateIPv6(ip)
}

function badTarget(message) {
  const err = new Error(message)
  err.status = 400
  return err
}

/**
 * Normalizes a user-supplied URL, enforces http(s), and rejects it when the
 * host resolves to a private, loopback, link-local, or metadata address.
 * Throws a 400-tagged Error on any violation.
 *
 * @param {string} rawUrl
 * @returns {Promise<string>} the validated, normalized absolute URL
 */
export async function assertSafeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') throw badTarget('A valid URL is required')

  const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`

  let parsed
  try {
    parsed = new URL(normalized)
  } catch {
    throw badTarget('Invalid URL')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw badTarget('Only http and https URLs may be scanned')
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '')
  if (!hostname) throw badTarget('Invalid URL host')
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw badTarget('Refusing to scan internal or reserved hosts')
  }

  // Literal IP in the URL - check directly without DNS.
  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) throw badTarget('Refusing to scan private or reserved IP addresses')
    return parsed.toString()
  }

  // Hostname - resolve and ensure no address points into a private range.
  let addresses = []
  try {
    addresses = await dns.lookup(hostname, { all: true })
  } catch {
    throw badTarget('Could not resolve the target host')
  }
  if (addresses.length === 0) throw badTarget('Could not resolve the target host')
  for (const { address } of addresses) {
    if (isPrivateIP(address)) throw badTarget('Refusing to scan a host that resolves to a private address')
  }

  return parsed.toString()
}

/**
 * Synchronous best-effort guard for hot paths (no DNS). Blocks non-http
 * schemes and literal private IPs / obvious internal hostnames.
 *
 * @param {string} rawUrl
 */
export function assertSafeUrlSync(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') throw badTarget('A valid URL is required')
  const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
  let parsed
  try {
    parsed = new URL(normalized)
  } catch {
    throw badTarget('Invalid URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw badTarget('Only http and https URLs may be scanned')
  }
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '')
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw badTarget('Refusing to scan internal or reserved hosts')
  }
  if (net.isIP(hostname) && isPrivateIP(hostname)) {
    throw badTarget('Refusing to scan private or reserved IP addresses')
  }
}
