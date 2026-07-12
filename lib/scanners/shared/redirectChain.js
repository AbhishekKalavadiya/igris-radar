import { assertSafeUrl } from '@/lib/security/ssrf';

/**
 * Manually follows the redirect chain for a URL, counting hops.
 * Diluted SEO link equity comes from links that bounce through multiple
 * 301/302 redirects before landing on the final URL.
 *
 * Each hop is SSRF-guarded so a redirect can't be used to reach an internal
 * host (the platform-wide guard used by every fetcher).
 *
 * @param {string} url
 * @param {{ maxHops?: number, timeout?: number }} [options]
 * @returns {Promise<{ hops: number, chain: string[], finalUrl: string, finalStatus: number|null }>}
 */
export async function traceRedirects(url, { maxHops = 5, timeout = 4000 } = {}) {
  const chain = [];
  let current = url;
  let finalStatus = null;

  for (let i = 0; i < maxHops; i++) {
    let safe;
    try {
      safe = await assertSafeUrl(current);
    } catch {
      break;
    }
    chain.push(safe);

    let res;
    try {
      res = await fetch(safe, {
        method: 'HEAD',
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IgrisRadarBot/1.0)' },
        signal: AbortSignal.timeout(timeout),
      });
    } catch {
      break;
    }

    finalStatus = res.status;
    const isRedirect = res.status >= 300 && res.status < 400;
    const location = res.headers.get('location');
    if (!isRedirect || !location) break;

    try {
      current = new URL(location, safe).href;
    } catch {
      break;
    }
  }

  return {
    // hops = number of redirect responses (chain length minus the final URL)
    hops: Math.max(0, chain.length - 1),
    chain,
    finalUrl: chain[chain.length - 1] || url,
    finalStatus,
  };
}
