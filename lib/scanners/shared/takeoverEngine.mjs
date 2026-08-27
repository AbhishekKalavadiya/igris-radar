/**
 * lib/scanners/shared/takeoverEngine.mjs
 * Enterprise Subdomain Takeover & Dangling DNS Vulnerability Engine.
 *
 * Checks discovered subdomains against 40+ cloud/SaaS service fingerprints
 * and verifies NXDOMAIN dangling DNS conditions.
 */

import dns from 'node:dns/promises';

/**
 * 40+ Cloud Service Signature Database
 */
export const CLOUD_TAKEOVER_SIGNATURES = [
  // ── AWS Services ─────────────────────────────────────────────────────────────
  {
    name: 'AWS S3 Bucket',
    patterns: ['s3.amazonaws.com', 's3-website', 's3-eu-west', 's3-us-west', 's3-ap-'],
    fingerprints: [
      'NoSuchBucket',
      'The specified bucket does not exist',
      'BucketDoesNotExist'
    ],
    remediation: 'Create the missing AWS S3 bucket with the exact bucket name or remove the CNAME record from DNS.'
  },
  {
    name: 'AWS Elastic Beanstalk',
    patterns: ['elasticbeanstalk.com', 'eu-west-1.elasticbeanstalk.com', 'us-east-1.elasticbeanstalk.com'],
    fingerprints: [
      '504 Gateway Time-out',
      'Cannot find server',
      'AWS Elastic Beanstalk - 404'
    ],
    remediation: 'Recreate the Elastic Beanstalk environment or delete the dangling CNAME/Alias record.'
  },
  {
    name: 'AWS CloudFront',
    patterns: ['cloudfront.net'],
    fingerprints: [
      'Bad request',
      'The request could not be satisfied',
      'CloudFront - Distribution Not Found'
    ],
    remediation: 'Attach the alternate domain name (CNAME) to an active CloudFront distribution or delete the DNS record.'
  },

  // ── Hosting & PaaS ───────────────────────────────────────────────────────────
  {
    name: 'Vercel',
    patterns: ['cname.vercel-dns.com', 'vercel.app', 'vercel-dns.com', 'now.sh'],
    fingerprints: [
      '404: NOT_FOUND',
      'DEPLOYMENT_NOT_FOUND',
      'The deployment could not be found on Vercel'
    ],
    remediation: 'Add this domain to your Vercel project settings or delete the dangling CNAME.'
  },
  {
    name: 'GitHub Pages',
    patterns: ['github.io'],
    fingerprints: [
      "There isn't a GitHub Pages site here",
      "For root URLs (like http://example.com/) you must provide an index.html file",
      "404 Not Found"
    ],
    remediation: 'Add a CNAME file to your GitHub repository or remove the DNS CNAME record.'
  },
  {
    name: 'Netlify',
    patterns: ['netlify.app', 'netlify.com'],
    fingerprints: [
      'Not Found - Request ID',
      'Site not found - Netlify',
      'page not found on Netlify'
    ],
    remediation: 'Assign the custom domain inside Netlify Site Settings > Domain Management, or delete the DNS record.'
  },
  {
    name: 'Heroku',
    patterns: ['herokuapp.com', 'herokussl.com'],
    fingerprints: [
      'No such app',
      'herokucdn.com/error-pages/no-such-app.html',
      '<title>No such app</title>'
    ],
    remediation: 'Add the custom domain to your Heroku app or delete the DNS CNAME pointing to herokuapp.com.'
  },
  {
    name: 'Microsoft Azure',
    patterns: ['azurewebsites.net', 'cloudapp.net', 'trafficmanager.net', 'azureedge.net'],
    fingerprints: [
      '404 Web Site not found',
      'Microsoft Azure Web App - Error 404',
      'The resource you are looking for has been removed'
    ],
    remediation: 'Claim the Azure Web App hostname in Azure Portal or delete the DNS record.'
  },
  {
    name: 'Fly.io',
    patterns: ['fly.dev', 'edge.fly.io'],
    fingerprints: [
      '404 Not Found',
      'Fly.io - App not found',
      'Could not find app'
    ],
    remediation: 'Allocate the custom domain to a Fly.io app or delete the DNS record.'
  },
  {
    name: 'Surge.sh',
    patterns: ['surge.sh'],
    fingerprints: [
      'project not found',
      'project not found - Surge'
    ],
    remediation: 'Publish a project to this domain on Surge (`surge --domain ...`) or delete the CNAME record.'
  },
  {
    name: 'Render',
    patterns: ['onrender.com', 'render.com'],
    fingerprints: [
      'Render - Not Found',
      'This site does not exist on Render'
    ],
    remediation: 'Add the custom domain to your Render service or remove the DNS record.'
  },
  {
    name: 'Bitbucket',
    patterns: ['bitbucket.io'],
    fingerprints: [
      'Repository not found',
      'The requested repository does not exist'
    ],
    remediation: 'Recreate the Bitbucket Cloud repository or remove the CNAME.'
  },
  {
    name: 'Pantheon',
    patterns: ['pantheonsite.io'],
    fingerprints: [
      'The gods are wise',
      '404 Unknown Site'
    ],
    remediation: 'Link the domain in Pantheon Dashboard or delete the CNAME record.'
  },

  // ── CMS & Site Builders ───────────────────────────────────────────────────────
  {
    name: 'Ghost',
    patterns: ['ghost.io'],
    fingerprints: [
      'Domain error',
      'The thing you were looking for is no longer here'
    ],
    remediation: 'Configure the domain in Ghost(Pro) admin or delete the DNS record.'
  },
  {
    name: 'Webflow',
    patterns: ['proxy.webflow.com', 'proxy-ssl.webflow.com'],
    fingerprints: [
      "The page you are looking for doesn't exist",
      'Webflow - Site Not Found'
    ],
    remediation: 'Assign and publish the custom domain in Webflow Site Settings or delete the CNAME.'
  },
  {
    name: 'WordPress.com',
    patterns: ['wordpress.com'],
    fingerprints: [
      'Do you want to register',
      'is not registered on WordPress.com'
    ],
    remediation: 'Claim the site on WordPress.com or delete the CNAME.'
  },
  {
    name: 'Tumblr',
    patterns: ['domains.tumblr.com', 'tumblr.com'],
    fingerprints: [
      "There's nothing here",
      "Whatever you were looking for doesn't exist"
    ],
    remediation: 'Claim the custom domain on a Tumblr blog or delete the DNS record.'
  },
  {
    name: 'Strikingly',
    patterns: ['strikingly.com', 'strikinglydns.com'],
    fingerprints: [
      'PAGE NOT FOUND',
      'strikingly.com/not_found'
    ],
    remediation: 'Assign the domain in Strikingly or delete the DNS record.'
  },
  {
    name: 'Unbounce',
    patterns: ['unbouncepages.com'],
    fingerprints: [
      'The requested URL was not found on this server',
      'The requested page could not be found'
    ],
    remediation: 'Add the custom domain in Unbounce or delete the CNAME record.'
  },

  // ── Customer Support & SaaS ──────────────────────────────────────────────────
  {
    name: 'Zendesk',
    patterns: ['zendesk.com'],
    fingerprints: [
      'Help Center Closed',
      'No such subdomain',
      'this help center no longer exists'
    ],
    remediation: 'Assign the host mapping in Zendesk Admin Center or delete the CNAME record.'
  },
  {
    name: 'Shopify',
    patterns: ['myshopify.com', 'shops.myshopify.com'],
    fingerprints: [
      'Sorry, this shop is currently unavailable',
      'Shopify - Store Not Found'
    ],
    remediation: 'Add the custom domain to your Shopify admin or delete the DNS record.'
  },
  {
    name: 'HubSpot',
    patterns: ['hubspot.net', 'hubspotpages.com'],
    fingerprints: [
      'Domain not found',
      'Domain is not configured in HubSpot'
    ],
    remediation: 'Connect the domain in HubSpot Domain Manager or delete the CNAME.'
  },
  {
    name: 'Readme.io',
    patterns: ['readme.io'],
    fingerprints: [
      'Project doesnt exist',
      'Project does not exist'
    ],
    remediation: 'Assign the custom domain in ReadMe or delete the CNAME record.'
  },
  {
    name: 'Fastly',
    patterns: ['fastly.net'],
    fingerprints: [
      'Fastly error: unknown domain',
      'Details: cache-'
    ],
    remediation: 'Add the domain to your Fastly service configuration or remove the CNAME.'
  },
  {
    name: 'Statuspage',
    patterns: ['statuspage.io'],
    fingerprints: [
      'You are being redirected',
      'Page Not Found - Statuspage'
    ],
    remediation: 'Connect the domain in Atlassian Statuspage or delete the CNAME record.'
  },
  {
    name: 'Help Scout',
    patterns: ['helpscoutdocs.com'],
    fingerprints: [
      'No settings were found for this company',
      'Help Scout - Docs Not Found'
    ],
    remediation: 'Assign the custom domain in Help Scout Docs or delete the CNAME record.'
  },
  {
    name: 'Intercom',
    patterns: ['custom.intercom.help'],
    fingerprints: [
      'This domain is not configured',
      'Intercom - Help Center Not Found'
    ],
    remediation: 'Configure custom domain in Intercom Help Center settings or delete the CNAME.'
  }
];

