/**
 * lib/scanners/shared/subdomainDiscovery.mjs
 * High-performance hybrid subdomain asset discovery engine.
 *
 * Combines passive Certificate Transparency (CT) logs with concurrent
 * DNS probing for high-risk corporate and infrastructure prefixes.
 */

import dns from 'node:dns/promises';

/**
 * Top high-risk corporate & infrastructure subdomain prefixes
 */
const HIGH_RISK_PREFIXES = [
  'api', 'app', 'dev', 'staging', 'test', 'admin', 'portal', 'auth',
  'login', 'status', 'docs', 'blog', 'shop', 'store', 'mail', 'webmail',
  'vpn', 'cdn', 'static', 'assets', 'beta', 'qa', 'demo', 'support',
  'help', 'billing', 'dashboard', 'internal', 'v1', 'v2', 'gateway',
  's3', 'media', 'files', 'cloud', 'proxy', 'preview', 'hub'
];

/**
 * Discovers subdomains for a domain using CT logs and high-risk wordlist probing.
 *
 * @param {string} domain - Base domain e.g. example.com
 * @param {Object} [options]
 * @param {number} [options.maxSubdomains=50] - Maximum subdomains to return
 * @param {number} [options.timeout=5000] - CT query timeout in ms
 * @returns {Promise<Array<{ host: string, cnames: string[], ips: string[] }>>}
 */
export async function discoverSubdomains(domain, { maxSubdomains = 50, timeout = 5000 } = {}) {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
  const discoveredMap = new Map();

  // Always include www and apex
  discoveredMap.set(cleanDomain, { host: cleanDomain, cnames: [], ips: [] });
  discoveredMap.set(`www.${cleanDomain}`, { host: `www.${cleanDomain}`, cnames: [], ips: [] });

  // 1. Passive Certificate Transparency (CT) Logs Query
  try {
    const res = await fetch(`https://crt.sh/?q=%.${encodeURIComponent(cleanDomain)}&output=json`, {
      signal: AbortSignal.timeout(timeout),
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      const entries = await res.json();
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          const nameValue = entry.name_value;
          if (!nameValue) continue;

          // Split multiline certificates
          const names = nameValue.split('\n');
          for (let name of names) {
            name = name.trim().toLowerCase();
            // Strip wildcard prefix
            if (name.startsWith('*.')) name = name.substring(2);

            if (
              name.endsWith(`.${cleanDomain}`) ||
              name === cleanDomain
            ) {
              if (!discoveredMap.has(name) && discoveredMap.size < maxSubdomains * 2) {
                discoveredMap.set(name, { host: name, cnames: [], ips: [] });
              }
            }
          }
        }
      }
    }
  } catch (e) {
    // Ignore crt.sh timeout/failure and fallback to active probing
  }

  // 2. Active High-Risk Wordlist Probing (Concurrent DNS Queries)
  const probeCandidates = HIGH_RISK_PREFIXES
    .map((prefix) => `${prefix}.${cleanDomain}`)
    .filter((host) => !discoveredMap.has(host));

  const probeResults = await Promise.all(
    probeCandidates.map(async (host) => {
      try {
        const [aRecords, cnameRecords] = await Promise.all([
          dns.resolve4(host).catch(() => []),
          dns.resolveCname(host).catch(() => [])
        ]);

        if (aRecords.length > 0 || cnameRecords.length > 0) {
          return { host, cnames: cnameRecords, ips: aRecords };
        }
      } catch (e) {}
      return null;
    })
  );

  for (const hit of probeResults) {
    if (hit && !discoveredMap.has(hit.host)) {
      discoveredMap.set(hit.host, hit);
    }
  }

  // 3. Resolve DNS for CT discovered subdomains that don't have records yet
  const allDiscovered = Array.from(discoveredMap.values()).slice(0, maxSubdomains);

  const resolvedAssets = await Promise.all(
    allDiscovered.map(async (item) => {
      if (item.cnames.length > 0 || item.ips.length > 0) {
        return item;
      }

      try {
        const [aRecords, cnameRecords] = await Promise.all([
          dns.resolve4(item.host).catch(() => []),
          dns.resolveCname(item.host).catch(() => [])
        ]);

        return {
          host: item.host,
          cnames: cnameRecords,
          ips: aRecords
        };
      } catch (e) {
        return {
          host: item.host,
          cnames: [],
          ips: []
        };
      }
    })
  );

  return resolvedAssets;
}
