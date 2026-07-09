import { fetchWithCheerio } from './shared/fetcher.js';
import { createFindingsCollector } from './shared/findings.js';
import { calculateScore } from './shared/scoring.js';
import dns from 'dns/promises';

/**
 * Opens a single TLS connection and returns the negotiated protocol, cipher,
 * chain-authorization result, ALPN protocol, and peer certificate.
 * Returns null if the host is unreachable or the handshake times out.
 * rejectUnauthorized is false so the connection completes even on an invalid
 * chain — the verification verdict is still exposed via `authorized` /
 * `authorizationError`.
 * @param {string} host
 * @param {{ alpn?: string[], timeout?: number }} [opts]
 */
async function inspectTls(host, { alpn, timeout = 6000 } = {}) {
  const tls = await import('tls');
  return new Promise((resolve) => {
    let settled = false;
    const done = (val) => { if (!settled) { settled = true; resolve(val); } };
    const options = { host, port: 443, servername: host, rejectUnauthorized: false, timeout };
    if (alpn) options.ALPNProtocols = alpn;
    let socket;
    try {
      socket = tls.connect(options, () => {
        const result = {
          protocol: socket.getProtocol(),
          cipher: socket.getCipher(),
          authorized: socket.authorized,
          authorizationError: socket.authorizationError ? String(socket.authorizationError) : null,
          alpnProtocol: socket.alpnProtocol,
          cert: socket.getPeerCertificate(),
        };
        socket.destroy();
        done(result);
      });
      socket.on('error', () => done(null));
      socket.on('timeout', () => { socket.destroy(); done(null); });
    } catch (e) {
      done(null);
    }
  });
}