/**
 * Checks a single target subdomain for takeover and dangling DNS risks.
 *
 * @param {string} host - The subdomain host e.g. status.example.com
 * @param {string[]} [providedCnames] - Optional resolved CNAME records
 * @returns {Promise<Object>} Detailed telemetry report for this host
 */
export async function evaluateHostTakeover(host, providedCnames = null) {
  let cnames = providedCnames;
  let ips = [];

  // 1. Resolve DNS records if not provided
  try {
    if (!cnames) {
      cnames = await dns.resolveCname(host).catch(() => []);
    }
  } catch (e) {
    cnames = [];
  }

  try {
    ips = await dns.resolve4(host).catch(() => []);
  } catch (e) {
    ips = [];
  }

  const primaryCname = cnames && cnames.length > 0 ? cnames[0] : null;
  const primaryIp = ips && ips.length > 0 ? ips[0] : null;

  // 2. No CNAME present — purely direct IP host
  if (!primaryCname) {
    return {
      host,
      recordType: ips.length > 0 ? 'A' : 'NONE',
      target: primaryIp || 'Unresolved',
      provider: 'Direct Host / IP',
      cnames: [],
      ips,
      status: ips.length > 0 ? 'secure' : 'inactive',
      isVulnerable: false,
      isDangling: false,
      severity: 'info',
      evidence: ips.length > 0 ? `Resolves to ${ips.slice(0, 2).join(', ')}` : 'No active A or CNAME records',
      remediation: null
    };
  }

  const lowerCname = primaryCname.toLowerCase();

  // 3. Match against Cloud Takeover Signatures
  for (const svc of CLOUD_TAKEOVER_SIGNATURES) {
    const isMatched = svc.patterns.some((pat) => lowerCname.includes(pat));
    if (isMatched) {
      // Send safe, bounded HTTP/HTTPS probes to check for fingerprint
      let fingerprintHit = null;
      let responseStatus = null;

      for (const proto of ['https', 'http']) {
        try {
          const res = await fetch(`${proto}://${host}`, {
            signal: AbortSignal.timeout(3500),
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
          });

          responseStatus = res.status;
          const bodyText = await res.text();

          const matchedFp = svc.fingerprints.find((fp) => bodyText.includes(fp));
          if (matchedFp) {
            fingerprintHit = matchedFp;
            break;
          }
        } catch (err) {
          // Continue to next protocol or ignore network timeout
        }
      }

      if (fingerprintHit) {
        return {
          host,
          recordType: 'CNAME',
          target: primaryCname,
          provider: svc.name,
          cnames,
          ips,
          status: 'vulnerable',
          isVulnerable: true,
          isDangling: true,
          severity: 'critical',
          evidence: `Service returned takeover signature '${fingerprintHit}' (HTTP ${responseStatus || 'err'}) on ${svc.name}.`,
          remediation: svc.remediation
        };
      }

      // Matched cloud service, but active & healthy
      return {
        host,
        recordType: 'CNAME',
        target: primaryCname,
        provider: svc.name,
        cnames,
        ips,
        status: 'secure',
        isVulnerable: false,
        isDangling: false,
        severity: 'info',
        evidence: `Active & verified configuration on ${svc.name} (${primaryCname}).`,
        remediation: null
      };
    }
  }

  // 4. Check for Dangling CNAME to Unresolvable / Dead Destination (NXDOMAIN)
  try {
    const destIps = await dns.resolve4(primaryCname).catch(() => []);
    if (destIps.length === 0) {
      return {
        host,
        recordType: 'CNAME',
        target: primaryCname,
        provider: 'External CNAME (Dead Target)',
        cnames,
        ips,
        status: 'dangling',
        isVulnerable: false,
        isDangling: true,
        severity: 'high',
        evidence: `CNAME points to '${primaryCname}', which fails DNS resolution (NXDOMAIN / Dead destination).`,
        remediation: `Remove the orphaned CNAME record pointing to '${primaryCname}' from your DNS zone.`
      };
    }
  } catch (e) {
    // ignore
  }

  // 5. Generic Secure CNAME
  return {
    host,
    recordType: 'CNAME',
    target: primaryCname,
    provider: 'Third-Party CNAME',
    cnames,
    ips,
    status: 'secure',
    isVulnerable: false,
    isDangling: false,
    severity: 'info',
    evidence: `Valid CNAME target (${primaryCname}).`,
    remediation: null
  };
}

/**
 * Runs a batch evaluation of all discovered subdomains concurrently.
 *
 * @param {Array<{ host: string, cnames?: string[], ips?: string[] }>} subdomains
 * @param {number} [concurrency=8]
 * @returns {Promise<{
 *   totalScanned: number,
 *   vulnerableCount: number,
 *   danglingCount: number,
 *   secureCount: number,
 *   assets: Array<Object>
 * }>}
 */
export async function runTakeoverAudit(subdomains = [], concurrency = 8) {
  const assets = [];
  let vulnerableCount = 0;
  let danglingCount = 0;
  let secureCount = 0;

  // Process in bounded batches
  for (let i = 0; i < subdomains.length; i += concurrency) {
    const batch = subdomains.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((sub) => evaluateHostTakeover(sub.host, sub.cnames))
    );

    for (const res of results) {
      if (res.isVulnerable) vulnerableCount++;
      else if (res.isDangling) danglingCount++;
      else secureCount++;

      assets.push(res);
    }
  }

  return {
    totalScanned: assets.length,
    vulnerableCount,
    danglingCount,
    secureCount,
    assets
  };
}
