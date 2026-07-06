import { fetchWithCheerio } from './shared/fetcher.js';
import { createFindingsCollector } from './shared/findings.js';
import { calculateScore } from './shared/scoring.js';
import dns from 'dns/promises';

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
      "HTTPS encrypts the communication between your user's browser and your server, protecting sensitive data from man-in-the-middle attacks and packet sniffing."
    );

    const { html, $, response, targetUrl } = await fetchWithCheerio(normalizedUrl);
    const headers = response.headers;
    const domain = targetUrl.hostname.replace(/^www\./, '');

    // --- Headers Security ---
    const csp = headers.get('content-security-policy');
    addFinding(
      'Headers', 'high', 'Content-Security-Policy',
      'Checks for the presence of a CSP header to mitigate XSS attacks.',
      !!csp,
      'Implement a strict CSP restricting sources for scripts, styles, and data.',
      'Add a strict CSP in next.config.js that allows scripts only from my domain.',
      'A Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks. It works by restricting the domains that the browser should consider to be valid sources of executable scripts.'
    );

    const xFrame = headers.get('x-frame-options');
    addFinding(
      'Headers', 'medium', 'X-Frame-Options',
      'Checks for X-Frame-Options to prevent Clickjacking.',
      !!xFrame,
      'Set X-Frame-Options to DENY or SAMEORIGIN.',
      'Add an X-Frame-Options: DENY header to my Next.js next.config.js file.',
      'The X-Frame-Options HTTP response header can be used to indicate whether or not a browser should be allowed to render a page in a <frame>, <iframe>, <embed> or <object>. Sites can use this to avoid clickjacking attacks, by ensuring that their content is not embedded into other sites.'
    );

    const hsts = headers.get('strict-transport-security');
    addFinding(
      'Headers', 'medium', 'Strict-Transport-Security',
      'Checks for HSTS header to ensure secure connections.',
      !!hsts,
      'Set Strict-Transport-Security to include max-age and includeSubDomains.',
      'How to add Strict-Transport-Security header in Next.js next.config.js.',
      'HTTP Strict Transport Security (HSTS) is a web security policy mechanism that helps to protect websites against man-in-the-middle attacks such as protocol downgrade attacks and cookie hijacking. It allows web servers to declare that web browsers should automatically interact with it using only HTTPS.'
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
      'Exposing server version details (e.g., "nginx/1.20.1" or "X-Powered-By: Express") allows attackers to quickly look up known vulnerabilities for your specific software stack, significantly reducing the time needed to breach your systems.'
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
      'A Web Application Firewall (WAF) filters, monitors, and blocks HTTP traffic to and from a web application. It protects against attacks such as cross-site forgery, cross-site-scripting (XSS), file inclusion, and SQL injection.'
    );

    const setCookie = headers.get('set-cookie');
    let cookieSecure = true;
    if (setCookie) {
      const lowerCookie = setCookie.toLowerCase();
      if (!lowerCookie.includes('secure') || !lowerCookie.includes('httponly')) {
        cookieSecure = false;
      }
    }
    addFinding(
      'Headers', 'high', 'Secure Cookies',
      'Checks if session cookies are protected with Secure and HttpOnly flags.',
      cookieSecure,
      'Ensure all sensitive cookies are marked HttpOnly and Secure.',
      'How to set HttpOnly and Secure flags on cookies in Next.js.',
      'The Secure attribute ensures the cookie is only sent over encrypted (HTTPS) requests. The HttpOnly attribute restricts access to the cookie from client-side scripts, preventing XSS attacks from stealing session tokens.'
    );

    try {
      const corsRes = await fetch(normalizedUrl, { headers: { 'Origin': 'https://evil.test' }, signal: AbortSignal.timeout(5000) });
      const allowOrigin = corsRes.headers.get('access-control-allow-origin');
      const isCorsVulnerable = allowOrigin === '*' || allowOrigin === 'https://evil.test';
      addFinding(
        'Headers', 'high', 'CORS Misconfiguration',
        'Tests if the server allows arbitrary cross-origin requests.',
        !isCorsVulnerable,
        'Restrict Access-Control-Allow-Origin to specific trusted domains.',
        'How to properly configure CORS in Next.js to prevent wildcard origin access.',
        'Cross-Origin Resource Sharing (CORS) is a mechanism that allows restricted resources on a web page to be requested from another domain. A wildcard or overly permissive CORS policy allows malicious sites to read your authenticated data.'
      );
    } catch (e) {}

    const hasStripeKey = /sk_live_[0-9a-zA-Z]{24,}/.test(html);
    const hasGoogleKey = /AIza[0-9A-Za-z-_]{35}/.test(html);
    addFinding(
      'Secrets', 'critical', 'Exposed API Keys',
      'Checks the raw HTML for common exposed secret patterns.',
      !(hasStripeKey || hasGoogleKey),
      'Move secrets to server-side environment variables.',
      'Find any exposed API keys in my React components and move them to server-side API routes.',
      'Hardcoded API keys inside client-side bundles (like HTML or JS files) can be easily scraped by anyone. Attackers can use these keys to impersonate your application, bypass billing limits, or access sensitive external services, leading to significant financial or data loss.'
    );

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
      'Using outdated JavaScript libraries with known vulnerabilities (CVEs) exposes your users to XSS or other client-side attacks. Attackers frequently scan for known outdated library signatures to exploit well-documented flaws.'
    );

    // DNS checks
    try {
      const txtRecords = await dns.resolveTxt(domain);
      const hasSpf = txtRecords.some(record => record.join('').includes('v=spf1'));
      addFinding(
        'DNS Security', 'medium', 'SPF Record',
        'Checks if the domain has an SPF record.',
        hasSpf,
        'Add a TXT record for SPF to your domain.',
        'Generate a standard SPF TXT record.',
        'Sender Policy Framework (SPF) is an email authentication method designed to detect forging sender addresses during the delivery of the email. It helps prevent spammers from sending messages on behalf of your domain, protecting your brand reputation.'
      );
    } catch (e) {
      addFinding('DNS Security', 'medium', 'SPF Record', 'Failed to resolve TXT records.', false, 'Add an SPF record.', '', 'Sender Policy Framework (SPF) is an email authentication method designed to detect forging sender addresses during the delivery of the email. It helps prevent spammers from sending messages on behalf of your domain, protecting your brand reputation.');
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
        'Domain-based Message Authentication, Reporting, and Conformance (DMARC) uses SPF and DKIM to provide instructions to the receiving mail server on what to do if an email fails authentication. It acts as a strict policy layer against email spoofing.'
      );
    } catch (e) {
      addFinding('DNS Security', 'medium', 'DMARC Record', 'Failed to resolve DMARC records.', false, 'Add a _dmarc TXT record.', '', 'Domain-based Message Authentication, Reporting, and Conformance (DMARC) uses SPF and DKIM to provide instructions to the receiving mail server on what to do if an email fails authentication. It acts as a strict policy layer against email spoofing.');
    }

    // Active Probing
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
      'Web servers sometimes misconfigure directory permissions, inadvertently exposing configuration files (.env), version control histories (.git), or backup files. These files often contain database passwords, secret keys, and source code which can lead to a full system compromise.'
    );

  } catch (error) {
    console.error('[Security Scanner] Error:', error);
    addFinding('General', 'critical', 'Site Fetch', `Failed to load URL: ${error.message}`, false, 'Ensure the site is accessible.', '', 'The scanner was unable to reach the provided URL. Ensure the domain resolves correctly and the server is actively accepting connections.');
  }

  const { overall, categories } = calculateScore(getFindings());

  return {
    score: overall,
    categories,
    findings: getFindings(),
    timestamp: new Date().toISOString()
  };
}