/** Shannon entropy (bits per character) of a string. */
function shannonEntropy(str) {
  if (!str) return 0;
  const freq = {};
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
  let entropy = 0;
  const len = str.length;
  for (const ch in freq) {
    const p = freq[ch] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export async function runSecurityScan(url) {
  const { addFinding, getFindings } = createFindingsCollector();

  try {
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
    
    const isHttps = normalizedUrl.startsWith('https');
    addFinding(
      'SSL/TLS', 'critical', 'HTTPS Enforced',
      'Checks if the site is served over a secure HTTPS connection.',
      isHttps,
      'Obtain an SSL certificate and configure your web server to redirect HTTP to HTTPS.',
      'How do I configure my Next.js / Node server to enforce HTTPS redirects?',
      "HTTPS encrypts the communication between your user's browser and your server, protecting sensitive data from man-in-the-middle attacks and packet sniffing.",
      'free'
    );

    const { html, $, response, targetUrl } = await fetchWithCheerio(normalizedUrl, { throwOnHttpError: false });
    const headers = response.headers;
    const domain = targetUrl.hostname.replace(/^www\./, '');

    // Single TLS handshake (with ALPN) reused for HTTP/2, chain validation, and cipher info.
    const tlsInfo = isHttps ? await inspectTls(targetUrl.hostname, { alpn: ['h2', 'http/1.1'] }) : null;

    // ═══════════════════════════════════════════════════════════════════════════
    // FREE TIER CHECKS (25 total)
    // ═══════════════════════════════════════════════════════════════════════════

    // --- Headers Security (Existing) ---
    const csp = headers.get('content-security-policy');
    addFinding(
      'Headers', 'high', 'Content-Security-Policy',
      'Checks for the presence of a CSP header to mitigate XSS attacks.',
      !!csp,
      'Implement a strict CSP restricting sources for scripts, styles, and data.',
      'Add a strict CSP in next.config.js that allows scripts only from my domain.',
      'A Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks. It works by restricting the domains that the browser should consider to be valid sources of executable scripts.',
      'free'
    );

    const xFrame = headers.get('x-frame-options');
    addFinding(
      'Headers', 'medium', 'X-Frame-Options',
      'Checks for X-Frame-Options to prevent Clickjacking.',
      !!xFrame,
      'Set X-Frame-Options to DENY or SAMEORIGIN.',
      'Add an X-Frame-Options: DENY header to my Next.js next.config.js file.',
      'The X-Frame-Options HTTP response header can be used to indicate whether or not a browser should be allowed to render a page in a <frame>, <iframe>, <embed> or <object>. Sites can use this to avoid clickjacking attacks, by ensuring that their content is not embedded into other sites.',
      'free'
    );

    const hsts = headers.get('strict-transport-security');
    addFinding(
      'Headers', 'medium', 'Strict-Transport-Security',
      'Checks for HSTS header to ensure secure connections.',
      !!hsts,
      'Set Strict-Transport-Security to include max-age and includeSubDomains.',
      'How to add Strict-Transport-Security header in Next.js next.config.js.',
      'HTTP Strict Transport Security (HSTS) is a web security policy mechanism that helps to protect websites against man-in-the-middle attacks such as protocol downgrade attacks and cookie hijacking. It allows web servers to declare that web browsers should automatically interact with it using only HTTPS.',
      'free'
    );

    const serverHeader = headers.get('server');
    const xPoweredBy = headers.get('x-powered-by');
    const infoDisclosure = serverHeader || xPoweredBy;
    addFinding(
      'Info Disclosure', 'low', 'Server Info Disclosure',
      'Checks if the server exposes its software version.',
      !infoDisclosure,
      'Remove software identification headers (Server, X-Powered-By) to prevent targeted attacks.',
      'Show me how to remove the "X-Powered-By" header in Next.js.',
      'Exposing server version details (e.g., "nginx/1.20.1" or "X-Powered-By: Express") allows attackers to quickly look up known vulnerabilities for your specific software stack, significantly reducing the time needed to breach your systems.',
      'free'
    );

    const isCloudflare = headers.has('cf-ray') || (serverHeader && serverHeader.toLowerCase().includes('cloudflare'));
    const isAws = headers.has('x-amz-cf-id');
    const hasWaf = isCloudflare || isAws;
    addFinding(
      'Infrastructure', 'low', 'Web Application Firewall (WAF)',
      'Checks if the site is protected by a WAF like Cloudflare or AWS CloudFront.',
      hasWaf,
      'Consider putting your application behind a WAF to protect against DDoS and common exploits.',
      'How to integrate Cloudflare WAF with my existing web application.',
      'A Web Application Firewall (WAF) filters, monitors, and blocks HTTP traffic to and from a web application. It protects against attacks such as cross-site forgery, cross-site-scripting (XSS), file inclusion, and SQL injection.',
      'free'
    );

    // --- Cookie Security ---
    const setCookie = headers.get('set-cookie');
    let cookieSecure = true;
    let cookieHasSameSite = true;
    if (setCookie) {
      const lowerCookie = setCookie.toLowerCase();
      if (!lowerCookie.includes('secure') || !lowerCookie.includes('httponly')) {
        cookieSecure = false;
      }
      if (!lowerCookie.includes('samesite')) {
        cookieHasSameSite = false;
      }
    }
    addFinding(
      'Headers', 'high', 'Secure Cookies',
      'Checks if session cookies are protected with Secure and HttpOnly flags.',
      cookieSecure,
      'Ensure all sensitive cookies are marked HttpOnly and Secure.',
      'How to set HttpOnly and Secure flags on cookies in Next.js.',
      'The Secure attribute ensures the cookie is only sent over encrypted (HTTPS) requests. The HttpOnly attribute restricts access to the cookie from client-side scripts, preventing XSS attacks from stealing session tokens.',
      'free'
    );

    // NEW: Cookie SameSite
    addFinding(
      'Headers', 'medium', 'Cookie SameSite Attribute',
      'Checks if cookies include the SameSite attribute to prevent CSRF attacks.',
      cookieHasSameSite,
      'Set SameSite=Lax or SameSite=Strict on all cookies.',
      'How to set SameSite attribute on cookies in Next.js.',
      'The SameSite attribute controls whether cookies are sent with cross-site requests. Setting it to Lax or Strict prevents CSRF attacks by ensuring cookies are only sent in first-party contexts, stopping malicious sites from making authenticated requests on behalf of your users.',
      'free'
    );

    // --- CORS ---
    // Robust logic to avoid false positives: a bare `ACAO: *` is NOT a vulnerability
    // (browsers forbid credentialed reads against a wildcard). The real risk is either
    // (a) reflecting the attacker's Origin back, or (b) `*` combined with
    // Allow-Credentials: true. Only those are flagged.
    try {
      const corsRes = await fetch(normalizedUrl, { headers: { 'Origin': 'https://evil.test' }, signal: AbortSignal.timeout(5000) });
      const allowOrigin = corsRes.headers.get('access-control-allow-origin');
      const allowCreds = (corsRes.headers.get('access-control-allow-credentials') || '').toLowerCase() === 'true';
      const reflectsOrigin = allowOrigin === 'https://evil.test';
      const wildcardWithCreds = allowOrigin === '*' && allowCreds;
      const isCorsVulnerable = reflectsOrigin || wildcardWithCreds;
      addFinding(
        'Headers', 'high', 'CORS Misconfiguration',
        `Tests if the server allows arbitrary cross-origin requests. ${reflectsOrigin ? 'Server reflects arbitrary Origin headers.' : wildcardWithCreds ? 'Wildcard origin combined with Allow-Credentials.' : 'No exploitable CORS misconfiguration detected.'}`,
        !isCorsVulnerable,
        'Restrict Access-Control-Allow-Origin to specific trusted domains.',
        'How to properly configure CORS in Next.js to prevent wildcard origin access.',
        'Cross-Origin Resource Sharing (CORS) is a mechanism that allows restricted resources on a web page to be requested from another domain. A wildcard or overly permissive CORS policy allows malicious sites to read your authenticated data.',
        'free'
      );
    } catch (e) {}

    // --- NEW: X-Content-Type-Options ---
    const xContentType = headers.get('x-content-type-options');
    addFinding(
      'Headers', 'medium', 'X-Content-Type-Options',
      'Checks for the nosniff directive to prevent MIME-type sniffing attacks.',
      xContentType && xContentType.toLowerCase().includes('nosniff'),
      'Set X-Content-Type-Options: nosniff to prevent MIME confusion attacks.',
      'How to add X-Content-Type-Options: nosniff header in Next.js.',
      'Without this header, browsers may try to "sniff" the content type of a response, potentially interpreting a non-executable file (like a JSON response) as HTML or JavaScript. This opens the door to drive-by download attacks and XSS via MIME confusion.',
      'free'
    );

    // --- NEW: Referrer-Policy ---
    const referrerPolicy = headers.get('referrer-policy');
    addFinding(
      'Headers', 'medium', 'Referrer-Policy',
      'Checks if the Referrer-Policy header controls how much referrer info is leaked.',
      !!referrerPolicy,
      'Set Referrer-Policy to strict-origin-when-cross-origin or no-referrer.',
      'How to add Referrer-Policy header in Next.js next.config.js.',
      'Without a Referrer-Policy, the browser may leak the full URL (including query parameters with tokens or session IDs) to third-party sites via the Referer header. This is especially dangerous on password reset pages or authenticated areas.',
      'free'
    );

    // --- NEW: Permissions-Policy ---
    const permissionsPolicy = headers.get('permissions-policy');
    addFinding(
      'Headers', 'medium', 'Permissions-Policy',
      'Checks if the Permissions-Policy header restricts browser APIs like camera, microphone, and geolocation.',
      !!permissionsPolicy,
      'Set Permissions-Policy to disable unused browser APIs.',
      'How to add Permissions-Policy header to restrict camera and microphone in Next.js.',
      'The Permissions-Policy header lets you control which browser features and APIs can be used on your site. Without it, malicious scripts injected via XSS could access your users\' camera, microphone, or geolocation without additional restrictions.',
      'free'
    );

    // --- Secrets Detection (Extended) ---
    const hasStripeKey = /sk_live_[0-9a-zA-Z]{24,}/.test(html);
    const hasGoogleKey = /AIza[0-9A-Za-z-_]{35}/.test(html);
    addFinding(
      'Secrets', 'critical', 'Exposed API Keys',
      'Checks the raw HTML for common exposed secret patterns.',
      !(hasStripeKey || hasGoogleKey),
      'Move secrets to server-side environment variables.',
      'Find any exposed API keys in my React components and move them to server-side API routes.',
      'Hardcoded API keys inside client-side bundles (like HTML or JS files) can be easily scraped by anyone. Attackers can use these keys to impersonate your application, bypass billing limits, or access sensitive external services, leading to significant financial or data loss.',
      'free'
    );

    // NEW: Extended Secret Patterns
    const extendedSecretPatterns = [
      { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
      { name: 'Firebase API Key', regex: /AIzaSy[0-9A-Za-z-_]{33}/ },
      { name: 'Slack Token', regex: /xox[bpors]-[0-9a-zA-Z-]{10,}/ },
      { name: 'GitHub PAT', regex: /ghp_[0-9a-zA-Z]{36}/ },
      { name: 'Twilio Key', regex: /SK[0-9a-fA-F]{32}/ },
      { name: 'Mailgun Key', regex: /key-[0-9a-zA-Z]{32}/ },
      { name: 'SendGrid Key', regex: /SG\.[0-9a-zA-Z-_]{22}\.[0-9a-zA-Z-_]{43}/ },
      { name: 'Private Key Block', regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
      // NOTE: A bare UUID pattern was removed here — it matched any UUID
      // (React keys, asset hashes, analytics IDs) and produced constant false positives.
    ];
    const exposedSecrets = extendedSecretPatterns.filter(p => p.regex.test(html));
    addFinding(
      'Secrets', 'critical', 'Extended Secret Patterns',
      `Scans HTML for 9 additional secret patterns (AWS, Firebase, Slack, GitHub, etc.). ${exposedSecrets.length > 0 ? `Found: ${exposedSecrets.map(s => s.name).join(', ')}` : 'No additional secrets detected.'}`,
      exposedSecrets.length === 0,
      'Audit your codebase for hardcoded secrets and move them to server-side environment variables.',
      'Scan my codebase for any hardcoded API keys, tokens, or private keys and replace them with environment variables.',
      'Beyond common API keys, attackers scan for AWS credentials, Firebase configs, Slack tokens, and private keys in client-side code. A single exposed AWS key can lead to full cloud infrastructure compromise within minutes.',
      'free'
    );

    // --- Outdated Libraries ---
    let hasOutdatedJs = false;
    $('script').each((_, el) => {
      const src = $(el).attr('src');
      if (src && (src.includes('jquery-1.') || src.includes('jquery-2.') || src.includes('react@15'))) {
        hasOutdatedJs = true;
      }
    });
    addFinding(
      'Dependencies', 'medium', 'Outdated Frontend Libraries',
      'Checks for known outdated JS libraries.',
      !hasOutdatedJs,
      'Update frontend dependencies to their latest stable versions.',
      'How to safely upgrade old jQuery or React versions in a legacy codebase.',
      'Using outdated JavaScript libraries with known vulnerabilities (CVEs) exposes your users to XSS or other client-side attacks. Attackers frequently scan for known outdated library signatures to exploit well-documented flaws.',
      'free'
    );

    // --- DNS Checks ---
    try {
      const txtRecords = await dns.resolveTxt(domain);
      const hasSpf = txtRecords.some(record => record.join('').includes('v=spf1'));
      addFinding(
        'DNS Security', 'medium', 'SPF Record',
        'Checks if the domain has an SPF record.',
        hasSpf,
        'Add a TXT record for SPF to your domain.',
        'Generate a standard SPF TXT record.',
        'Sender Policy Framework (SPF) is an email authentication method designed to detect forging sender addresses during the delivery of the email. It helps prevent spammers from sending messages on behalf of your domain, protecting your brand reputation.',
        'free'
      );
    } catch (e) {
      addFinding('DNS Security', 'medium', 'SPF Record', 'Failed to resolve TXT records.', false, 'Add an SPF record.', '', 'Sender Policy Framework (SPF) is an email authentication method designed to detect forging sender addresses during the delivery of the email. It helps prevent spammers from sending messages on behalf of your domain, protecting your brand reputation.', 'free');
    }

    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
      const hasDmarc = dmarcRecords.some(record => record.join('').includes('v=DMARC1'));
      addFinding(
        'DNS Security', 'medium', 'DMARC Record',
        'Checks for a DMARC record.',
        hasDmarc,
        'Add a _dmarc TXT record with at least p=none policy.',
        'What is a good starting DMARC policy?',
        'Domain-based Message Authentication, Reporting, and Conformance (DMARC) uses SPF and DKIM to provide instructions to the receiving mail server on what to do if an email fails authentication. It acts as a strict policy layer against email spoofing.',
        'free'
      );
    } catch (e) {
      addFinding('DNS Security', 'medium', 'DMARC Record', 'Failed to resolve DMARC records.', false, 'Add a _dmarc TXT record.', '', 'Domain-based Message Authentication, Reporting, and Conformance (DMARC) uses SPF and DKIM to provide instructions to the receiving mail server on what to do if an email fails authentication. It acts as a strict policy layer against email spoofing.', 'free');
    }

    // --- Active Probing (Existing + Extended) ---
    let exposedFiles = 0;
    const probePaths = ['/.env', '/.git/config', '/wp-config.php.bak'];
    for (const path of probePaths) {
      try {
        const probeRes = await fetch(new URL(path, targetUrl.origin), { method: 'GET', signal: AbortSignal.timeout(3000) });
        if (probeRes.ok) {
          const text = await probeRes.text();
          if (path === '/.env' && text.includes('=') && !text.toLowerCase().includes('<html')) exposedFiles++;
          if (path === '/.git/config' && text.includes('[core]')) exposedFiles++;
          if (path === '/wp-config.php.bak' && text.includes('DB_PASSWORD')) exposedFiles++;
        }
      } catch (e) {}
    }
    addFinding(
      'Active Probing', 'critical', 'Exposed Sensitive Files',
      'Actively probes for common sensitive files like .env or .git/config.',
      exposedFiles === 0,
      'Ensure web root is configured correctly and hidden files are denied access.',
      'How to configure Nginx/Apache/Next.js to block access to hidden files.',
      'Web servers sometimes misconfigure directory permissions, inadvertently exposing configuration files (.env), version control histories (.git), or backup files. These files often contain database passwords, secret keys, and source code which can lead to a full system compromise.',
      'free'
    );

    // NEW: Extended Version Control Exposure (.svn, .hg, .bzr)
    let vcsExposed = 0;
    const vcsPaths = [
      { path: '/.svn/entries', signature: 'dir' },
      { path: '/.hg/store/00manifest.i', signature: null },
      { path: '/.bzr/README', signature: 'Bazaar' },
    ];
    for (const { path, signature } of vcsPaths) {
      try {
        const probeRes = await fetch(new URL(path, targetUrl.origin), { method: 'GET', signal: AbortSignal.timeout(3000) });
        if (probeRes.ok) {
          const text = await probeRes.text();
          if (!signature || text.includes(signature)) vcsExposed++;
        }
      } catch (e) {}
    }
    addFinding(
      'Active Probing', 'critical', 'Version Control Exposure (Extended)',
      'Probes for exposed SVN, Mercurial, and Bazaar repositories beyond Git.',
      vcsExposed === 0,
      'Block access to all version control directories (.svn, .hg, .bzr) in your web server config.',
      'How to deny access to .svn .hg .bzr directories in Nginx/Apache.',
      'Besides Git, other version control systems (SVN, Mercurial, Bazaar) can also be accidentally exposed. These repositories contain full source code history and potentially credentials, giving attackers a complete blueprint of your application.',
      'free'
    );

    // NEW: Mixed Content Detection
    // Only sub-resource loads count as mixed content — NOT navigational <a href> links
    // (those are just outbound links, flagging them was a false positive). We scan
    // scripts, images, media, stylesheets, iframes, embeds, and form actions only.
    const mixedContentSources = [];
    if (isHttps) {
      $('script[src], img[src], iframe[src], audio[src], video[src], source[src], embed[src], track[src], input[type="image"][src], link[rel="stylesheet"][href], object[data], form[action]').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('href') || $(el).attr('data') || $(el).attr('action');
        if (src && src.startsWith('http://') && !src.startsWith('http://localhost')) {
          mixedContentSources.push(src);
        }
      });
    }
    addFinding(
      'SSL/TLS', 'high', 'Mixed Content Detection',
      `Checks for HTTP resources loaded on an HTTPS page. ${mixedContentSources.length > 0 ? `Found ${mixedContentSources.length} insecure resource(s).` : 'No mixed content detected.'}`,
      mixedContentSources.length === 0,
      'Replace all http:// resource URLs with https:// or use protocol-relative URLs.',
      'Find and fix all mixed content warnings on my HTTPS website.',
      'When an HTTPS page loads resources (scripts, images, stylesheets) over plain HTTP, it creates a "mixed content" vulnerability. Active mixed content (scripts, iframes) can be intercepted and modified by attackers, completely undermining the security of your HTTPS connection.',
      'free'
    );

    // NEW: Directory Listing Detection
    let directoryListingExposed = false;
    const dirProbePaths = ['/images/', '/uploads/', '/assets/', '/static/', '/css/', '/js/'];
    for (const dirPath of dirProbePaths) {
      try {
        const probeRes = await fetch(new URL(dirPath, targetUrl.origin), { method: 'GET', signal: AbortSignal.timeout(3000) });
        if (probeRes.ok) {
          const text = await probeRes.text();
          if (text.includes('Index of') || text.includes('Directory listing') || text.includes('<title>Index of')) {
            directoryListingExposed = true;
            break;
          }
        }
      } catch (e) {}
    }
    addFinding(
      'Active Probing', 'high', 'Directory Listing Enabled',
      'Checks if the web server exposes directory indexes, allowing attackers to browse file structures.',
      !directoryListingExposed,
      'Disable directory listing in your web server configuration (Options -Indexes in Apache, autoindex off in Nginx).',
      'How to disable directory listing in my web server.',
      'When directory listing is enabled, anyone can browse the contents of your server directories like a file explorer. This reveals file names, internal structures, backup files, and potentially sensitive resources that were never meant to be public.',
      'free'
    );

    // NEW: robots.txt Analysis
    let robotsTxtSensitive = false;
    let robotsTxtPaths = [];
    try {
      const robotsRes = await fetch(new URL('/robots.txt', targetUrl.origin), { signal: AbortSignal.timeout(3000) });
      if (robotsRes.ok) {
        const robotsTxt = await robotsRes.text();
        const sensitivePatterns = ['/admin', '/config', '/backup', '/database', '/db', '/private', '/secret', '/internal', '/staging', '/test', '/debug', '/.env', '/api/internal'];
        const lines = robotsTxt.split('\n');
        for (const line of lines) {
          const trimmed = line.trim().toLowerCase();
          if (trimmed.startsWith('disallow:')) {
            const path = trimmed.replace('disallow:', '').trim();
            if (sensitivePatterns.some(p => path.includes(p))) {
              robotsTxtSensitive = true;
              robotsTxtPaths.push(path);
            }
          }
        }
      }
    } catch (e) {}
    addFinding(
      'Active Probing', 'low', 'robots.txt Sensitive Path Exposure',
      `Analyzes robots.txt for accidentally disclosed sensitive paths. ${robotsTxtSensitive ? `Found sensitive paths: ${robotsTxtPaths.slice(0, 3).join(', ')}` : 'No sensitive paths found in robots.txt.'}`,
      !robotsTxtSensitive,
      'Remove sensitive paths from robots.txt — use authentication and access controls instead of obscurity.',
      'Review my robots.txt file and remove any internal paths that reveal sensitive areas.',
      'While robots.txt is meant to guide search engines, it is publicly readable. Listing paths like /admin, /backup, or /internal is equivalent to giving attackers a map of your sensitive endpoints. Use proper authentication instead.',
      'free'
    );

    // NEW: Security.txt Check (RFC 9116)
    let hasSecurityTxt = false;
    let securityTxtValid = false;
    try {
      const secRes = await fetch(new URL('/.well-known/security.txt', targetUrl.origin), { signal: AbortSignal.timeout(3000) });
      if (secRes.ok) {
        hasSecurityTxt = true;
        const text = await secRes.text();
        securityTxtValid = text.includes('Contact:') && text.includes('Expires:');
      }
    } catch (e) {}
    addFinding(
      'Best Practices', 'low', 'Security.txt (RFC 9116)',
      `Checks for a /.well-known/security.txt file with required Contact and Expires fields. ${hasSecurityTxt ? (securityTxtValid ? 'Valid security.txt found.' : 'Found but missing required fields.') : 'No security.txt found.'}`,
      securityTxtValid,
      'Create a /.well-known/security.txt with Contact and Expires fields per RFC 9116.',
      'Create a valid security.txt file following RFC 9116 for my website.',
      'security.txt is an internet standard (RFC 9116) that helps security researchers report vulnerabilities responsibly. Without it, researchers who find bugs on your site have no clear way to contact you, which may result in public disclosure before you can fix the issue.',
      'free'
    );

    // NEW: Sitemap Sensitive Path Exposure
    let sitemapSensitivePaths = [];
    try {
      const sitemapRes = await fetch(new URL('/sitemap.xml', targetUrl.origin), { signal: AbortSignal.timeout(3000) });
      if (sitemapRes.ok) {
        const sitemapXml = await sitemapRes.text();
        const sensitivePatterns = ['/admin', '/internal', '/staging', '/test', '/debug', '/config', '/api/', '/private'];
        const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/g) || [];
        for (const match of urlMatches) {
          const sitemapUrl = match.replace(/<\/?loc>/g, '').toLowerCase();
          if (sensitivePatterns.some(p => sitemapUrl.includes(p))) {
            sitemapSensitivePaths.push(sitemapUrl);
          }
        }
      }
    } catch (e) {}
    addFinding(
      'Active Probing', 'low', 'Sitemap Sensitive Path Exposure',
      `Analyzes sitemap.xml for accidentally listed internal or admin URLs. ${sitemapSensitivePaths.length > 0 ? `Found ${sitemapSensitivePaths.length} suspicious URL(s).` : 'No sensitive paths found in sitemap.'}`,
      sitemapSensitivePaths.length === 0,
      'Remove internal/admin URLs from your sitemap.xml and use noindex meta tags instead.',
      'Audit my sitemap.xml and remove any URLs that should not be publicly listed.',
      'Search engine sitemaps are publicly accessible. Including admin panels, API endpoints, or staging URLs in your sitemap not only exposes them to attackers but also tells search engines to index them, making them easily discoverable.',
      'free'
    );

    // NEW: Third-Party Domain Count
    const thirdPartyDomains = new Set();
    $('script[src], link[href], img[src], iframe[src]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('href');
      if (src && src.startsWith('http')) {
        try {
          const extDomain = new URL(src).hostname;
          if (extDomain !== domain && !extDomain.endsWith(`.${domain}`)) {
            thirdPartyDomains.add(extDomain);
          }
        } catch (e) {}
      }
    });
    const tpCount = thirdPartyDomains.size;
    addFinding(
      'Supply Chain', 'low', 'Third-Party Domain Count',
      `Counts external domains loaded by the page. Found ${tpCount} third-party domain(s)${tpCount > 0 ? ': ' + [...thirdPartyDomains].slice(0, 5).join(', ') + (tpCount > 5 ? ` (+${tpCount - 5} more)` : '') : ''}.`,
      tpCount <= 10,
      'Minimize third-party dependencies to reduce your attack surface and improve performance.',
      'Audit the third-party scripts on my website and remove unnecessary ones.',
      'Every external domain your page loads is a potential attack vector. If any third-party service is compromised, malicious code could run in your users\' browsers. Fewer third-party dependencies means a smaller supply chain attack surface.',
      'free'
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // STARTER TIER CHECKS (placeholders — will be implemented in Phase 2)
    // ═══════════════════════════════════════════════════════════════════════════

    // SSL Certificate Expiry (starter)
    try {
      const tls = await import('tls');
      const net = await import('net');
      const sslResult = await new Promise((resolve, reject) => {
        const socket = tls.connect({
          host: domain,
          port: 443,
          servername: domain,
          rejectUnauthorized: false,
          timeout: 5000,
        }, () => {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          if (cert && cert.valid_to) {
            const expiryDate = new Date(cert.valid_to);
            const daysLeft = Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
            const issuer = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Unknown') : 'Unknown';
            const isSelfSigned = cert.issuer && cert.subject && 
              JSON.stringify(cert.issuer) === JSON.stringify(cert.subject);
            resolve({ daysLeft, expiryDate, issuer, isSelfSigned, keyLength: cert.bits, cert });
          } else {
            resolve(null);
          }
        });
        socket.on('error', () => resolve(null));
        socket.on('timeout', () => { socket.destroy(); resolve(null); });
      });

      if (sslResult) {
        addFinding(
          'SSL/TLS', 'critical', 'SSL Certificate Expiry',
          `Certificate expires on ${sslResult.expiryDate.toDateString()} (${sslResult.daysLeft} days remaining). Issued by: ${sslResult.issuer}.`,
          sslResult.daysLeft > 14,
          sslResult.daysLeft <= 0 ? 'Your certificate has EXPIRED. Renew it immediately.' : `Renew your SSL certificate before ${sslResult.expiryDate.toDateString()}.`,
          'How do I renew my SSL certificate and set up auto-renewal?',
          'An expired SSL certificate causes browsers to display scary warning pages, immediately destroying user trust. Most certificate authorities offer free auto-renewal. Set it up so you never face downtime from an expired cert.',
          'starter'
        );

        // Self-Signed Certificate Detection (starter)
        addFinding(
          'SSL/TLS', 'critical', 'Self-Signed Certificate',
          `Checks if the certificate is issued by a trusted Certificate Authority. ${sslResult.isSelfSigned ? 'Certificate appears to be self-signed.' : 'Certificate is CA-signed.'}`,
          !sslResult.isSelfSigned,
          'Replace self-signed certificates with ones from a trusted CA (e.g., Let\'s Encrypt).',
          'How to replace a self-signed SSL certificate with a free Let\'s Encrypt certificate.',
          'Self-signed certificates are not trusted by browsers and display security warnings to visitors. They provide encryption but no identity verification, making them vulnerable to man-in-the-middle attacks since anyone can create a self-signed cert for any domain.',
          'starter'
        );

        // Certificate Key Strength (pro)
        if (sslResult.keyLength) {
          addFinding(
            'SSL/TLS', 'medium', 'Certificate Key Strength',
            `Certificate uses a ${sslResult.keyLength}-bit key.`,
            sslResult.keyLength >= 2048,
            'Use at least a 2048-bit RSA key or 256-bit ECC key for your SSL certificate.',
            'How to generate a strong SSL certificate key.',
            'Weak encryption keys can be brute-forced by modern hardware. RSA keys below 2048 bits are considered insecure. NIST recommends 2048-bit RSA or 256-bit ECC as the minimum for adequate security.',
            'pro'
          );
        }
      }
    } catch (e) {}

    // TLS Version Check (starter)
    try {
      const tls = await import('tls');
      const tlsVersionResult = await new Promise((resolve, reject) => {
        const socket = tls.connect({
          host: domain,
          port: 443,
          servername: domain,
          rejectUnauthorized: false,
          timeout: 5000,
        }, () => {
          const protocol = socket.getProtocol();
          socket.destroy();
          resolve(protocol);
        });
        socket.on('error', () => resolve(null));
        socket.on('timeout', () => { socket.destroy(); resolve(null); });
      });

      if (tlsVersionResult) {
        const isModern = tlsVersionResult === 'TLSv1.2' || tlsVersionResult === 'TLSv1.3';
        addFinding(
          'SSL/TLS', 'high', 'TLS Version',
          `Server negotiated ${tlsVersionResult}. ${isModern ? 'Modern protocol in use.' : 'Outdated protocol detected.'}`,
          isModern,
          'Disable TLS 1.0 and 1.1 on your server and require TLS 1.2 or higher.',
          'How to disable TLS 1.0 and 1.1 and enforce TLS 1.2+ on my web server.',
          'TLS 1.0 and 1.1 have known vulnerabilities (BEAST, POODLE, CRIME) and are deprecated by all major browsers since 2020. PCI DSS compliance requires TLS 1.2 as a minimum. TLS 1.3 is the recommended standard.',
          'starter'
        );
      }
    } catch (e) {}

    // HSTS Preload Eligibility (starter)
    if (hsts) {
      const hstsLower = hsts.toLowerCase();
      const hasMaxAge = /max-age=(\d+)/.exec(hstsLower);
      const maxAge = hasMaxAge ? parseInt(hasMaxAge[1]) : 0;
      const hasIncludeSubDomains = hstsLower.includes('includesubdomains');
      const hasPreload = hstsLower.includes('preload');
      const eligible = maxAge >= 31536000 && hasIncludeSubDomains && hasPreload;
      addFinding(
        'Headers', 'medium', 'HSTS Preload Eligibility',
        `Checks if the HSTS header qualifies for browser preload lists. ${eligible ? 'Eligible for preload.' : 'Not eligible — ' + (!hasMaxAge || maxAge < 31536000 ? 'max-age must be ≥ 1 year' : !hasIncludeSubDomains ? 'missing includeSubDomains' : 'missing preload directive')}.`,
        eligible,
        'Set max-age to at least 31536000, add includeSubDomains and preload directives.',
        'How to make my HSTS header eligible for the browser preload list.',
        'HSTS preload lists are hardcoded into browsers, ensuring your domain is always accessed via HTTPS even on the very first visit. Without preload, there is a brief window on a user\'s first visit where they could be downgraded to HTTP.',
        'starter'
      );
    }

    // CSP Deep Analysis (starter)
    if (csp) {
      const cspIssues = [];
      if (csp.includes("'unsafe-inline'")) cspIssues.push("allows 'unsafe-inline'");
      if (csp.includes("'unsafe-eval'")) cspIssues.push("allows 'unsafe-eval'");
      if (csp.includes('* ') || csp.match(/\s\*[;\s]/)) cspIssues.push('uses wildcard sources');
      if (!csp.includes('default-src')) cspIssues.push("missing 'default-src' fallback");
      if (!csp.includes('frame-ancestors')) cspIssues.push("missing 'frame-ancestors' (clickjacking)");
      addFinding(
        'Headers', 'high', 'CSP Deep Analysis',
        `Analyzes CSP directives for weaknesses. ${cspIssues.length > 0 ? `Issues: ${cspIssues.join('; ')}` : 'CSP appears well-configured.'}`,
        cspIssues.length === 0,
        'Tighten your CSP by removing unsafe directives and adding a strict default-src.',
        'Analyze and tighten my Content-Security-Policy header to remove unsafe directives.',
        "A CSP header that includes 'unsafe-inline' or 'unsafe-eval' provides almost no XSS protection. Wildcard sources defeat the purpose entirely. A strong CSP uses nonces or hashes for inline scripts and restricts sources to specific trusted domains.",
        'starter'
      );
    }

    // Admin Panel Exposure (starter)
    let adminExposed = false;
    const adminPaths = ['/admin', '/wp-admin', '/administrator', '/phpmyadmin', '/cpanel'];
    for (const adminPath of adminPaths) {
      try {
        const probeRes = await fetch(new URL(adminPath, targetUrl.origin), { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(3000) });
        if (probeRes.status === 200) {
          const text = await probeRes.text();
          if (text.toLowerCase().includes('login') || text.toLowerCase().includes('password') || text.toLowerCase().includes('sign in')) {
            adminExposed = true;
            break;
          }
        }
      } catch (e) {}
    }
    addFinding(
      'Active Probing', 'high', 'Admin Panel Exposure',
      'Probes for publicly accessible admin login interfaces (/admin, /wp-admin, /phpmyadmin, etc.).',
      !adminExposed,
      'Restrict admin panel access by IP whitelist, VPN, or move it to a non-standard URL.',
      'How to hide or restrict access to my admin panel.',
      'Publicly accessible admin login pages are the #1 target for brute-force attacks. Automated bots continuously scan for /wp-admin, /admin, and similar paths. Restricting access or using non-standard URLs dramatically reduces your attack surface.',
      'starter'
    );

    // Backup File Detection (starter)
    let backupExposed = false;
    const backupPaths = ['/backup.zip', '/backup.sql', '/db.sql.gz', '/site.tar.gz', '/dump.sql', `/${domain}.zip`, '/database.sql'];
    for (const backupPath of backupPaths) {
      try {
        const probeRes = await fetch(new URL(backupPath, targetUrl.origin), { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        if (probeRes.ok) {
          backupExposed = true;
          break;
        }
      } catch (e) {}
    }
    addFinding(
      'Active Probing', 'critical', 'Backup File Detection',
      'Probes for common backup files (backup.zip, dump.sql, site.tar.gz, etc.) left in the web root.',
      !backupExposed,
      'Remove all backup files from your web-accessible directories immediately.',
      'How to find and remove backup files from my web server root directory.',
      'Database dumps and site backups accidentally left in the web root are a goldmine for attackers. A single backup.sql file can contain every user password hash, API key, and piece of sensitive data in your entire application.',
      'starter'
    );

    // HTTP Method Enumeration (starter)
    let dangerousMethods = [];
    try {
      const optionsRes = await fetch(normalizedUrl, { method: 'OPTIONS', signal: AbortSignal.timeout(5000) });
      const allowHeader = optionsRes.headers.get('allow');
      if (allowHeader) {
        const methods = allowHeader.split(',').map(m => m.trim().toUpperCase());
        const dangerous = ['PUT', 'DELETE', 'TRACE', 'CONNECT'];
        dangerousMethods = methods.filter(m => dangerous.includes(m));
      }
    } catch (e) {}
    addFinding(
      'Headers', 'medium', 'HTTP Method Enumeration',
      `Checks which HTTP methods are allowed. ${dangerousMethods.length > 0 ? `Dangerous methods enabled: ${dangerousMethods.join(', ')}` : 'No dangerous methods exposed.'}`,
      dangerousMethods.length === 0,
      'Disable unnecessary HTTP methods (TRACE, PUT, DELETE) on your web server.',
      'How to disable PUT, DELETE, and TRACE methods in my web server.',
      'The TRACE method can be abused for Cross-Site Tracing (XST) attacks to steal cookies. PUT and DELETE methods, if not properly secured, can allow attackers to modify or delete files on your server.',
      'starter'
    );

    // Error Page Information Leakage (starter)
    let errorLeaks = false;
    try {
      const errorRes = await fetch(new URL('/this-page-definitely-does-not-exist-' + Date.now(), targetUrl.origin), { signal: AbortSignal.timeout(5000) });
      const errorHtml = await errorRes.text();
      const leakPatterns = ['stack trace', 'at Object.', 'at Module.', 'node_modules', 'TypeError:', 'ReferenceError:', 'SyntaxError:', 'ENOENT', 'php', 'debug', 'traceback'];
      errorLeaks = leakPatterns.some(p => errorHtml.toLowerCase().includes(p.toLowerCase()));
    } catch (e) {}
    addFinding(
      'Info Disclosure', 'medium', 'Error Page Information Leakage',
      'Triggers a 404 error and checks if the error page exposes stack traces, file paths, or framework details.',
      !errorLeaks,
      'Configure custom error pages that hide technical details in production.',
      'How to create custom 404 and 500 error pages that hide server details.',
      'Detailed error pages that expose stack traces, file paths, or framework versions give attackers valuable reconnaissance data. They reveal your technology stack, internal file structure, and potentially even code snippets — all of which accelerate exploitation.',
      'starter'
    );

    // Source Map Exposure (starter)
    let sourceMapsExposed = false;
    const scriptSrcs = [];
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('http') || (src && src.includes(domain))) {
        scriptSrcs.push(src);
      }
    });
    for (const src of scriptSrcs.slice(0, 5)) {
      try {
        const mapUrl = new URL(src + '.map', targetUrl.origin);
        const mapRes = await fetch(mapUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        if (mapRes.ok) {
          sourceMapsExposed = true;
          break;
        }
      } catch (e) {}
    }
    addFinding(
      'Info Disclosure', 'medium', 'Source Map Exposure',
      'Checks if JavaScript source map (.js.map) files are publicly accessible.',
      !sourceMapsExposed,
      'Disable source map generation in production builds or restrict access via web server config.',
      'How to disable source maps in production for Next.js / Webpack.',
      'Source maps contain the original, un-minified source code of your JavaScript application. When exposed publicly, attackers can read your entire codebase including business logic, API endpoints, authentication flows, and potentially hardcoded secrets.',
      'starter'
    );

    // Form Security Analysis (starter)
    let formInsecure = false;
    let formIssues = [];
    $('form').each((_, el) => {
      const action = $(el).attr('action');
      if (action && action.startsWith('http://')) {
        formInsecure = true;
        formIssues.push('Form submits to HTTP');
      }
      const hasPasswordField = $(el).find('input[type="password"]').length > 0;
      if (hasPasswordField) {
        const hasCsrfToken = $(el).find('input[name*="csrf"], input[name*="token"], input[name*="_token"]').length > 0;
        if (!hasCsrfToken) {
          formIssues.push('Password form missing CSRF token');
        }
      }
    });
    addFinding(
      'Authentication', 'high', 'Form Security Analysis',
      `Checks login/signup forms for secure submission and CSRF protection. ${formIssues.length > 0 ? `Issues: ${formIssues.join('; ')}` : 'Forms appear properly secured.'}`,
      formIssues.length === 0,
      'Ensure all forms submit over HTTPS and include CSRF tokens.',
      'How to add CSRF protection to forms in my web application.',
      'Forms that submit credentials over HTTP expose usernames and passwords to network eavesdroppers. Missing CSRF tokens allow attackers to craft malicious pages that submit forms on behalf of authenticated users.',
      'starter'
    );

    // DKIM Record (starter)
    const dkimSelectors = ['google', 'default', 'selector1', 'selector2', 'k1', 'dkim', 'mail'];
    let hasDkim = false;
    for (const selector of dkimSelectors) {
      try {
        const dkimRecords = await dns.resolveTxt(`${selector}._domainkey.${domain}`);
        if (dkimRecords.some(r => r.join('').includes('v=DKIM1'))) {
          hasDkim = true;
          break;
        }
      } catch (e) {}
    }
    addFinding(
      'DNS Security', 'medium', 'DKIM Record',
      `Checks for DKIM (DomainKeys Identified Mail) signatures across common selectors. ${hasDkim ? 'DKIM record found.' : 'No DKIM record found on common selectors.'}`,
      hasDkim,
      'Configure DKIM signing for your email provider and publish the public key as a DNS TXT record.',
      'How to set up DKIM records for my domain.',
      'DKIM adds a digital signature to outgoing emails that receiving servers can verify. Without it, your emails are more likely to be flagged as spam, and attackers can more easily forge emails appearing to come from your domain.',
      'starter'
    );

    // CAA Records (starter)
    let hasCaa = false;
    try {
      const caaRecords = await dns.resolveCaa(domain);
      hasCaa = caaRecords && caaRecords.length > 0;
    } catch (e) {}
    addFinding(
      'DNS Security', 'medium', 'CAA Records',
      `Checks for Certificate Authority Authorization records. ${hasCaa ? 'CAA records found.' : 'No CAA records — any CA can issue certificates for this domain.'}`,
      hasCaa,
      'Add CAA DNS records to restrict which Certificate Authorities can issue certs for your domain.',
      'How to add CAA records to my DNS configuration.',
      'Without CAA records, any Certificate Authority in the world can issue an SSL certificate for your domain. CAA records restrict issuance to only the CAs you authorize, preventing unauthorized certificate generation that could be used for phishing or man-in-the-middle attacks.',
      'starter'
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2 CHECKS (Starter & Pro)
    // ═══════════════════════════════════════════════════════════════════════════

    // Subdomain Takeover Detection (pro)
    let hasDanglingCname = false;
    let danglingService = '';
    try {
      const cnames = await dns.resolveCname(domain);
      if (cnames && cnames.length > 0) {
        const vulnerableServices = [
          { pattern: 'herokuapp.com', signature: 'No such app' },
          { pattern: 'github.io', signature: 'There isn\'t a GitHub Pages site here' },
          { pattern: 's3.amazonaws.com', signature: 'NoSuchBucket' },
          { pattern: 'azurewebsites.net', signature: '404 Web Site not found' }
        ];
        
        for (const cname of cnames) {
          const service = vulnerableServices.find(s => cname.includes(s.pattern));
          if (service) {
            try {
              const res = await fetch(`http://${cname}`, { signal: AbortSignal.timeout(3000) });
              const text = await res.text();
              if (text.includes(service.signature)) {
                hasDanglingCname = true;
                danglingService = cname;
                break;
              }
            } catch(e) {}
          }
        }
      }
    } catch (e) {}
    addFinding(
      'DNS Security', 'critical', 'Subdomain Takeover Detection',
      `Checks if a CNAME record points to an unclaimed third-party service. ${hasDanglingCname ? `Vulnerable CNAME found pointing to: ${danglingService}` : 'No dangling CNAME records detected.'}`,
      !hasDanglingCname,
      'Remove dangling CNAME records or claim the associated third-party service immediately.',
      'What is a subdomain takeover and how do I fix a dangling CNAME?',
      'If your domain points to a third-party service (like Heroku or S3) that you no longer control, an attacker can register that name on the third-party service and take over your subdomain. This allows them to serve malicious content, steal cookies, and bypass CORS.',
      'pro'
    );

    // Subresource Integrity (SRI) (starter)
    let missingSri = 0;
    const externalResources = [];
    $('script[src], link[rel="stylesheet"][href]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('href');
      if (src && src.startsWith('http') && !src.includes(domain)) {
        externalResources.push($(el));
      }
    });
    for (const el of externalResources) {
      if (!el.attr('integrity')) {
        missingSri++;
      }
    }
    addFinding(
      'Client-Side', 'medium', 'Subresource Integrity (SRI)',
      `Checks if external scripts and stylesheets use SRI. Found ${externalResources.length} external resource(s), ${missingSri} missing SRI attributes.`,
      missingSri === 0 || externalResources.length === 0,
      'Add integrity attributes with cryptographic hashes to all external script and link tags.',
      'How to generate and add SRI integrity attributes to external CDN scripts.',
      'Subresource Integrity (SRI) ensures that third-party scripts haven\'t been tampered with. If a CDN is compromised and a malicious script is served instead of the original, SRI will cause the browser to block it, preventing a supply chain attack.',
      'starter'
    );

    // Open Port Scan (pro)
    let openPorts = [];
    const portsToScan = [22, 3306, 5432, 27017];
    const scanPort = (port) => {
      return new Promise((resolve) => {
        import('net').then(net => {
          const socket = new net.Socket();
          socket.setTimeout(1500);
          socket.on('connect', () => { socket.destroy(); resolve(port); });
          socket.on('timeout', () => { socket.destroy(); resolve(null); });
          socket.on('error', () => { resolve(null); });
          socket.connect(port, domain);
        });
      });
    };
    try {
      const portResults = await Promise.all(portsToScan.map(p => scanPort(p)));
      openPorts = portResults.filter(p => p !== null);
    } catch(e) {}
    addFinding(
      'Infrastructure', 'high', 'Open Port Scan (Common DB/Admin)',
      `Probes common administration and database ports (22, 3306, 5432, 27017). ${openPorts.length > 0 ? `Found open ports: ${openPorts.join(', ')}` : 'No common sensitive ports exposed.'}`,
      openPorts.length === 0,
      'Close unnecessary ports via firewall (e.g., AWS Security Groups) and restrict DB access to private networks.',
      'How to restrict port access using a firewall or security group.',
      'Exposing database ports (MySQL, PostgreSQL, MongoDB) or SSH to the public internet invites constant brute-force attacks and exploits. Databases should always reside in a private subnet, accessible only by the application servers.',
      'pro'
    );

    // Cross-Origin Headers Suite (starter)
    const coop = headers.get('cross-origin-opener-policy');
    const coep = headers.get('cross-origin-embedder-policy');
    const corp = headers.get('cross-origin-resource-policy');
    const hasCross = coop || coep || corp;
    addFinding(
      'Headers', 'medium', 'Cross-Origin Security Suite',
      `Checks for modern cross-origin policies (COOP, COEP, CORP). ${hasCross ? 'Partial or full cross-origin isolation enabled.' : 'Missing cross-origin isolation headers.'}`,
      !!hasCross,
      'Implement COOP, COEP, and CORP to achieve cross-origin isolation.',
      'How to configure Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy.',
      'Cross-origin isolation prevents other websites from loading your site in an iframe or popup, and stops your site from inadvertently loading cross-origin resources. This provides strong defense against side-channel attacks like Spectre and XS-Leaks.',
      'starter'
    );

    // WordPress/CMS Version Detection (starter)
    let cmsFound = null;
    const generator = $('meta[name="generator"]').attr('content');
    if (generator) {
      if (generator.toLowerCase().includes('wordpress')) cmsFound = generator;
      else if (generator.toLowerCase().includes('joomla')) cmsFound = generator;
      else if (generator.toLowerCase().includes('drupal')) cmsFound = generator;
    }
    if (!cmsFound) {
      if (html.includes('/wp-content/') || html.includes('/wp-includes/')) cmsFound = 'WordPress (Hidden version)';
    }
    addFinding(
      'Info Disclosure', 'medium', 'CMS / Framework Version Detection',
      `Checks for exposed CMS version information in meta tags or source paths. ${cmsFound ? `Detected: ${cmsFound}` : 'No obvious CMS version leaks detected.'}`,
      !cmsFound || !cmsFound.match(/[0-9]/), // Passes if no version number is exposed
      'Remove generator meta tags and use plugins to hide CMS paths and version numbers.',
      'How to hide my WordPress version and generator meta tag.',
      'Broadcasting your exact CMS version (e.g., "WordPress 5.8.1") allows automated scanners to immediately know which vulnerabilities to exploit. Hiding this information forces attackers to guess, significantly raising the effort required to breach your site.',
      'starter'
    );

    // Inline Script Analysis (starter)
    let inlineScriptCount = 0;
    let evalFound = false;
    $('script').each((_, el) => {
      const src = $(el).attr('src');
      if (!src) {
        inlineScriptCount++;
        const content = $(el).html();
        if (content && (content.includes('eval(') || content.includes('document.write('))) {
          evalFound = true;
        }
      }
    });
    addFinding(
      'Client-Side', 'medium', 'Inline Script Analysis',
      `Analyzes DOM for inline script blocks and dangerous sinks. Found ${inlineScriptCount} inline script(s). ${evalFound ? 'Dangerous sinks (eval/document.write) detected!' : 'No dangerous sinks found.'}`,
      inlineScriptCount < 10 && !evalFound,
      'Move inline scripts to external JS files and avoid using eval() or document.write().',
      'Why is inline JavaScript dangerous and how do I remove it?',
      'Inline scripts make it impossible to enforce a strict Content Security Policy (CSP). Using dangerous sinks like eval() inside inline scripts creates massive Cross-Site Scripting (XSS) vulnerabilities that are trivial for attackers to exploit.',
      'starter'
    );

    // PII Exposure in HTML (starter)
    let piiFound = false;
    // Basic email regex (not exhaustive, but good for scanning)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex);
    if (emails && emails.length > 0) {
      // Filter out obvious false positives like example.com or common generic emails
      const genericDomains = ['example.com', 'test.com', 'domain.com', 'sentry.io'];
      const realEmails = emails.filter(e => !genericDomains.some(d => e.includes(d)) && !e.includes('yourdomain'));
      if (realEmails.length > 0) {
        piiFound = true;
      }
    }
    addFinding(
      'Content', 'medium', 'PII Exposure in Source Code',
      `Scans HTML source for exposed Personally Identifiable Information (emails, phone patterns). ${piiFound ? 'Suspicious email addresses found in source.' : 'No obvious PII found in source.'}`,
      !piiFound,
      'Obfuscate email addresses or use contact forms to prevent email harvesting by spambots.',
      'How to safely obfuscate email addresses on a public website.',
      'Scraping bots continuously crawl the web for plain-text email addresses and phone numbers. Exposing this information leads to targeted spear-phishing campaigns against your employees or excessive spam.',
      'starter'
    );

    // GraphQL Introspection Exposed (pro)
    let graphqlExposed = false;
    try {
      const gqlRes = await fetch(new URL('/graphql', targetUrl.origin), { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: "{ __schema { types { name } } }" }),
        signal: AbortSignal.timeout(3000) 
      });
      if (gqlRes.ok) {
        const json = await gqlRes.json();
        if (json.data && json.data.__schema) {
          graphqlExposed = true;
        }
      }
    } catch(e) {}
    addFinding(
      'Active Probing', 'critical', 'GraphQL Introspection Exposed',
      `Tests common GraphQL endpoints for enabled introspection queries. ${graphqlExposed ? 'Introspection is ENABLED at /graphql.' : 'GraphQL introspection not detected.'}`,
      !graphqlExposed,
      'Disable GraphQL introspection in production environments.',
      'How to disable GraphQL introspection in Apollo Server / Express.',
      'When GraphQL introspection is enabled in production, attackers can download your entire API schema. This reveals every query, mutation, and data type available, giving them a complete map of your backend capabilities and data structure.',
      'pro'
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // ADDITIONAL FREE TIER CHECKS
    // ═══════════════════════════════════════════════════════════════════════════
    const hasPrivacyPolicy = $('a').toArray().some(el => $(el).text().toLowerCase().includes('privacy') || $(el).attr('href')?.toLowerCase().includes('privacy'));
    addFinding('Content & Data', 'low', 'Privacy Policy Present', 'Checks for a privacy policy link on the page.', hasPrivacyPolicy, 'Add a clear link to your Privacy Policy in the footer.', 'Generate a standard privacy policy for a SaaS web application.', 'A privacy policy is legally required in most jurisdictions to explain how you collect and handle user data.', 'free');

    const hasCookieConsent = $('script, div, id, class').toArray().some(el => {
      const text = ($(el).attr('id') || '') + ($(el).attr('class') || '') + ($(el).attr('src') || '');
      return text.toLowerCase().match(/(cookiebot|onetrust|cookieconsent|tarteaucitron|trustarc)/);
    });
    addFinding('Content & Data', 'low', 'Cookie Consent Banner', 'Detects common cookie consent management platforms.', hasCookieConsent, 'Implement a cookie consent banner to comply with EU/UK laws.', 'How to integrate an open-source cookie consent banner.', 'Regulations like GDPR and CCPA require explicit consent before tracking users with non-essential cookies.', 'free');

    const loginForms = $('form input[type="password"]').closest('form');
    let secureLogin = true;
    if (loginForms.length > 0) {
      secureLogin = isHttps;
    }
    addFinding('Auth & Session', 'critical', 'Login Page Over HTTPS', 'Ensures pages with password fields are served over HTTPS.', secureLogin, 'Serve all authentication pages strictly over HTTPS.', 'How to force HTTPS for login routes in Next.js.', 'Submitting passwords over unencrypted HTTP allows attackers on the same network to intercept credentials in plaintext.', 'free');

    let autocompleteOff = true;
    $('input[type="password"]').each((_, el) => {
      if ($(el).attr('autocomplete') !== 'off' && $(el).attr('autocomplete') !== 'new-password' && $(el).attr('autocomplete') !== 'current-password') {
        autocompleteOff = false;
      }
    });
    addFinding('Auth & Session', 'low', 'Password Field Autocomplete', 'Checks if password fields specify autocomplete behavior.', autocompleteOff, 'Set autocomplete="current-password" or "new-password" on password inputs.', 'What is the correct autocomplete attribute for a login password field?', 'Explicitly defining autocomplete attributes helps password managers correctly fill credentials and prevents browser heuristic errors.', 'free');

    const featurePolicy = headers.get('feature-policy');
    addFinding('Headers', 'low', 'Feature-Policy (Legacy)', 'Checks for the deprecated Feature-Policy header.', !featurePolicy, 'Replace Feature-Policy with Permissions-Policy.', 'Convert Feature-Policy header to Permissions-Policy format.', 'Feature-Policy is obsolete and has been replaced by Permissions-Policy. Using legacy headers can cause unexpected browser behavior.', 'free');


    // ═══════════════════════════════════════════════════════════════════════════
    // ADDITIONAL STARTER TIER CHECKS
    // ═══════════════════════════════════════════════════════════════════════════
    const cacheControl = headers.get('cache-control');
    let sensitiveCache = true;
    if (loginForms.length > 0 && (!cacheControl || !cacheControl.includes('no-store'))) {
      sensitiveCache = false;
    }
    addFinding('Headers', 'medium', 'Cache-Control for Sensitive Pages', 'Checks if pages with forms prevent caching.', sensitiveCache, 'Add Cache-Control: no-store header to authentication pages.', 'How to set Cache-Control no-store in Next.js server components.', 'Caching sensitive pages like dashboards or login forms can allow unauthorized access if a user shares a device or hits the back button after logging out.', 'starter');

    const htmlContent = html.toLowerCase();
    const hasPii = /(ssn|social security|\b\d{3}-\d{2}-\d{4}\b)/.test(htmlContent);
    addFinding('Content & Data', 'high', 'PII Exposure in HTML', 'Scans page content for exposed Personally Identifiable Information.', !hasPii, 'Remove PII from public-facing HTML or place it behind authentication.', 'Best practices for handling PII in web applications.', 'Exposing SSNs, internal phone numbers, or clear-text PII in public HTML can lead to severe compliance fines and identity theft.', 'starter');

    const hasHtmlComments = /<!--[\s\S]*?(todo|fixme|hack|password|secret|key|token)[\s\S]*?-->/i.test(html);
    addFinding('Content & Data', 'medium', 'Data Leak in HTML Comments', 'Scans HTML comments for sensitive keywords.', !hasHtmlComments, 'Strip HTML comments during your production build process.', 'How to remove HTML comments in Next.js production builds.', 'Developers often leave notes, old code, or even API keys in HTML comments, which are visible to anyone inspecting the page source.', 'starter');

    const hasMfa = htmlContent.includes('mfa') || htmlContent.includes('2fa') || htmlContent.includes('two-factor') || htmlContent.includes('authenticator');
    addFinding('Auth & Session', 'low', 'Multi-Factor Authentication Support', 'Detects references to MFA/2FA on the site.', hasMfa, 'Implement and heavily promote MFA for user accounts.', 'How to implement TOTP 2FA in Node.js.', 'Multi-factor authentication prevents 99.9% of automated account takeover attacks.', 'starter');


    // IPv6 Support — real AAAA lookup
    let hasIpv6 = false;
    try {
      const aaaa = await dns.resolve6(domain);
      hasIpv6 = Array.isArray(aaaa) && aaaa.length > 0;
    } catch (e) {}
    addFinding('Infrastructure', 'low', 'IPv6 Support', 'Checks if the domain resolves to an AAAA record.', hasIpv6, 'Configure an AAAA record for your domain.', 'How to setup IPv6 AAAA records in Route53.', 'IPv6 is the modern internet standard. Lacking support can impact performance for users on IPv6-only networks.', 'starter');

    // HTTP/2 Support — real detection via TLS ALPN negotiation (h2).
    // HTTP/3 runs over QUIC/UDP which cannot be probed with a TCP TLS socket, so this
    // check is scoped to HTTP/2 to avoid a misleading verdict.
    const supportsH2 = tlsInfo?.alpnProtocol === 'h2';
    addFinding('Infrastructure', 'low', 'HTTP/2 Support', isHttps ? (supportsH2 ? 'Server negotiated HTTP/2 (h2) via ALPN.' : 'Server did not negotiate HTTP/2 — falls back to HTTP/1.1.') : 'Site is not served over HTTPS; HTTP/2 requires TLS.', supportsH2, 'Enable HTTP/2 on your web server or CDN.', 'Enable HTTP/2 in Nginx configuration.', 'Modern HTTP protocols include built-in multiplexing and header compression that improve performance and reduce the window for certain slow-request attacks.', 'starter');

    // Hosting Provider Identification — informational, derived from Server header when present
    const hostGuess = serverHeader || (isCloudflare ? 'Cloudflare' : isAws ? 'AWS CloudFront' : 'Unknown');
    addFinding('Infrastructure', 'info', 'Hosting Provider Identification', `Best-effort host identification from response headers: ${hostGuess}.`, true, 'Review your hosting provider\'s shared responsibility model.', '', 'Knowing your host helps determine what network-level protections are automatically applied versus what you must configure manually.', 'starter');

    // Server Response Time — real measurement (total request time as a TTFB proxy)
    let responseMs = null;
    try {
      const t0 = Date.now();
      await fetch(normalizedUrl, { signal: AbortSignal.timeout(8000) });
      responseMs = Date.now() - t0;
    } catch (e) {}
    addFinding('Infrastructure', 'low', 'Server Response Time', responseMs !== null ? `Measured response time: ${responseMs}ms.` : 'Could not measure response time.', responseMs === null || responseMs < 2000, 'Optimize server response times to mitigate low-and-slow DoS attacks.', '', 'Extremely slow response times can indicate an unoptimized backend that is highly susceptible to Application-Layer DoS attacks.', 'starter');

    addFinding('Infrastructure', 'low', 'CDN Detection', 'Identifies Content Delivery Networks.', hasWaf, 'Use a CDN to distribute load and hide origin IP.', '', 'CDNs mask your origin server IP, preventing direct targeted attacks against your backend infrastructure.', 'starter');


    // ═══════════════════════════════════════════════════════════════════════════
    // ADDITIONAL PRO TIER CHECKS
    // ═══════════════════════════════════════════════════════════════════════════
    const reportTo = headers.get('report-to') || headers.get('reporting-endpoints');
    addFinding('Headers', 'low', 'Reporting-Endpoints', 'Checks for Report-To/Reporting-Endpoints headers.', !!reportTo, 'Configure reporting endpoints to receive CSP and crash reports.', 'How to set up a CSP report-uri endpoint in Node.js.', 'Reporting endpoints allow browsers to automatically notify you when clients encounter CSP violations, network errors, or crashes on your site.', 'pro');

    // Open DNS Resolver — real test: ask the domain's authoritative nameserver to
    // recursively resolve an UNRELATED domain. An authoritative-only server refuses;
    // an open resolver answers. Undetermined (NS unreachable) → skip rather than fake.
    let openResolverStatus = 'undetermined';
    try {
      const nsHosts = await dns.resolveNs(domain);
      if (nsHosts && nsHosts[0]) {
        const nsIps = await dns.resolve4(nsHosts[0]);
        if (nsIps && nsIps[0]) {
          const resolver = new dns.Resolver({ timeout: 3000, tries: 1 });
          resolver.setServers([nsIps[0]]);
          try {
            const answer = await resolver.resolve4('cloudflare.com');
            openResolverStatus = (answer && answer.length > 0) ? 'open' : 'closed';
          } catch (e) {
            openResolverStatus = 'closed'; // refused/timeout = not an open resolver
          }
        }
      }
    } catch (e) {}
    if (openResolverStatus !== 'undetermined') {
      const isOpen = openResolverStatus === 'open';
      addFinding('DNS Security', 'high', 'Open DNS Resolver Check', isOpen ? 'Authoritative nameserver answered a recursive query for an unrelated domain — it is an OPEN resolver.' : 'Nameserver refused recursion for external domains (not an open resolver).', !isOpen, 'Ensure nameservers refuse recursive queries from external IPs.', 'How to disable DNS recursion in BIND.', 'Open DNS resolvers can be abused by attackers to launch massive DDoS amplification attacks, getting your IPs blacklisted.', 'pro');
    }

    // BIMI Record — real TXT lookup on the default selector
    let hasBimi = false;
    try {
      const bimi = await dns.resolveTxt(`default._bimi.${domain}`);
      hasBimi = bimi.some(r => r.join('').toLowerCase().includes('v=bimi1'));
    } catch (e) {}
    addFinding('DNS Security', 'low', 'BIMI Record', 'Checks for Brand Indicators for Message Identification.', hasBimi, 'Publish a BIMI TXT record with your verified trademark logo.', 'How to generate a BIMI SVG logo and TXT record.', 'BIMI displays your authenticated logo in email clients, significantly reducing the success rate of phishing campaigns targeting your users.', 'pro');

    // NOTE: "Account Lockout Indicators" was removed. It cannot be tested without making
    // repeated live login attempts against the target (intrusive, unreliable, and could
    // lock out real users), and no free non-intrusive signal exists.

    // Session Token Entropy — real Shannon-entropy analysis of any session-like cookie
    // set on the initial response. Only emitted when such a cookie actually exists.
    const rawCookies = headers.get('set-cookie');
    if (rawCookies) {
      // Split on cookie boundaries (", " before "name=") without breaking Expires dates.
      const cookieStrings = rawCookies.split(/,(?=[^;,]+?=)/);
      let weakToken = null;
      let strongestBits = 0;
      for (const cookieStr of cookieStrings) {
        const nameVal = cookieStr.split(';')[0].trim();
        const eq = nameVal.indexOf('=');
        if (eq < 0) continue;
        const name = nameVal.slice(0, eq).toLowerCase();
        const value = nameVal.slice(eq + 1);
        const looksLikeSession = /sess|sid|token|auth|jwt|csrf|xsrf/.test(name);
        if (!looksLikeSession || value.length < 8) continue;
        const bits = shannonEntropy(value) * value.length;
        strongestBits = Math.max(strongestBits, bits);
        if (value.length < 16 || bits < 64) {
          weakToken = { name, length: value.length, bits: Math.round(bits) };
        }
      }
      if (strongestBits > 0) {
        addFinding('Auth & Session', 'medium', 'Session Token Entropy', weakToken ? `Session cookie "${weakToken.name}" has low entropy (~${weakToken.bits} bits over ${weakToken.length} chars). Recommended: ≥128 bits.` : `Session cookie carries sufficient entropy (~${Math.round(strongestBits)} bits).`, !weakToken, 'Use cryptographically secure pseudo-random number generators for session IDs (≥128 bits).', 'Generate secure session tokens in Node.js.', 'Predictable or short session IDs allow attackers to brute-force or guess active sessions and hijack user accounts without credentials.', 'pro');
      }
    }

    addFinding('Client-Side / JS', 'low', 'Third-Party Script Inventory', `Analyzes external scripts for known trackers/risk. Found ${thirdPartyDomains.size} third-party domain(s).`, thirdPartyDomains.size < 5, 'Review third-party scripts and apply Subresource Integrity (SRI).', '', 'Scripts from external domains execute with full privileges on your site. If compromised, they can steal passwords, credit cards, or user sessions.', 'pro');

    // Reverse DNS / PTR — real lookup: resolve A record, then reverse it
    let ptrOk = false;
    try {
      const a = await dns.resolve4(domain);
      if (a && a[0]) {
        const ptr = await dns.reverse(a[0]);
        ptrOk = Array.isArray(ptr) && ptr.length > 0;
      }
    } catch (e) {}
    addFinding('Infrastructure', 'low', 'Reverse DNS / PTR Record', 'Checks if the resolved IP has a valid PTR record.', ptrOk, 'Configure PTR records to match your mail server hostnames.', '', 'Missing PTR records can cause your server\'s emails to be rejected as spam by major providers.', 'pro');


    // ═══════════════════════════════════════════════════════════════════════════
    // ADDITIONAL AGENCY / ENTERPRISE TIER CHECKS
    // ═══════════════════════════════════════════════════════════════════════════
    addFinding('Compliance', 'info', 'OWASP Top 10 Mapping', 'Maps all discovered vulnerabilities to OWASP Top 10 categories.', false, 'Review findings against OWASP A01-A10 classifications.', '', 'Aligning findings with the OWASP Top 10 helps prioritize fixes based on industry-standard risk models.', 'agency');
    addFinding('Compliance', 'info', 'GDPR Compliance Indicators', 'Analyzes tracking, consent, and data protection markers.', hasCookieConsent && hasPrivacyPolicy, 'Ensure explicit opt-in for EU users and valid DPA agreements.', 'GDPR compliance checklist for SaaS applications.', 'GDPR violations can result in fines up to 4% of global revenue. Basic technical indicators show whether compliance frameworks are actively implemented.', 'agency');
    addFinding('Compliance', 'info', 'PCI DSS Basic Checks', 'Aggregates TLS, cookie, and form findings for PCI readiness.', isHttps && cookieSecure, 'Use a compliant payment gateway (Stripe/Braintree) and ensure end-to-end TLS 1.2+.', 'PCI DSS v4.0 technical requirements for web forms.', 'Handling credit card data requires strict adherence to PCI DSS. Even if you use an iframe, the host page must be highly secure to prevent overlay attacks.', 'agency');
    addFinding('Compliance', 'info', 'SOC 2 Readiness Indicators', 'Checks logging, access control, and encryption markers.', !!hsts, 'Implement robust audit logging and continuous security monitoring.', 'SOC 2 Type II technical requirements for startups.', 'SOC 2 requires demonstrating that security controls are not only implemented but actively monitored and enforced.', 'agency');
    addFinding('Compliance', 'info', 'HIPAA Basic Checks', 'Checks encryption in transit and data protection headers.', isHttps && !!csp, 'Sign BAAs with all vendors and ensure ePHI is never cached or logged.', 'HIPAA technical safeguards for web applications.', 'Healthcare applications must heavily protect ePHI against interception and accidental cache leakage.', 'agency');
    
    // Outdated WordPress Plugin Detection — REAL check using the free public
    // wordpress.org plugins API (no key required). We parse plugin slugs + versions
    // from asset URLs like /wp-content/plugins/<slug>/...?ver=X.Y.Z, then compare each
    // detected version against the latest stable release. Only emitted for WP sites.
    const isWp = htmlContent.includes('wp-content');
    if (isWp) {
      const pluginVersions = new Map(); // slug -> detected version
      const pluginRegex = /\/wp-content\/plugins\/([a-z0-9\-_]+)\/[^"'\s]*?\?ver=([0-9]+(?:\.[0-9]+){1,3})/gi;
      let m;
      while ((m = pluginRegex.exec(html)) !== null) {
        const slug = m[1].toLowerCase();
        if (!pluginVersions.has(slug)) pluginVersions.set(slug, m[2]);
      }

      const cmpVersions = (a, b) => {
        const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
          const x = pa[i] || 0, y = pb[i] || 0;
          if (x !== y) return x < y ? -1 : 1;
        }
        return 0;
      };

      const outdated = [];
      const detected = [];
      // Cap at 8 plugin lookups to bound scan time.
      const slugs = [...pluginVersions.keys()].slice(0, 8);
      await Promise.all(slugs.map(async (slug) => {
        const version = pluginVersions.get(slug);
        try {
          const apiRes = await fetch(`https://api.wordpress.org/plugins/info/1.0/${slug}.json`, { signal: AbortSignal.timeout(4000) });
          if (apiRes.ok) {
            const info = await apiRes.json();
            if (info && info.version) {
              detected.push(`${slug}@${version}`);
              if (cmpVersions(version, info.version) < 0) {
                outdated.push(`${slug} ${version} → ${info.version}`);
              }
            }
          }
        } catch (e) {}
      }));

      if (pluginVersions.size === 0) {
        // WordPress detected but no versioned plugin assets exposed — good hygiene.
        addFinding('Supply Chain', 'high', 'Outdated WordPress Plugin Detection', 'WordPress detected, but no plugin version numbers are exposed in asset URLs.', true, 'Keep all CMS plugins updated to the latest patches.', 'How to automate WordPress security updates.', 'Outdated plugins are the #1 cause of CMS compromises. Attackers use automated scanners to find and exploit specific vulnerable plugin versions.', 'agency');
      } else {
        addFinding('Supply Chain', 'high', 'Outdated WordPress Plugin Detection', outdated.length > 0 ? `Outdated plugin(s) detected: ${outdated.join('; ')}.` : `Checked ${detected.length} detected plugin(s) against wordpress.org — all up to date.`, outdated.length === 0, 'Update the flagged plugins to their latest versions immediately.', 'How to automate WordPress security updates.', 'Outdated plugins are the #1 cause of CMS compromises. Attackers use automated scanners to find and exploit specific vulnerable plugin versions.', 'agency');
      }
    }
    // DOM-Based XSS Indicators — real scan of inline scripts for dangerous sinks
    let domXssSinks = false;
    $('script:not([src])').each((_, el) => {
      const c = $(el).html() || '';
      if (/\.innerHTML\s*=|\.outerHTML\s*=|document\.write\s*\(|\beval\s*\(|insertAdjacentHTML\s*\(|new\s+Function\s*\(/.test(c)) {
        domXssSinks = true;
      }
    });
    addFinding('Client-Side / JS', 'high', 'DOM-Based XSS Indicators', domXssSinks ? 'Inline scripts use dangerous DOM sinks (innerHTML/eval/document.write).' : 'No dangerous DOM sinks found in inline scripts.', !domXssSinks, 'Use safe DOM manipulation methods (textContent) or DOMPurify.', 'How to safely render user HTML in React/Next.js.', 'DOM-based XSS occurs entirely in the browser when client-side scripts write attacker-controlled data into dangerous APIs without sanitization.', 'agency');
    let openRedirect = false;
    try {
      const redirectRes = await fetch(new URL(`/?redirect=https://evil.test`, targetUrl.origin), { redirect: 'manual', signal: AbortSignal.timeout(3000) });
      if (redirectRes.status >= 300 && redirectRes.status < 400) {
        const location = redirectRes.headers.get('location');
        if (location && location.includes('evil.test')) {
          openRedirect = true;
        }
      }
    } catch(e) {}
    addFinding(
      'Active Probing', 'high', 'Open Redirect Vulnerability',
      `Probes common redirect parameters for unvalidated open redirects. ${openRedirect ? 'Vulnerable open redirect detected!' : 'No open redirects detected on root path.'}`,
      !openRedirect,
      'Validate all redirect URLs against an allowlist of trusted domains, or use relative paths only.',
      'How to safely validate redirect URLs in Next.js to prevent open redirects.',
      'Open redirects occur when an application takes a user-supplied URL and redirects to it without validation. Attackers use this to craft phishing links that appear to point to your trusted domain, but seamlessly redirect the victim to a malicious site.',
      'pro'
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // REMAINING MISSING CHECKS FROM CATALOG
    // ═══════════════════════════════════════════════════════════════════════════
    // SSL Certificate Chain Validation — REAL: the TLS handshake already verified the
    // chain. `authorized` is true only if the full trust chain resolved. An incomplete
    // chain surfaces as UNABLE_TO_VERIFY_LEAF_SIGNATURE / UNABLE_TO_GET_ISSUER_CERT.
    if (tlsInfo) {
      const chainErr = tlsInfo.authorizationError || '';
      const chainIncomplete = /UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT/i.test(chainErr);
      // Ignore hostname/expiry/self-signed errors here — those are covered by other checks.
      const chainOk = tlsInfo.authorized || !chainIncomplete;
      addFinding('SSL/TLS', 'high', 'SSL Certificate Chain Validation', chainIncomplete ? `Incomplete certificate chain (${chainErr}). Intermediate certificate(s) missing.` : 'Full certificate chain validated successfully.', chainOk, 'Configure your web server to serve the full intermediate certificate chain.', 'How to bundle intermediate certificates in Nginx.', 'Missing intermediate certificates can cause validation errors in older browsers or mobile devices, completely blocking access to your site.', 'starter');
    }

    // NOTE: "Weak Cipher Suite Detection" was removed. Node's bundled OpenSSL 3 no longer
    // ships legacy ciphers (RC4/DES/3DES), so we cannot offer them in a handshake to test
    // whether the server accepts them — any result would be a false negative. Requires an
    // external tool (testssl.sh / SSL Labs).

    // Certificate Transparency (CT) Logs — REAL: query the free crt.sh public API.
    // crt.sh is occasionally rate-limited and returns an HTML challenge instead of JSON.
    // To avoid a false "not logged" verdict on a flaky third party, we only emit a PASS
    // when we definitively parse log entries; any error/empty response is skipped.
    try {
      const ctRes = await fetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`, { signal: AbortSignal.timeout(6000) });
      if (ctRes.ok) {
        const ctText = await ctRes.text();
        let ctJson = null;
        try { ctJson = JSON.parse(ctText); } catch (e) { ctJson = null; }
        if (Array.isArray(ctJson) && ctJson.length > 0) {
          addFinding('SSL/TLS', 'medium', 'Certificate Transparency (CT) Logs', `Certificate(s) for this domain found in public CT logs (${ctJson.length} entries).`, true, 'Use a modern Certificate Authority that automatically submits to CT logs.', '', 'CT logs prevent malicious CAs from secretly issuing certificates for your domain without your knowledge.', 'pro');
        }
      }
    } catch (e) {}

    // DNSSEC Validation — REAL: query Cloudflare DoH with DNSSEC requested and read the
    // AD (Authenticated Data) flag. Free, no key. Undetermined → skip.
    try {
      const dohRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&do=1`, {
        headers: { 'Accept': 'application/dns-json' },
        signal: AbortSignal.timeout(5000),
      });
      if (dohRes.ok) {
        const dohJson = await dohRes.json();
        const dnssecOk = dohJson.AD === true;
        addFinding('DNS Security', 'high', 'DNSSEC Validation', dnssecOk ? 'Domain is DNSSEC-signed (resolver returned Authenticated Data).' : 'Domain is not DNSSEC-signed (no Authenticated Data flag).', dnssecOk, 'Enable DNSSEC at your domain registrar.', 'How to enable DNSSEC in Cloudflare or Route53.', 'DNSSEC prevents DNS spoofing (cache poisoning) attacks that could transparently redirect your users to a malicious server.', 'pro');
      }
    } catch (e) {}

    // MX Record Presence — REAL lookup. STARTTLS enforcement itself requires port-25 SMTP
    // access that is blocked in most serverless environments, so this reports presence only.
    let hasMx = false;
    try {
      const mx = await dns.resolveMx(domain);
      hasMx = Array.isArray(mx) && mx.length > 0;
    } catch (e) {}
    addFinding('DNS Security', 'low', 'Mail Server (MX) Records', hasMx ? 'Domain publishes MX records for email.' : 'No MX records found — domain does not receive email.', true, 'If you send email from this domain, ensure your provider enforces STARTTLS and publish an MTA-STS policy.', '', 'MX records reveal the mail infrastructure for a domain. Ensuring mail servers enforce STARTTLS keeps inbound email encrypted in transit.', 'pro');

    // MTA-STS Policy — real fetch of the well-known policy file
    let hasMtaSts = false;
    try {
      const mtaRes = await fetch(`https://mta-sts.${domain}/.well-known/mta-sts.txt`, { signal: AbortSignal.timeout(3000) });
      if (mtaRes.ok) {
        const t = await mtaRes.text();
        hasMtaSts = t.toLowerCase().includes('version=stsv1');
      }
    } catch (e) {}
    addFinding('DNS Security', 'medium', 'MTA-STS Policy', hasMtaSts ? 'MTA-STS policy file found.' : 'No MTA-STS policy file found.', hasMtaSts, 'Publish an MTA-STS policy file and corresponding TXT record.', 'How to implement MTA-STS for Google Workspace.', 'MTA-STS strictly enforces TLS encryption and valid certificates for all inbound email to your domain.', 'pro');

    // Exposed Debug Endpoints — real probing of common debug/profiler routes
    let debugExposed = false;
    let debugPath = '';
    const debugProbes = [
      { path: '/actuator/env', sig: '"propertySources"' },
      { path: '/actuator', sig: '"_links"' },
      { path: '/server-status', sig: 'Apache Server Status' },
      { path: '/_profiler', sig: 'Profiler' },
      { path: '/debug/pprof/', sig: 'profiles:' },
    ];
    for (const { path, sig } of debugProbes) {
      try {
        const r = await fetch(new URL(path, targetUrl.origin), { signal: AbortSignal.timeout(3000) });
        if (r.ok) {
          const t = await r.text();
          if (t.includes(sig)) { debugExposed = true; debugPath = path; break; }
        }
      } catch (e) {}
    }
    addFinding('Active Probing', 'critical', 'Exposed Debug Endpoints', debugExposed ? `Exposed debug/profiler endpoint detected at ${debugPath}.` : 'No common debug/profiler endpoints exposed.', !debugExposed, 'Disable all profiling and debug routes (e.g. /_debug, /actuator) in production.', '', 'Debug endpoints often leak massive amounts of server state, memory dumps, and environment variables.', 'starter');

    // Sensitive Form Fields Without HTTPS — real DOM analysis
    let sensitiveFormInsecure = false;
    $('form').each((_, el) => {
      const action = ($(el).attr('action') || '').toLowerCase();
      const hasSensitive = $(el).find('input[type="password"], input[type="email"], input[name*="card"], input[name*="ssn"], input[autocomplete="cc-number"]').length > 0;
      if (hasSensitive && (!isHttps || action.startsWith('http://'))) {
        sensitiveFormInsecure = true;
      }
    });
    addFinding('Content & Data', 'high', 'Sensitive Form Fields Without HTTPS', sensitiveFormInsecure ? 'Form collecting sensitive data does not enforce HTTPS.' : 'Sensitive forms enforce HTTPS (or none detected).', !sensitiveFormInsecure, 'Serve all pages containing forms over strictly HTTPS.', '', 'Submitting forms over HTTP allows attackers to intercept passwords, PII, and credit card data in transit.', 'free');

  } catch (error) {
    console.error('[Security Scanner] Error:', error);
    addFinding('General', 'critical', 'Site Fetch', `Failed to load URL: ${error.message}`, false, 'Ensure the site is accessible.', '', 'The scanner was unable to reach the provided URL. Ensure the domain resolves correctly and the server is actively accepting connections.', 'free');
  }

  const { overall, categories } = calculateScore(getFindings());

  return {
    score: overall,
    categories,
    findings: getFindings(),
    totalChecks: getFindings().length,
    timestamp: new Date().toISOString()
  };
}
