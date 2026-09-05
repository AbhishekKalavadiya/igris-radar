/**
 * Realistic high-fidelity sample scan result for the interactive
 * Security Topology & Tree Graph preview on the marketing landing page.
 */

export const SAMPLE_SECURITY_SCAN_RESULT = {
  id: 'sample-landing-demo',
  url: 'https://acme-cloud.io',
  score: 86,
  scannedAt: '2026-09-04T12:00:00.000Z',
  summary: {
    passed: 16,
    warning: 3,
    failed: 1,
    total: 20
  },
  categories: [
    { name: 'Transport & TLS', score: 95 },
    { name: 'HTTP Security Headers', score: 82 },
    { name: 'Cookies & CORS', score: 90 },
    { name: 'DNS & Email Trust', score: 88 },
    { name: 'Secrets & Exposure', score: 95 },
    { name: 'Dependencies & Supply Chain', score: 75 },
    { name: 'Attack Surface & Probing', score: 80 }
  ],
  findings: [
    // Transport & TLS
    {
      id: 'f-tls-1',
      category: 'Transport & TLS',
      title: 'HTTPS Enforced & HSTS Preloaded',
      severity: 'critical',
      passed: true,
      description: 'Site redirects all plaintext HTTP traffic to encrypted HTTPS and qualifies for HSTS preload.',
      recommendation: 'Maintain strict HTTPS configuration.',
      tier: 'free'
    },
    {
      id: 'f-tls-2',
      category: 'Transport & TLS',
      title: 'Modern TLS 1.3 Negotiated',
      severity: 'high',
      passed: true,
      description: 'Server negotiated TLS 1.3 with AES-GCM-256 forward-secrecy cipher suites.',
      recommendation: 'Keep legacy protocols disabled.',
      tier: 'free'
    },
    {
      id: 'f-tls-3',
      category: 'Transport & TLS',
      title: 'Valid Certificate Chain (94 Days Remaining)',
      severity: 'medium',
      passed: true,
      description: 'SSL certificate issued by Let\'s Encrypt with full intermediate chain validation.',
      recommendation: 'Auto-renewal is active.',
      tier: 'free'
    },
    {
      id: 'f-tls-4',
      category: 'Transport & TLS',
      title: 'OCSP Stapling Enabled',
      severity: 'low',
      passed: true,
      description: 'Cached OCSP response returned, avoiding external CA query latency.',
      recommendation: 'No action required.',
      tier: 'free'
    },

    // HTTP Security Headers
    {
      id: 'f-hdr-1',
      category: 'HTTP Security Headers',
      title: 'Content Security Policy (CSP)',
      severity: 'critical',
      passed: false,
      description: 'CSP header is present but contains \'unsafe-inline\' in script-src, enabling potential XSS bypass.',
      recommendation: 'Replace \'unsafe-inline\' with nonces or cryptographic hashes.',
      tier: 'free'
    },
    {
      id: 'f-hdr-2',
      category: 'HTTP Security Headers',
      title: 'X-Frame-Options: DENY',
      severity: 'high',
      passed: true,
      description: 'Page cannot be embedded in an iframe, preventing clickjacking attacks.',
      recommendation: 'Maintain header in production.',
      tier: 'free'
    },
    {
      id: 'f-hdr-3',
      category: 'HTTP Security Headers',
      title: 'X-Content-Type-Options: nosniff',
      severity: 'medium',
      passed: true,
      description: 'MIME sniffing disabled, forcing browsers to respect declared Content-Type.',
      recommendation: 'Keep nosniff configured.',
      tier: 'free'
    },
    {
      id: 'f-hdr-4',
      category: 'HTTP Security Headers',
      title: 'Permissions-Policy Configured',
      severity: 'low',
      passed: true,
      description: 'Hardware APIs (camera, microphone, geolocation) restricted by origin policy.',
      recommendation: 'Audit third-party script permissions periodically.',
      tier: 'starter'
    },

    // Cookies & CORS
    {
      id: 'f-ck-1',
      category: 'Cookies & CORS',
      title: 'Session Cookies Hardened (HttpOnly & Secure)',
      severity: 'critical',
      passed: true,
      description: 'All authentication cookies specify HttpOnly, Secure, and SameSite=Lax flags.',
      recommendation: 'Token storage conforms to OWASP standards.',
      tier: 'free'
    },
    {
      id: 'f-ck-2',
      category: 'Cookies & CORS',
      title: 'Strict CORS Whitelist Enforced',
      severity: 'high',
      passed: true,
      description: 'API does not reflect arbitrary Origin headers or use wildcard access on authenticated routes.',
      recommendation: 'Preserve strict origin check.',
      tier: 'free'
    },

    // DNS & Email Trust
    {
      id: 'f-dns-1',
      category: 'DNS & Email Trust',
      title: 'SPF Record Configured with Softfail',
      severity: 'high',
      passed: true,
      description: 'Valid SPF record detected with 3 DNS lookups (within the 10 lookup limit).',
      recommendation: 'Consider upgrading "~all" to "-all" for strict enforcement.',
      tier: 'free'
    },
    {
      id: 'f-dns-2',
      category: 'DNS & Email Trust',
      title: 'DMARC Policy: p=quarantine',
      severity: 'high',
      passed: true,
      description: 'DMARC policy instructs receiving mail servers to quarantine unauthenticated spoofed emails.',
      recommendation: 'Work toward p=reject once all legitimate sending IPs are verified.',
      tier: 'free'
    },
    {
      id: 'f-dns-3',
      category: 'DNS & Email Trust',
      title: 'DNSSEC Cryptographic Signing',
      severity: 'medium',
      passed: true,
      description: 'Domain zone is signed with DNSSEC, preventing DNS cache poisoning.',
      recommendation: 'DNSSEC keys validated via Cloudflare 1.1.1.1.',
      tier: 'starter'
    },

    // Secrets & Exposure
    {
      id: 'f-sec-1',
      category: 'Secrets & Exposure',
      title: 'No Exposed API Keys Detected',
      severity: 'critical',
      passed: true,
      description: 'HTML and JS bundles scanned for AWS, Stripe, GitHub, Slack, and private keys.',
      recommendation: 'Maintain CI/CD secret scanning.',
      tier: 'free'
    },
    {
      id: 'f-sec-2',
      category: 'Secrets & Exposure',
      title: 'Sensitive Files (.env, .git) Blocked',
      severity: 'critical',
      passed: true,
      description: 'Probed 14 common configuration paths; all returned 404 or were blocked.',
      recommendation: 'Preserve web server block rules.',
      tier: 'free'
    },
    {
      id: 'f-sec-3',
      category: 'Secrets & Exposure',
      title: 'Server Information Disclosure Stripped',
      severity: 'low',
      passed: true,
      description: 'X-Powered-By and detailed server version banners are suppressed.',
      recommendation: 'Keep banner suppression enabled.',
      tier: 'free'
    },

    // Dependencies & Supply Chain
    {
      id: 'f-dep-1',
      category: 'Dependencies & Supply Chain',
      title: '1 Vulnerable JS Library Detected (Moderate CVE)',
      severity: 'medium',
      passed: false,
      description: 'Lodash 4.17.15 contains known prototype pollution advisory (CVE-2020-8203).',
      recommendation: 'Upgrade lodash to >= 4.17.21 in package.json.',
      tier: 'starter'
    },
    {
      id: 'f-dep-2',
      category: 'Dependencies & Supply Chain',
      title: 'Subresource Integrity (SRI) Hashes',
      severity: 'medium',
      passed: true,
      description: 'All external CDN scripts specify cryptographic SHA-384 integrity hashes.',
      recommendation: 'Prevents CDN tamper attacks.',
      tier: 'starter'
    },

    // Attack Surface & Probing
    {
      id: 'f-atk-1',
      category: 'Attack Surface & Probing',
      title: 'Subdomain Radar: 18 Discovered (0 Dangling)',
      severity: 'critical',
      passed: true,
      description: 'Enumerated 18 public subdomains from Certificate Transparency logs; none point to unclaimed cloud services.',
      recommendation: 'Continuous monitoring keeps watch for future DNS drift.',
      tier: 'starter'
    },
    {
      id: 'f-atk-2',
      category: 'Attack Surface & Probing',
      title: 'Open Redirect & Query Parameter Probe',
      severity: 'medium',
      passed: true,
      description: 'Common redirect parameters (?next=, ?return=, ?redirect=) properly reject external URLs.',
      recommendation: 'Validate all redirect destinations against an internal allowlist.',
      tier: 'starter'
    }
  ]
};
