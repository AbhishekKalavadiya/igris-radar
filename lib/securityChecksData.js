/**
 * Centralized Knowledge Base & Registry of Igris Radar Security Checks.
 * Contains the complete registry of 98 automated security checks across 8 categories.
 * Used across the Security Checks Directory, dynamic check detail pages,
 * landing page category tabs, and domain reports.
 */

export const CHECK_CATEGORIES = [
  { id: 'all', name: 'All Checks', icon: 'Shield', count: 98, desc: 'Complete registry of all 98 automated security checks included on every scan.' },
  { id: 'headers', name: 'Headers Security', icon: 'Shield', count: 18, desc: 'HTTP security headers protect against XSS, clickjacking, MIME sniffing, and browser-based vulnerabilities.' },
  { id: 'transport', name: 'SSL/TLS & Transport', icon: 'Lock', count: 12, desc: 'Cryptographic security, cipher strengths, certificate health, and protocol downgrade mitigation.' },
  { id: 'dns', name: 'DNS & Email Trust', icon: 'Server', count: 13, desc: 'Email spoofing defense, DNSSEC validation, CAA authority, and domain routing trust.' },
  { id: 'secrets', name: 'Secrets & Exposure', icon: 'FileText', count: 12, desc: 'Detection of leaked API keys, tokens, environment configs, database dumps, and source maps.' },
  { id: 'attack-surface', name: 'Active Probing & Surface', icon: 'Crosshair', count: 12, desc: 'Dangling CNAMEs, exposed admin panels, open ports, GraphQL endpoints, and attack surface discovery.' },
  { id: 'supply-chain', name: 'Supply Chain & Dependencies', icon: 'Package', count: 10, desc: 'Third-party script audit, vulnerable client-side libraries, subresource integrity (SRI), and CDN bloat.' },
  { id: 'client-auth', name: 'Auth & Client-Side Security', icon: 'Key', count: 12, desc: 'Session entropy, DOM XSS sink vulnerabilities, login encryption, and form security.' },
  { id: 'compliance', name: 'Compliance & Data Privacy', icon: 'CheckCircle2', count: 9, desc: 'Readiness indicators for OWASP Top 10, GDPR, SOC 2, and PCI DSS compliance standards.' },
];

export const SECURITY_CHECKS = [
  {
    "slug": "content-security-policy-csp",
    "name": "Content Security Policy (CSP)",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "critical",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Restricts sources from which scripts, styles, and assets can load to prevent XSS and code injection.",
    "whyItMatters": "Cross-Site Scripting (XSS) allows attackers to steal user session cookies, log keystrokes, and execute unauthorized actions. A strict CSP provides essential defense-in-depth even if an input sanitization flaw exists.",
    "howWeCheck": "We evaluate Content-Security-Policy headers for missing directives (default-src, script-src, object-src, frame-ancestors) and dangerous wildcards or 'unsafe-inline' tokens.",
    "fixes": {
      "nginx": "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'nonce-$request_id'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self';\" always;",
      "apache": "Header set Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-ancestors 'none';\"",
      "cloudflare": "// Cloudflare Transform Rule -> Modify Response Header: Content-Security-Policy",
      "nextjs": "// next.config.mjs\nexport default { async headers() { return [{ source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: \"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';\" }] }]; } };"
    },
    "faqs": [
      {
        "q": "Why is unsafe-inline flagged in CSP?",
        "a": "Because it allows malicious scripts injected into DOM innerHTML or HTML attributes to run without restriction."
      }
    ],
    "relatedSlugs": [
      "strict-transport-security-hsts",
      "x-frame-options",
      "permissions-policy"
    ]
  },
  {
    "slug": "strict-transport-security-hsts",
    "name": "HSTS Enabled (Strict-Transport-Security)",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "critical",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Tells browsers to only access your site over HTTPS, preventing protocol downgrade attacks.",
    "whyItMatters": "Protects users against SSL-stripping and man-in-the-middle network tampering on insecure networks like airport or cafe Wi-Fi.",
    "howWeCheck": "We verify the Strict-Transport-Security header has a max-age of at least 31536000 seconds (1 year) and includes the includeSubDomains directive.",
    "fixes": {
      "nginx": "add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" always;",
      "apache": "Header always set Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\"",
      "cloudflare": "Enable HSTS in SSL/TLS -> Edge Certificates with max-age 12+ months and preload enabled.",
      "nextjs": "// next.config.mjs: Add Strict-Transport-Security header with max-age=63072000"
    },
    "faqs": [
      {
        "q": "What is HSTS preloading?",
        "a": "Preloading submits your domain to a hardcoded browser list baked into Chrome, Firefox, and Safari so even the first visit is HTTPS."
      }
    ],
    "relatedSlugs": [
      "hsts-preload-eligibility",
      "https-enforcement",
      "tls-version"
    ]
  },
  {
    "slug": "hsts-preload-eligibility",
    "name": "HSTS Preload Eligibility",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Verifies if your HSTS configuration meets Chromium preload requirements (max-age ≥ 1 year, subdomains, preload).",
    "whyItMatters": "Without preloading, a user’s initial visit is vulnerable to SSL-stripping before the browser receives the HSTS response header.",
    "howWeCheck": "We check whether max-age is at least 31536000, includeSubDomains is declared, and the preload token is present on the root apex domain.",
    "fixes": {
      "nginx": "add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" always;",
      "apache": "Header always set Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\"",
      "cloudflare": "Cloudflare SSL/TLS -> Edge Certificates -> Enable HSTS Preload",
      "nextjs": "Add header: Strict-Transport-Security: max-age=63072000; includeSubDomains; preload"
    },
    "faqs": [
      {
        "q": "Can I remove my domain from HSTS preload later?",
        "a": "Removal from browser preload lists can take months to propagate to all end-user browsers."
      }
    ],
    "relatedSlugs": [
      "strict-transport-security-hsts",
      "https-enforcement"
    ]
  },
  {
    "slug": "x-frame-options",
    "name": "Frame Security Policy (X-Frame-Options)",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "high",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Controls whether your page can be embedded in iframes on other sites, protecting against clickjacking.",
    "whyItMatters": "Clickjacking deceives users into clicking hidden buttons or sensitive actions (e.g. wire transfers or profile deletion) overlaid inside transparent iframes.",
    "howWeCheck": "We check for X-Frame-Options set to DENY or SAMEORIGIN, or CSP frame-ancestors directive.",
    "fixes": {
      "nginx": "add_header X-Frame-Options \"DENY\" always;",
      "apache": "Header always set X-Frame-Options \"DENY\"",
      "cloudflare": "Add Response Header X-Frame-Options: DENY",
      "nextjs": "// next.config.mjs: { key: 'X-Frame-Options', value: 'DENY' }"
    },
    "faqs": [
      {
        "q": "Is X-Frame-Options deprecated in favor of CSP?",
        "a": "CSP frame-ancestors is more modern, but setting X-Frame-Options: DENY ensures legacy browser protection."
      }
    ],
    "relatedSlugs": [
      "content-security-policy-csp",
      "cors-misconfiguration"
    ]
  },
  {
    "slug": "x-content-type-options",
    "name": "X-Content-Type-Options Header",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Prevents browsers from MIME-sniffing a response away from the declared content-type, stopping script execution from uploads.",
    "whyItMatters": "If an attacker uploads an image file containing JavaScript, MIME-sniffing could execute it as executable code in the victim’s browser.",
    "howWeCheck": "We check if X-Content-Type-Options is sent with the exact value nosniff.",
    "fixes": {
      "nginx": "add_header X-Content-Type-Options \"nosniff\" always;",
      "apache": "Header always set X-Content-Type-Options \"nosniff\"",
      "cloudflare": "Add Response Header X-Content-Type-Options: nosniff",
      "nextjs": "// next.config.mjs: { key: 'X-Content-Type-Options', value: 'nosniff' }"
    },
    "faqs": [
      {
        "q": "What is MIME-sniffing?",
        "a": "MIME-sniffing is when a browser inspects file bytes instead of relying on the Content-Type header to guess its type."
      }
    ],
    "relatedSlugs": [
      "content-security-policy-csp",
      "referrer-policy"
    ]
  },
  {
    "slug": "permissions-policy",
    "name": "Permissions-Policy Header",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Controls which browser features (camera, microphone, geolocation, payment) can be used on your page and in iframes.",
    "whyItMatters": "Restricts third-party widgets or compromised scripts from silently tapping into user cameras, microphones, or geolocation APIs.",
    "howWeCheck": "We verify the existence of the Permissions-Policy header and check that sensitive capabilities (camera, microphone, geolocation) are restricted.",
    "fixes": {
      "nginx": "add_header Permissions-Policy \"camera=(), microphone=(), geolocation=(), payment=()\" always;",
      "apache": "Header always set Permissions-Policy \"camera=(), microphone=(), geolocation=(), payment=()\"",
      "cloudflare": "Add Response Header Permissions-Policy: camera=(), microphone=(), geolocation=()",
      "nextjs": "// next.config.mjs: { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }"
    },
    "faqs": [
      {
        "q": "What happened to Feature-Policy?",
        "a": "Feature-Policy is the deprecated predecessor to Permissions-Policy."
      }
    ],
    "relatedSlugs": [
      "content-security-policy-csp",
      "referrer-policy"
    ]
  },
  {
    "slug": "referrer-policy",
    "name": "Referrer-Policy Header",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Governs how much referrer information (including URLs and sensitive query parameters) is sent when navigating away.",
    "whyItMatters": "URLs frequently contain private session tokens, reset links, or user identifiers. An insecure referrer policy leaks these to third-party domains.",
    "howWeCheck": "We verify that Referrer-Policy is set to strict-origin-when-cross-origin, no-referrer, or same-origin.",
    "fixes": {
      "nginx": "add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;",
      "apache": "Header always set Referrer-Policy \"strict-origin-when-cross-origin\"",
      "cloudflare": "Add Response Header Referrer-Policy: strict-origin-when-cross-origin",
      "nextjs": "// next.config.mjs: { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }"
    },
    "faqs": [
      {
        "q": "Which Referrer-Policy is recommended for modern web apps?",
        "a": "strict-origin-when-cross-origin provides a great balance of privacy and analytics."
      }
    ],
    "relatedSlugs": [
      "permissions-policy",
      "content-security-policy-csp"
    ]
  },
  {
    "slug": "secure-cookies",
    "name": "Set-Cookie Headers (Secure, HttpOnly, SameSite)",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "critical",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Cookie security attributes (Secure, HttpOnly, SameSite) protect session cookies from theft and cross-site attacks.",
    "whyItMatters": "Without HttpOnly, malicious XSS scripts can read session cookies. Without Secure, cookies can be transmitted in plaintext HTTP.",
    "howWeCheck": "We inspect all Set-Cookie response headers to ensure Secure, HttpOnly, and SameSite=Lax|Strict attributes are declared.",
    "fixes": {
      "nginx": "proxy_cookie_flags ~ secure httponly samesite=lax;",
      "apache": "Header always edit Set-Cookie ^(.*)$ \"$1; Secure; HttpOnly; SameSite=Lax\"",
      "cloudflare": "Configure cookie attributes in edge worker or origin application",
      "nextjs": "// In Next.js cookies().set({ name, value, secure: true, httpOnly: true, sameSite: 'lax' })"
    },
    "faqs": [
      {
        "q": "What is the difference between SameSite=Lax and SameSite=Strict?",
        "a": "Lax permits safe top-level navigations (like following a link), while Strict blocks cookies on all cross-site requests."
      }
    ],
    "relatedSlugs": [
      "cookie-prefix-hardening",
      "cors-misconfiguration"
    ]
  },
  {
    "slug": "cookie-prefix-hardening",
    "name": "Cookie Prefix Hardening (__Host- and __Secure-)",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "low",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Validates that sensitive authentication tokens leverage browser cookie prefixes (__Host- or __Secure-) to prevent cookie tossing.",
    "whyItMatters": "Cookie prefixes instruct the browser to refuse cookie modifications from subdomains or non-secure origins.",
    "howWeCheck": "We inspect session cookies to verify if prefixes (__Host- or __Secure-) are utilized for high-value tokens.",
    "fixes": {
      "nginx": "# Use prefixed cookie names in your application layer: __Host-session_id",
      "apache": "# Prefix session identifiers with __Host- in application code",
      "cloudflare": "Set cookie name to __Host-session in origin response",
      "nextjs": "cookies().set({ name: '__Host-session', value: token, secure: true, path: '/' })"
    },
    "faqs": [
      {
        "q": "What restrictions does __Host- enforce?",
        "a": "It must be set with Secure, path=/, and without a Domain attribute, binding it exclusively to the host origin."
      }
    ],
    "relatedSlugs": [
      "secure-cookies",
      "cors-misconfiguration"
    ]
  },
  {
    "slug": "cors-misconfiguration",
    "name": "CORS Misconfiguration & Wildcard Audit",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "high",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Detects overly permissive Access-Control-Allow-Origin headers or null origins that expose authenticated APIs to cross-origin attackers.",
    "whyItMatters": "A misconfigured CORS policy with Access-Control-Allow-Origin: * alongside credentials allows malicious external websites to read private user data.",
    "howWeCheck": "We send cross-origin probe requests with spoofed Origin headers (e.g. evil.com, null) and analyze whether the server mirrors the origin.",
    "fixes": {
      "nginx": "if ($http_origin ~* \"^https://(app|admin).example.com$\") { add_header Access-Control-Allow-Origin \"$http_origin\"; }",
      "apache": "SetEnvIf Origin \"^https://(app|admin).example.com$\" CORS_ORIGIN=$0\nHeader always set Access-Control-Allow-Origin %{CORS_ORIGIN}e env=CORS_ORIGIN",
      "cloudflare": "Use Cloudflare Workers to validate Origin against an allowlist.",
      "nextjs": "// Implement an explicit origin allowlist in middleware.ts"
    },
    "faqs": [
      {
        "q": "Why is Access-Control-Allow-Origin: * dangerous on authenticated endpoints?",
        "a": "It permits any third-party website visited by a user to query your API and read confidential responses."
      }
    ],
    "relatedSlugs": [
      "secure-cookies",
      "cross-origin-isolation"
    ]
  },
  {
    "slug": "cross-origin-isolation",
    "name": "Cross-Origin Resource Isolation (COOP, COEP, CORP)",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Evaluates COOP (Cross-Origin-Opener-Policy) and COEP headers to isolate your browsing context from Spectre-like side-channel attacks.",
    "whyItMatters": "Cross-origin isolation prevents other browser tabs from accessing memory objects and unlocks high-resolution timers (SharedArrayBuffer).",
    "howWeCheck": "We check for Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp headers.",
    "fixes": {
      "nginx": "add_header Cross-Origin-Opener-Policy \"same-origin\" always;\nadd_header Cross-Origin-Embedder-Policy \"require-corp\" always;",
      "apache": "Header always set Cross-Origin-Opener-Policy \"same-origin\"\nHeader always set Cross-Origin-Embedder-Policy \"require-corp\"",
      "cloudflare": "Add Response Headers: Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Embedder-Policy: require-corp",
      "nextjs": "// Add COOP and COEP to next.config.mjs headers"
    },
    "faqs": [
      {
        "q": "Does COOP prevent tab-nabbing?",
        "a": "Yes. Setting COOP to same-origin severs window.opener references from cross-origin tabs."
      }
    ],
    "relatedSlugs": [
      "cors-misconfiguration",
      "x-frame-options"
    ]
  },
  {
    "slug": "server-info-disclosure",
    "name": "Server Information Disclosure",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "low",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Checks if Server or X-Powered-By headers reveal software versions (e.g. Apache/2.4.41, PHP/7.4.3), aiding attacker reconnaissance.",
    "whyItMatters": "Advertising exact web server versions helps attackers search CVE databases for unpatched vulnerabilities.",
    "howWeCheck": "We inspect the Server and X-Powered-By response headers for version numbers and framework identifiers.",
    "fixes": {
      "nginx": "server_tokens off; # /etc/nginx/nginx.conf",
      "apache": "ServerTokens Prod\nServerSignature Off",
      "cloudflare": "// Cloudflare hides Apache/Nginx version banners automatically behind the proxy",
      "nextjs": "// next.config.mjs:\nexport default { poweredByHeader: false };"
    },
    "faqs": [
      {
        "q": "Is hiding server banners true security?",
        "a": "It is defense-in-depth: it stops automated bot scans from targeting known version exploits."
      }
    ],
    "relatedSlugs": [
      "x-powered-by-removal",
      "error-page-information-leakage"
    ]
  },
  {
    "slug": "x-powered-by-removal",
    "name": "X-Powered-By Header Stripping",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "low",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Ensures frameworks like Express, Next.js, or PHP do not emit X-Powered-By fingerprint headers in responses.",
    "whyItMatters": "Disclosing the application runtime (e.g., Express, Next.js, ASP.NET) simplifies reconnaissance for targeted exploits.",
    "howWeCheck": "We verify that no X-Powered-By header is returned in HTTP responses.",
    "fixes": {
      "nginx": "proxy_hide_header X-Powered-By;",
      "apache": "Header always unset X-Powered-By",
      "cloudflare": "Cloudflare Transform Rule -> Remove Header: X-Powered-By",
      "nextjs": "// next.config.mjs\nexport default { poweredByHeader: false };"
    },
    "faqs": [
      {
        "q": "Does Next.js emit X-Powered-By by default?",
        "a": "Yes, Next.js sets \"X-Powered-By: Next.js\" unless disabled with poweredByHeader: false."
      }
    ],
    "relatedSlugs": [
      "server-info-disclosure",
      "cache-control-sensitive"
    ]
  },
  {
    "slug": "cache-control-sensitive",
    "name": "Cache-Control for Sensitive Endpoints",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Ensures authenticated and sensitive endpoints return Cache-Control: no-store to prevent caching on shared proxy servers.",
    "whyItMatters": "Public or intermediary caches storing private account responses can expose personal data to other users.",
    "howWeCheck": "We analyze Cache-Control headers on user profiles and API routes for no-store, no-cache, must-revalidate directives.",
    "fixes": {
      "nginx": "add_header Cache-Control \"no-store, no-cache, must-revalidate, max-age=0\" always;",
      "apache": "Header always set Cache-Control \"no-store, no-cache, must-revalidate, max-age=0\"",
      "cloudflare": "Set Edge Cache TTL to 0 for authenticated paths in Page Rules",
      "nextjs": "res.setHeader('Cache-Control', 'no-store, max-age=0');"
    },
    "faqs": [
      {
        "q": "What does no-store do?",
        "a": "It instructs both browser caches and intermediate proxies never to save any copy of the response."
      }
    ],
    "relatedSlugs": [
      "server-info-disclosure",
      "secure-cookies"
    ]
  },
  {
    "slug": "deprecated-x-xss-protection",
    "name": "Deprecated X-XSS-Protection Header",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "low",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Checks that legacy X-XSS-Protection is set to 0 or removed to prevent browser XSS auditor vulnerabilities.",
    "whyItMatters": "The legacy XSS auditor in older browsers introduced security vulnerabilities and unintended side-channel leaks. Modern standard is CSP.",
    "howWeCheck": "We check if X-XSS-Protection is either absent or set to 0 rather than 1; mode=block.",
    "fixes": {
      "nginx": "add_header X-XSS-Protection \"0\" always;",
      "apache": "Header always set X-XSS-Protection \"0\"",
      "cloudflare": "Add Response Header X-XSS-Protection: 0",
      "nextjs": "// Set X-XSS-Protection: 0 in next.config.mjs"
    },
    "faqs": [
      {
        "q": "Why shouldn’t I use X-XSS-Protection: 1; mode=block?",
        "a": "Modern browsers have deprecated the built-in auditor, and older implementations could be abused to block legitimate scripts."
      }
    ],
    "relatedSlugs": [
      "content-security-policy-csp",
      "x-content-type-options"
    ]
  },
  {
    "slug": "reporting-endpoints",
    "name": "Reporting-Endpoints & NEL Header",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "low",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Inspects Reporting-Endpoints and Network Error Logging (NEL) headers for automated real-time security violation reporting.",
    "whyItMatters": "Reporting endpoints allow you to receive automated reports when users encounter CSP violations or network hijacking attempts.",
    "howWeCheck": "We look for Reporting-Endpoints and Report-To headers in the response.",
    "fixes": {
      "nginx": "add_header Reporting-Endpoints 'main-endpoint=\"https://example.report-uri.com/r/d/csp/enforce\"';",
      "apache": "Header always set Reporting-Endpoints 'main-endpoint=\"https://example.report-uri.com/r/d/csp/enforce\"'",
      "cloudflare": "Configure Reporting-Endpoints in Cloudflare Transform Rules",
      "nextjs": "// Include Reporting-Endpoints in headers list"
    },
    "faqs": [
      {
        "q": "What is NEL?",
        "a": "Network Error Logging allows browsers to report TLS and DNS failures even when the user cannot reach your web server."
      }
    ],
    "relatedSlugs": [
      "content-security-policy-csp",
      "hsts-preload-eligibility"
    ]
  },
  {
    "slug": "content-type-header",
    "name": "Content-Type Header & Charset Declaration",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "low",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Ensures all HTML/API responses specify an explicit Content-Type with charset=utf-8 to prevent UTF-7 encoding bypasses.",
    "whyItMatters": "Omitting charset declarations can allow legacy encoding attacks where UTF-7 payloads bypass input filters.",
    "howWeCheck": "We check that responses return Content-Type: text/html; charset=utf-8 or application/json; charset=utf-8.",
    "fixes": {
      "nginx": "charset utf-8;",
      "apache": "AddDefaultCharset UTF-8",
      "cloudflare": "Default charset is configured on origin web server",
      "nextjs": "// Next.js automatically outputs utf-8 Content-Type headers"
    },
    "faqs": [
      {
        "q": "Why is UTF-7 an issue?",
        "a": "UTF-7 represents angle brackets and quotes without standard characters, historically bypassing basic XSS filters."
      }
    ],
    "relatedSlugs": [
      "x-content-type-options",
      "content-security-policy-csp"
    ]
  },
  {
    "slug": "trusted-types-readiness",
    "name": "Trusted Types Readiness (DOM XSS Protection)",
    "category": "headers",
    "categoryName": "Headers Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Shield",
    "shortDesc": "Evaluates CSP require-trusted-types-for directive to prevent DOM-based XSS by enforcing typed objects.",
    "whyItMatters": "Trusted Types lock down dangerous DOM sinks (like element.innerHTML) so raw strings cannot be passed without sanitization policies.",
    "howWeCheck": "We look for require-trusted-types-for 'script' in the Content-Security-Policy header.",
    "fixes": {
      "nginx": "add_header Content-Security-Policy \"require-trusted-types-for 'script'; trusted-types default;\" always;",
      "apache": "Header set Content-Security-Policy \"require-trusted-types-for 'script'; trusted-types default;\"",
      "cloudflare": "Add require-trusted-types-for 'script' to Cloudflare CSP rule",
      "nextjs": "// Add require-trusted-types-for 'script' to CSP in next.config.mjs"
    },
    "faqs": [
      {
        "q": "What browsers support Trusted Types?",
        "a": "Chromium browsers (Chrome, Edge) support Trusted Types natively."
      }
    ],
    "relatedSlugs": [
      "content-security-policy-csp",
      "dom-based-xss"
    ]
  },
  {
    "slug": "https-enforcement",
    "name": "HTTPS Enforced (301 Redirect)",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "critical",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Ensures the root domain and all HTTP traffic permanently redirects (301) to an encrypted HTTPS connection.",
    "whyItMatters": "Serving any pages over unencrypted HTTP exposes credentials, session cookies, and user communications to packet sniffing.",
    "howWeCheck": "We send a plain HTTP request to port 80 and verify a 301/308 redirect to https://.",
    "fixes": {
      "nginx": "server { listen 80 default_server; return 301 https://$host$request_uri; }",
      "apache": "RewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]",
      "cloudflare": "Enable \"Always Use HTTPS\" in Cloudflare SSL/TLS -> Edge Certificates.",
      "nextjs": "// Handle at reverse proxy / load balancer level"
    },
    "faqs": [
      {
        "q": "Should I use 301 or 302 redirect for HTTPS?",
        "a": "Use 301 (Permanent Redirect) so browsers cache the redirect and search engines index the HTTPS URL."
      }
    ],
    "relatedSlugs": [
      "strict-transport-security-hsts",
      "tls-version",
      "ssl-certificate-expiry"
    ]
  },
  {
    "slug": "tls-version",
    "name": "Modern TLS Version (TLS 1.2+ / TLS 1.3)",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "critical",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Ensures support for TLS 1.2 and modern TLS 1.3 protocols while disabling insecure legacy standards (TLS 1.0, 1.1, SSLv3).",
    "whyItMatters": "Legacy SSL/TLS protocols have known cryptographic vulnerabilities (BEAST, POODLE) and fail PCI DSS compliance.",
    "howWeCheck": "We negotiate TLS handshakes and verify support for TLS 1.2 and 1.3 while confirming older protocols are rejected.",
    "fixes": {
      "nginx": "ssl_protocols TLSv1.2 TLSv1.3;\nssl_prefer_server_ciphers off;",
      "apache": "SSLProtocol -all +TLSv1.2 +TLSv1.3",
      "cloudflare": "Cloudflare SSL/TLS -> Edge Certificates -> Minimum TLS Version: TLS 1.2, Enable TLS 1.3.",
      "nextjs": "Managed at CDN/reverse-proxy layer."
    },
    "faqs": [
      {
        "q": "Why is TLS 1.3 superior?",
        "a": "TLS 1.3 reduces handshake latency to 1 RTT (or 0 RTT) and removes obsolete cryptographic ciphers."
      }
    ],
    "relatedSlugs": [
      "https-enforcement",
      "ocsp-stapling",
      "cipher-suite-audit"
    ]
  },
  {
    "slug": "ssl-certificate-expiry",
    "name": "SSL Certificate Expiry Monitoring",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "critical",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Tracks certificate expiration dates and triggers alerts before certificates lapse, avoiding browser security warnings.",
    "whyItMatters": "An expired certificate causes immediate full-screen security warnings, destroying user trust and dropping web traffic.",
    "howWeCheck": "We parse the peer certificate validity dates and calculate days remaining until expiration (warning below 30 days, critical below 14 days).",
    "fixes": {
      "nginx": "certbot renew --dry-run # Set up automated Let's Encrypt cron renewal",
      "apache": "certbot renew # Enable systemd timer certbot.timer",
      "cloudflare": "Universal SSL renews automatically on Cloudflare edge.",
      "nextjs": "Managed automatically by Vercel or your hosting CDN."
    },
    "faqs": [
      {
        "q": "How often should SSL certificates renew?",
        "a": "Modern certificates have a maximum validity of 398 days (and standard Let’s Encrypt renews every 60–90 days)."
      }
    ],
    "relatedSlugs": [
      "self-signed-certificate",
      "ssl-certificate-chain"
    ]
  },
  {
    "slug": "self-signed-certificate",
    "name": "Self-Signed Certificate Detection",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "critical",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Verifies the certificate is issued by a globally trusted Certificate Authority (CA) rather than self-signed.",
    "whyItMatters": "Self-signed certificates trigger browser security blocks (NET::ERR_CERT_AUTHORITY_INVALID) and fail zero-trust validation.",
    "howWeCheck": "We verify the certificate chain resolves to a recognized root CA in the Mozilla CA store.",
    "fixes": {
      "nginx": "certbot --nginx -d yourdomain.com",
      "apache": "certbot --apache -d yourdomain.com",
      "cloudflare": "Enable Cloudflare Universal SSL for instant trusted certificates.",
      "nextjs": "Ensure your custom domain in Vercel/Netlify has completed DNS verification."
    },
    "faqs": [
      {
        "q": "Are free certificates from Let’s Encrypt trusted by all browsers?",
        "a": "Yes, Let’s Encrypt is trusted by all major browsers, operating systems, and mobile devices."
      }
    ],
    "relatedSlugs": [
      "ssl-certificate-expiry",
      "ssl-certificate-chain"
    ]
  },
  {
    "slug": "ssl-certificate-chain",
    "name": "SSL Certificate Chain Validation",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "high",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Checks whether intermediate certificates are properly bundled so mobile and legacy clients can verify trust.",
    "whyItMatters": "If intermediate certificates are missing, desktop browsers may cache them while mobile devices throw SSL handshake errors.",
    "howWeCheck": "We inspect the full certificate bundle served during TLS handshake to ensure intermediate CA certificates are present.",
    "fixes": {
      "nginx": "ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem; # Use fullchain, not cert.pem",
      "apache": "SSLCertificateChainFile /path/to/intermediate.pem # or SSLCertificateFile fullchain.pem",
      "cloudflare": "Cloudflare automatically handles full certificate bundles.",
      "nextjs": "Managed automatically by CDN edge."
    },
    "faqs": [
      {
        "q": "Why did my desktop browser work but mobile phone failed?",
        "a": "Desktop browsers often perform AIA fetching to find missing intermediates, whereas mobile browsers do not."
      }
    ],
    "relatedSlugs": [
      "self-signed-certificate",
      "ssl-certificate-expiry"
    ]
  },
  {
    "slug": "certificate-key-strength",
    "name": "Cryptographic Key Strength (RSA 2048+ / ECC)",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "medium",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Checks public key modulus size (RSA ≥ 2048-bit, ECC ≥ 256-bit) to withstand brute-force cryptanalysis.",
    "whyItMatters": "RSA keys shorter than 2048 bits are vulnerable to factorization by state-level attackers and cloud computing clusters.",
    "howWeCheck": "We extract the public key algorithm and bit length from the peer certificate.",
    "fixes": {
      "nginx": "openssl req -new -newkey rsa:2048 -nodes -keyout privkey.pem",
      "apache": "Use 2048-bit or 4096-bit RSA keys, or ECDSA prime256v1.",
      "cloudflare": "Select ECDSA or RSA 2048 in Cloudflare Edge Certificate settings.",
      "nextjs": "Handled by modern hosting providers."
    },
    "faqs": [
      {
        "q": "Is ECDSA better than RSA?",
        "a": "ECDSA provides equivalent security to RSA 3072-bit with a much smaller key size (256 bits), yielding faster handshakes."
      }
    ],
    "relatedSlugs": [
      "ssl-certificate-chain",
      "cipher-suite-audit"
    ]
  },
  {
    "slug": "ocsp-stapling",
    "name": "OCSP Stapling (Certificate Revocation)",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "medium",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Checks if the web server pre-fetches and caches SSL revocation status to optimize connection speed and user privacy.",
    "whyItMatters": "Without OCSP stapling, the browser must query the CA directly on every visit, adding 100ms+ latency and leaking browsing data.",
    "howWeCheck": "We request OCSP status (status_request) during the TLS handshake and check for a signed OCSP response.",
    "fixes": {
      "nginx": "ssl_stapling on;\nssl_stapling_verify on;\nresolver 1.1.1.1 8.8.8.8 valid=300s;",
      "apache": "SSLUseStapling on\nSSLStaplingCache \"shmcb:logs/ssl_stapling(32768)\"",
      "cloudflare": "Enabled automatically by default on Cloudflare edge.",
      "nextjs": "Handled by hosting edge reverse-proxy."
    },
    "faqs": [
      {
        "q": "Does OCSP stapling improve load speed?",
        "a": "Yes, it eliminates round-trips to third-party CA revocation endpoints."
      }
    ],
    "relatedSlugs": [
      "tls-version",
      "ssl-certificate-expiry"
    ]
  },
  {
    "slug": "certificate-transparency",
    "name": "Certificate Transparency (CT) Logs",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "medium",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Queries crt.sh to verify that all active certificates are logged publicly to detect unauthorized issuance.",
    "whyItMatters": "Certificate Transparency prevents rogue or compromised CAs from issuing invisible fake certificates for your domain.",
    "howWeCheck": "We query public CT log registries (e.g. crt.sh) and check for Signed Certificate Timestamps (SCTs) in the TLS handshake.",
    "fixes": {
      "nginx": "ssl_ct on; # or ensure CA submits to CT logs (Let's Encrypt and DigiCert do this automatically)",
      "apache": "Ensure certificates are issued by modern CAs complying with RFC 6962.",
      "cloudflare": "Cloudflare submits all certificates to public CT logs automatically.",
      "nextjs": "Standard CAs automatically publish to CT logs."
    },
    "faqs": [
      {
        "q": "What happens if a certificate is not logged to CT?",
        "a": "Modern Chrome and Safari browsers will reject the certificate and display an untrusted warning."
      }
    ],
    "relatedSlugs": [
      "ssl-certificate-chain",
      "subdomain-exposure"
    ]
  },
  {
    "slug": "mixed-content-detection",
    "name": "Mixed Content Detection (HTTP in HTTPS)",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "high",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Scans for insecure http:// script, image, stylesheet, and iframe embeds loaded on an HTTPS page.",
    "whyItMatters": "Mixed active content (scripts/stylesheets) completely breaks HTTPS protection by allowing network attackers to modify page behavior.",
    "howWeCheck": "We parse all DOM resource URLs (src, href, action) and flag any referencing unencrypted http://.",
    "fixes": {
      "nginx": "add_header Content-Security-Policy \"upgrade-insecure-requests;\" always;",
      "apache": "Header set Content-Security-Policy \"upgrade-insecure-requests;\"",
      "cloudflare": "Enable \"Automatic HTTPS Rewrites\" in Cloudflare SSL/TLS dashboard.",
      "nextjs": "Update all asset URLs to use https:// or protocol-relative / path."
    },
    "faqs": [
      {
        "q": "What is upgrade-insecure-requests?",
        "a": "It instructs the browser to automatically upgrade all http:// URLs to https:// before requesting them."
      }
    ],
    "relatedSlugs": [
      "https-enforcement",
      "content-security-policy-csp"
    ]
  },
  {
    "slug": "http2-alpn-support",
    "name": "HTTP/2 & ALPN Protocol Negotiation",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "low",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Verifies the server supports HTTP/2 protocol via ALPN negotiation for multiplexed, secure connections.",
    "whyItMatters": "HTTP/2 multiplexing prevents head-of-line blocking and enforces stronger cipher suite requirements.",
    "howWeCheck": "We send ALPN tokens (h2, http/1.1) in ClientHello and inspect the negotiated ALPN protocol.",
    "fixes": {
      "nginx": "listen 443 ssl http2;",
      "apache": "Protocols h2 http/1.1",
      "cloudflare": "HTTP/2 is enabled by default in Cloudflare Network settings.",
      "nextjs": "Supported natively on Vercel and modern edge platforms."
    },
    "faqs": [
      {
        "q": "Does HTTP/2 require TLS?",
        "a": "All major web browsers require TLS for HTTP/2."
      }
    ],
    "relatedSlugs": [
      "tls-version",
      "https-enforcement"
    ]
  },
  {
    "slug": "cipher-suite-audit",
    "name": "Insecure Cipher Suite Audit",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "high",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Audits server cipher suites to ensure insecure algorithms (RC4, 3DES, CBC, MD5) are disabled.",
    "whyItMatters": "Weak ciphers allow eavesdroppers to decrypt intercepted traffic retroactively using known cryptanalytic exploits.",
    "howWeCheck": "We test cipher suite negotiation and verify the absence of RC4, 3DES, export ciphers, and NULL ciphers.",
    "fixes": {
      "nginx": "ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';",
      "apache": "SSLCipherSuite HIGH:!aNULL:!MD5:!3DES:!RC4",
      "cloudflare": "Cloudflare edge manages modern, secure cipher suites automatically.",
      "nextjs": "Managed at CDN / reverse proxy."
    },
    "faqs": [
      {
        "q": "What is Forward Secrecy?",
        "a": "Ephemeral Diffie-Hellman keys (PFS) ensure past sessions cannot be decrypted even if the server private key is leaked later."
      }
    ],
    "relatedSlugs": [
      "tls-version",
      "certificate-key-strength"
    ]
  },
  {
    "slug": "forward-secrecy-support",
    "name": "Perfect Forward Secrecy (PFS)",
    "category": "transport",
    "categoryName": "SSL/TLS & Transport",
    "severity": "medium",
    "tier": "free",
    "icon": "Lock",
    "shortDesc": "Ensures TLS handshakes negotiate ECDHE or DHE key exchanges so compromised private keys cannot decrypt recorded past traffic.",
    "whyItMatters": "Without forward secrecy, an attacker who records encrypted traffic today and steals the private key years later can decrypt all historical communications.",
    "howWeCheck": "We verify that negotiated cipher suites use ECDHE or DHE key exchange mechanisms.",
    "fixes": {
      "nginx": "ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;",
      "apache": "SSLHonorCipherOrder on\nSSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256",
      "cloudflare": "Forward secrecy is enforced by default on all Cloudflare SSL certificates.",
      "nextjs": "Standard configuration on modern CDNs."
    },
    "faqs": [
      {
        "q": "Is RSA key exchange forward secret?",
        "a": "No. Static RSA key exchange does not provide forward secrecy, which is why it was removed in TLS 1.3."
      }
    ],
    "relatedSlugs": [
      "cipher-suite-audit",
      "tls-version"
    ]
  },
  {
    "slug": "spf-record",
    "name": "SPF Record Validation",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "medium",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Validates that your domain publishes an active Sender Policy Framework (SPF) record to authorize legitimate outbound mail servers.",
    "whyItMatters": "Without SPF, spammers can send forged phishing emails appearing to originate directly from your company domain.",
    "howWeCheck": "We query DNS TXT records for v=spf1 declarations and inspect include directives.",
    "fixes": {
      "nginx": "# DNS TXT Record at root apex:\nv=spf1 include:_spf.google.com ~all",
      "apache": "# Configure in your DNS management console (Cloudflare, Route53, Namecheap)",
      "cloudflare": "Add TXT record: Name: @, Content: v=spf1 include:_spf.google.com ~all",
      "nextjs": "# Configured via your domain DNS registrar"
    },
    "faqs": [
      {
        "q": "What happens if I have multiple SPF records?",
        "a": "Having multiple SPF records is invalid according to RFC 7208 and causes mail servers to reject all emails."
      }
    ],
    "relatedSlugs": [
      "spf-policy-strength",
      "dmarc-record",
      "dkim-record"
    ]
  },
  {
    "slug": "spf-policy-strength",
    "name": "SPF Policy Enforcement Strength",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "medium",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Evaluates the terminal qualifier of your SPF record (-all hardfail vs ~all softfail vs +all).",
    "whyItMatters": "Using +all or ?all allows anyone on the internet to send emails claiming to be from your domain.",
    "howWeCheck": "We check whether the record ends with -all (strict hardfail) or ~all (softfail).",
    "fixes": {
      "nginx": "v=spf1 include:mailgun.org -all",
      "apache": "Update DNS TXT to terminate with -all or ~all",
      "cloudflare": "Edit TXT record to use -all for maximum spoofing defense",
      "nextjs": "DNS management level setting"
    },
    "faqs": [
      {
        "q": "Why do many organizations use ~all instead of -all?",
        "a": "Softfail (~all) is commonly used during email migration to avoid dropping misconfigured legitimate outbound sources."
      }
    ],
    "relatedSlugs": [
      "spf-record",
      "dmarc-enforcement-strength"
    ]
  },
  {
    "slug": "dmarc-record",
    "name": "DMARC Record Validation",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "medium",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Ensures a _dmarc TXT record exists to coordinate SPF and DKIM authentication results.",
    "whyItMatters": "DMARC protects your domain reputation by directing receiving servers how to handle spoofed emails.",
    "howWeCheck": "We query DNS TXT records at _dmarc.yourdomain.com for v=DMARC1.",
    "fixes": {
      "nginx": "# DNS TXT at _dmarc.yourdomain.com:\nv=DMARC1; p=reject; rua=mailto:dmarc-reports@yourdomain.com;",
      "apache": "Configure DNS TXT record for host _dmarc",
      "cloudflare": "Add TXT record: Name: _dmarc, Content: v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com",
      "nextjs": "DNS registrar level setting"
    },
    "faqs": [
      {
        "q": "What does rua= mean in DMARC?",
        "a": "rua specifies the email address where receiving mail servers send aggregated XML reports of delivery attempts."
      }
    ],
    "relatedSlugs": [
      "dmarc-enforcement-strength",
      "spf-record",
      "dkim-record"
    ]
  },
  {
    "slug": "dmarc-enforcement-strength",
    "name": "DMARC Enforcement Policy (p=reject / p=quarantine)",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "medium",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Checks whether DMARC policy is set to enforce (p=reject or p=quarantine) rather than passive monitoring (p=none).",
    "whyItMatters": "A policy of p=none monitors spoofing attempts but does not prevent fraudulent emails from landing in victim inboxes.",
    "howWeCheck": "We parse the p= tag in the DMARC record to verify whether it enforces quarantine or reject.",
    "fixes": {
      "nginx": "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@yourdomain.com",
      "apache": "Update _dmarc TXT record to p=quarantine or p=reject",
      "cloudflare": "Update DMARC policy from p=none to p=reject in DNS management",
      "nextjs": "DNS management setting"
    },
    "faqs": [
      {
        "q": "How do I safely transition from p=none to p=reject?",
        "a": "Start with p=none to monitor rua reports, then switch to p=quarantine with pct=20, gradually ramping up to p=reject."
      }
    ],
    "relatedSlugs": [
      "dmarc-record",
      "spf-policy-strength"
    ]
  },
  {
    "slug": "dkim-record",
    "name": "DKIM (DomainKeys Identified Mail) Selectors",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "medium",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Checks for cryptographic DKIM public keys used to digitally sign outbound emails and prevent tampering in transit.",
    "whyItMatters": "DKIM provides cryptographic proof that the email was actually sent by the domain owner and was not modified in transit.",
    "howWeCheck": "We test common DKIM selectors (default, google, k1, s1, mailgun) for valid v=DKIM1 public keys.",
    "fixes": {
      "nginx": "# Configure selector._domainkey.yourdomain.com TXT in DNS:\nk=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ...",
      "apache": "Publish the public key provided by your ESP (Google Workspace, Postmark, SendGrid)",
      "cloudflare": "Add TXT record under your selector._domainkey",
      "nextjs": "DNS management setting"
    },
    "faqs": [
      {
        "q": "What is a DKIM selector?",
        "a": "A selector allows a domain to maintain multiple public keys for different email services (e.g. Google Workspace vs SendGrid)."
      }
    ],
    "relatedSlugs": [
      "dmarc-record",
      "spf-record",
      "bimi-record"
    ]
  },
  {
    "slug": "dnssec-validation",
    "name": "DNSSEC Validation & Signatures",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "high",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Validates Domain Name System Security Extensions (DNSSEC) to prevent DNS spoofing and cache poisoning attacks.",
    "whyItMatters": "Without DNSSEC, attackers can poison recursive DNS resolvers to silently divert your web traffic to malicious replica servers.",
    "howWeCheck": "We send a DNS query with the DNSSEC OK (DO) flag and check for valid RRSIG and DS records.",
    "fixes": {
      "nginx": "# Enable DNSSEC in your domain registrar (e.g., Namecheap, GoDaddy) using DS records provided by your DNS host",
      "apache": "# Managed through DNS provider",
      "cloudflare": "Cloudflare Dashboard -> DNS -> Settings -> Enable DNSSEC -> Add DS record to your registrar",
      "nextjs": "Configured at your DNS registrar"
    },
    "faqs": [
      {
        "q": "Does DNSSEC encrypt DNS queries?",
        "a": "No. DNSSEC provides cryptographic authentication and integrity of DNS responses, not privacy/encryption (which is handled by DoH/DoT)."
      }
    ],
    "relatedSlugs": [
      "open-dns-resolver",
      "caa-records"
    ]
  },
  {
    "slug": "caa-records",
    "name": "CAA (Certificate Authority Authorization) Records",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "medium",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Checks DNS CAA records that whitelist which Certificate Authorities (e.g. Let’s Encrypt, DigiCert) are allowed to issue certificates.",
    "whyItMatters": "Prevents rogue CAs from issuing fraudulent certificates for your domain even if someone manages to trick another authority.",
    "howWeCheck": "We query DNS for type 257 (CAA) records and inspect issue and issuewild flags.",
    "fixes": {
      "nginx": "# DNS CAA record:\nyourdomain.com. IN CAA 0 issue \"letsencrypt.org\"",
      "apache": "Configure CAA DNS record",
      "cloudflare": "Add CAA record: Tag: issue, Value: letsencrypt.org",
      "nextjs": "DNS management level setting"
    },
    "faqs": [
      {
        "q": "Can I permit multiple CAs in CAA?",
        "a": "Yes, publish multiple CAA records (e.g. one for letsencrypt.org and one for digicert.com)."
      }
    ],
    "relatedSlugs": [
      "certificate-transparency",
      "ssl-certificate-chain"
    ]
  },
  {
    "slug": "mta-sts-policy",
    "name": "MTA-STS Policy (Mail Strict Transport)",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "medium",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Validates RFC 8461 MTA Strict Transport Security policy to enforce TLS encryption for incoming SMTP mail delivery.",
    "whyItMatters": "Protects email exchanges from opportunistic TLS downgrade attacks and man-in-the-middle interception.",
    "howWeCheck": "We check for a _mta-sts DNS TXT record and verify https://mta-sts.yourdomain.com/.well-known/mta-sts.txt exists.",
    "fixes": {
      "nginx": "# Serve policy file at https://mta-sts.yourdomain.com/.well-known/mta-sts.txt:\nversion: STSv1\nmode: enforce\nmx: mail.yourdomain.com\nmax_age: 604800",
      "apache": "Publish .well-known/mta-sts.txt",
      "cloudflare": "Host mta-sts subdomain via Cloudflare Pages / Worker",
      "nextjs": "// Add route handler for .well-known/mta-sts.txt"
    },
    "faqs": [
      {
        "q": "What is the difference between MTA-STS and DANE?",
        "a": "MTA-STS relies on HTTPS PKI certificates, whereas DANE relies on DNSSEC."
      }
    ],
    "relatedSlugs": [
      "tls-rpt-reporting",
      "dmarc-record"
    ]
  },
  {
    "slug": "tls-rpt-reporting",
    "name": "SMTP TLS Reporting (TLS-RPT)",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "low",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Checks for _smtp._tls TXT records (RFC 8460) to receive automated notifications regarding email delivery TLS failures.",
    "whyItMatters": "Enables mail administrators to detect when attackers or network faults are causing SMTP TLS downgrade failures.",
    "howWeCheck": "We query DNS for _smtp._tls.yourdomain.com TXT records for v=TLSRPTv1.",
    "fixes": {
      "nginx": "# DNS TXT at _smtp._tls.yourdomain.com:\nv=TLSRPTv1; rua=mailto:tls-reports@yourdomain.com",
      "apache": "Configure DNS TXT record for _smtp._tls",
      "cloudflare": "Add TXT record: Name: _smtp._tls, Content: v=TLSRPTv1; rua=mailto:tls-reports@yourdomain.com",
      "nextjs": "DNS management setting"
    },
    "faqs": [
      {
        "q": "Does TLS-RPT block delivery?",
        "a": "No, TLS-RPT is purely an automated reporting mechanism."
      }
    ],
    "relatedSlugs": [
      "mta-sts-policy",
      "dmarc-record"
    ]
  },
  {
    "slug": "bimi-record",
    "name": "BIMI (Brand Indicators for Message Identification)",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "low",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Checks for default._bimi TXT records to display verified brand logos in supporting email clients (Gmail, Apple Mail).",
    "whyItMatters": "BIMI increases email open rates and reassures recipients that messages are authentic by displaying verified brand avatars.",
    "howWeCheck": "We check for DNS TXT records at default._bimi.yourdomain.com with v=BIMI1.",
    "fixes": {
      "nginx": "# DNS TXT at default._bimi.yourdomain.com:\nv=BIMI1; l=https://yourdomain.com/logo.svg; a=https://yourdomain.com/vmc.pem;",
      "apache": "Configure default._bimi TXT record",
      "cloudflare": "Add TXT record for default._bimi",
      "nextjs": "DNS management setting"
    },
    "faqs": [
      {
        "q": "Does BIMI require DMARC enforcement?",
        "a": "Yes, BIMI strictly requires a DMARC policy of p=quarantine (at pct=100) or p=reject."
      }
    ],
    "relatedSlugs": [
      "dmarc-enforcement-strength",
      "dkim-record"
    ]
  },
  {
    "slug": "open-dns-resolver",
    "name": "Open DNS Resolver Vulnerability",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "high",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Verifies authoritative nameservers do not permit recursive lookups for external IPs, preventing DNS amplification DDoS attacks.",
    "whyItMatters": "Open recursive resolvers are weaponized by botnets to launch massive DNS reflection DDoS attacks against external victims.",
    "howWeCheck": "We send recursive DNS query probes to domain nameservers for external domains (e.g. google.com) and verify they are rejected.",
    "fixes": {
      "nginx": "# In BIND named.conf: recursion no; additional-from-cache no;",
      "apache": "# Managed in authoritative DNS server",
      "cloudflare": "Cloudflare managed DNS nameservers block open recursion automatically.",
      "nextjs": "Managed by DNS hosting provider"
    },
    "faqs": [
      {
        "q": "What is a DNS amplification attack?",
        "a": "Attackers spoof a victim’s IP and send small queries that generate 50x larger responses sent back to the victim."
      }
    ],
    "relatedSlugs": [
      "dnssec-validation",
      "mail-server-mx-security"
    ]
  },
  {
    "slug": "mail-server-mx-security",
    "name": "Mail Server (MX) Security Records",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "low",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Inspects MX records to ensure valid mail routing configuration and detect dormant or dangling mail server pointers.",
    "whyItMatters": "Misconfigured MX records cause business email outages or permit attackers to register expired mail relay domains.",
    "howWeCheck": "We resolve DNS MX records and verify that each mail exchange host resolves to active IP addresses.",
    "fixes": {
      "nginx": "# Configure valid MX records pointing to your email service provider",
      "apache": "DNS MX record management",
      "cloudflare": "Verify MX records in Cloudflare DNS dashboard",
      "nextjs": "DNS management setting"
    },
    "faqs": [
      {
        "q": "What if our domain does not send or receive email?",
        "a": "Publish a null MX record (\".\") and SPF \"v=spf1 -all\" to block all email impersonation."
      }
    ],
    "relatedSlugs": [
      "spf-record",
      "reverse-dns-ptr"
    ]
  },
  {
    "slug": "reverse-dns-ptr",
    "name": "Reverse DNS / PTR Record Verification",
    "category": "dns",
    "categoryName": "DNS & Email Trust",
    "severity": "low",
    "tier": "free",
    "icon": "Server",
    "shortDesc": "Checks whether outbound web and mail server IP addresses have matching Forward-Confirmed Reverse DNS (FCrDNS) pointers.",
    "whyItMatters": "Lack of PTR records causes email delivery to fail anti-spam filters and indicates amateur server infrastructure.",
    "howWeCheck": "We perform a reverse IP lookup for PTR records and forward lookup the resulting hostname to verify match.",
    "fixes": {
      "nginx": "# Set PTR record in your cloud hosting provider console (AWS Route53, DigitalOcean, Hetzner)",
      "apache": "Configure PTR record with hosting provider",
      "cloudflare": "Managed at server IP host level",
      "nextjs": "Managed at cloud VPS / hosting infrastructure level"
    },
    "faqs": [
      {
        "q": "What is FCrDNS?",
        "a": "Forward-Confirmed reverse DNS means IP -> Hostname and Hostname -> IP point to each other symmetrically."
      }
    ],
    "relatedSlugs": [
      "mail-server-mx-security",
      "spf-record"
    ]
  },
  {
    "slug": "exposed-api-keys",
    "name": "Exposed API Keys & Credentials",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "critical",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Scans JavaScript bundles and responses for leaked API keys (OpenAI, Stripe, AWS, SendGrid, GitHub).",
    "whyItMatters": "Leaked credentials give malicious actors direct access to databases, cloud computing, and customer payment data.",
    "howWeCheck": "We run regular expression patterns matching Stripe (sk_live_), AWS (AKIA...), GitHub tokens, and OpenAI secret keys across public scripts.",
    "fixes": {
      "nginx": "# Immediately revoke leaked keys and move secrets to server-side environment variables",
      "apache": "Revoke secrets and store them in secure environment managers (Vault, Doppler)",
      "cloudflare": "Use Cloudflare Workers Secrets for private runtime variables",
      "nextjs": "// Never prefix server secrets with NEXT_PUBLIC_ in .env files"
    },
    "faqs": [
      {
        "q": "How did my API key get in the frontend build?",
        "a": "Prefixing environment variables with NEXT_PUBLIC_ or hardcoding them into client components inlines them into JS bundles."
      }
    ],
    "relatedSlugs": [
      "extended-secret-patterns",
      "sensitive-files-env-git",
      "source-map-exposure"
    ]
  },
  {
    "slug": "extended-secret-patterns",
    "name": "Extended Secret Patterns & High-Entropy Strings",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "critical",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Uses Shannon entropy calculations to uncover hidden RSA private keys, JWT secrets, and bearer tokens in public assets.",
    "whyItMatters": "High-entropy strings usually represent cryptographic keys or authentication hashes that allow impersonation.",
    "howWeCheck": "We analyze string entropy (> 4.5 bits/char) for base64 and hexadecimal payloads embedded in HTML and script files.",
    "fixes": {
      "nginx": "Sanitize client-side script builds during CI/CD before deployment",
      "apache": "Implement git-secrets or truffleHog in pre-commit hooks",
      "cloudflare": "Audit edge assets for raw secret tokens",
      "nextjs": "Audit client components for accidental server variable imports"
    },
    "faqs": [
      {
        "q": "What is Shannon entropy in security scanning?",
        "a": "It measures randomness. Plain English has low entropy (~2-3 bits/char), while encryption keys have high entropy (>4.5)."
      }
    ],
    "relatedSlugs": [
      "exposed-api-keys",
      "sensitive-files-env-git"
    ]
  },
  {
    "slug": "sensitive-files-env-git",
    "name": "Sensitive Files (.env, .git, .env.local)",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "critical",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Probes for accidentally published configuration files (/.env, /.git/config, /docker-compose.yml, /settings.py).",
    "whyItMatters": "Exposing .env or .git repositories lets attackers clone the entire proprietary codebase, database credentials, and production secrets.",
    "howWeCheck": "We probe common configuration paths and analyze the HTTP status and content signature for environment variables.",
    "fixes": {
      "nginx": "location ~* /.(env|git|svn|docker|yml) { deny all; return 404; }",
      "apache": "<FilesMatch \"^.env|.git\"> Order allow,deny\nDeny from all </FilesMatch>",
      "cloudflare": "Add Cloudflare WAF Rule: URI Path contains \"/.env\" -> Action: Block",
      "nextjs": "Add .env* to .gitignore and never put them inside public/"
    },
    "faqs": [
      {
        "q": "Can someone download an entire git repository if .git is public?",
        "a": "Yes, tools like git-dumper can reconstruct the full source code history from an exposed .git directory."
      }
    ],
    "relatedSlugs": [
      "version-control-exposure",
      "backup-file-detection",
      "exposed-api-keys"
    ]
  },
  {
    "slug": "version-control-exposure",
    "name": "Version Control Exposure (.git, .svn, .hg)",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "critical",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Tests for exposed /.git/HEAD, /.svn/entries, and repository metadata allowing complete source code reconstruction.",
    "whyItMatters": "Attackers can read commit histories, developer comments, and cryptographic secrets committed in past commits.",
    "howWeCheck": "We request /.git/HEAD and verify if the response starts with ref: refs/heads/.",
    "fixes": {
      "nginx": "location ~ /.git { deny all; return 404; }",
      "apache": "RedirectMatch 404 /.git",
      "cloudflare": "WAF Rule: http.request.uri.path contains \"/.git\" -> Block",
      "nextjs": "Ensure your deployment pipeline excludes .git directories from public web roots"
    },
    "faqs": [
      {
        "q": "Why do .git folders end up on production servers?",
        "a": "Deploying by running git pull directly on the server without removing the .git folder or configuring web server blocks."
      }
    ],
    "relatedSlugs": [
      "sensitive-files-env-git",
      "backup-file-detection"
    ]
  },
  {
    "slug": "backup-file-detection",
    "name": "Backup & Database Dump Detection (.sql, .bak, .zip)",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "critical",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Searches for un-restricted backup files (backup.sql, dump.tar.gz, site.zip, database.bak) left in web directories.",
    "whyItMatters": "Database dumps contain complete tables of customer PII, password hashes, and business records.",
    "howWeCheck": "We probe for common backup filenames based on the domain name and verify whether files are downloadable.",
    "fixes": {
      "nginx": "location ~* .(sql|bak|backup|tar|gz|zip|swp)$ { deny all; return 404; }",
      "apache": "<FilesMatch \".(sql|bak|backup|tar|gz|zip)$\"> Deny from all </FilesMatch>",
      "cloudflare": "Cloudflare WAF: Block request uri path ending in .sql or .bak",
      "nextjs": "Store backups outside public web document roots (e.g. private S3 buckets)"
    },
    "faqs": [
      {
        "q": "Where should database backups be saved?",
        "a": "In private cloud object storage (AWS S3 with blocked public access) with server-side encryption."
      }
    ],
    "relatedSlugs": [
      "sensitive-files-env-git",
      "directory-listing"
    ]
  },
  {
    "slug": "source-map-exposure",
    "name": "Public Source Map (.js.map) Exposure",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "medium",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Detects public .js.map files that reveal un-minified TypeScript/JavaScript source code and internal business logic.",
    "whyItMatters": "Publishing source maps gives attackers your original un-minified code, comments, and internal API routes.",
    "howWeCheck": "We inspect script tags for sourceMappingURL comments and test whether the corresponding .map files are readable.",
    "fixes": {
      "nginx": "location ~* .map$ { deny all; return 404; }",
      "apache": "<FilesMatch \".map$\"> Deny from all </FilesMatch>",
      "cloudflare": "Block URI ending in .map for public visitors",
      "nextjs": "// next.config.mjs:\nexport default { productionBrowserSourceMaps: false };"
    },
    "faqs": [
      {
        "q": "Can I use Sentry without public source maps?",
        "a": "Yes! Upload source maps directly to Sentry during your CI build and delete the .map files before deploying."
      }
    ],
    "relatedSlugs": [
      "exposed-api-keys",
      "sensitive-files-env-git"
    ]
  },
  {
    "slug": "cloud-credentials-exposure",
    "name": "Cloud Credentials Exposure (.aws, gcp-key.json)",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "critical",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Checks for leaked cloud provider credential files (/.aws/credentials, /gcloud/credentials.db, /kube/config).",
    "whyItMatters": "Permits attackers to take over cloud accounts, provision crypto-mining clusters, and access private buckets.",
    "howWeCheck": "We test for standard cloud configuration file endpoints and check response patterns.",
    "fixes": {
      "nginx": "location ~* /.(aws|gcloud|azure|kube) { deny all; return 404; }",
      "apache": "Deny access to hidden dotfiles",
      "cloudflare": "WAF Rule: Block requests matching cloud credential paths",
      "nextjs": "Use IAM roles and workload identity rather than file-based credentials"
    },
    "faqs": [
      {
        "q": "What is the best alternative to AWS credential files?",
        "a": "Use IAM Instance Profiles or OpenID Connect (OIDC) roles with short-lived session tokens."
      }
    ],
    "relatedSlugs": [
      "exposed-api-keys",
      "sensitive-files-env-git"
    ]
  },
  {
    "slug": "exposed-debug-endpoints",
    "name": "Exposed Debug Endpoints (/debug, /actuator, /telescope)",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "critical",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Identifies publicly accessible diagnostic and profiling routes (Spring Boot /actuator/env, Laravel /telescope, Django /__debug__).",
    "whyItMatters": "Spring actuator and profiling endpoints reveal active database credentials, heap dumps, and internal environment configs.",
    "howWeCheck": "We probe for common diagnostic endpoints and evaluate whether they return authenticated application metrics.",
    "fixes": {
      "nginx": "location ~* ^/(actuator|telescope|_debugbar|phpinfo) { deny all; return 404; }",
      "apache": "Block access to /actuator and debug URLs",
      "cloudflare": "WAF custom rule to restrict /actuator to office VPN IPs",
      "nextjs": "Disable debug tools and devtools routes in production builds"
    },
    "faqs": [
      {
        "q": "Why is Spring Boot /actuator/env dangerous?",
        "a": "It displays all environment variables, including active database passwords and cloud API keys."
      }
    ],
    "relatedSlugs": [
      "admin-panel-exposure",
      "sensitive-files-env-git"
    ]
  },
  {
    "slug": "admin-panel-exposure",
    "name": "Admin Panel Exposure (/admin, /cpanel, /wp-admin)",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "high",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Scans for publicly discoverable administrative login interfaces that lack IP whitelisting or second-factor gates.",
    "whyItMatters": "Public admin portals are constantly targeted by credential stuffing, brute force, and password spraying attacks.",
    "howWeCheck": "We probe standard management routes (/admin, /administrator, /cpanel, /wp-login.php) and check for accessible login forms.",
    "fixes": {
      "nginx": "location /admin { allow 203.0.113.0/24; deny all; }",
      "apache": "Require ip 203.0.113.0/24",
      "cloudflare": "Cloudflare Zero Trust Access: Place /admin behind Google or Okta SSO authentication.",
      "nextjs": "Protect admin route groups behind robust middleware session validation"
    },
    "faqs": [
      {
        "q": "How should admin dashboards be protected?",
        "a": "Place them behind Cloudflare Access or a corporate VPN, and mandate hardware security key (WebAuthn) MFA."
      }
    ],
    "relatedSlugs": [
      "exposed-debug-endpoints",
      "directory-listing"
    ]
  },
  {
    "slug": "directory-listing",
    "name": "Directory Listing Enabled",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "high",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Verifies that web servers do not automatically index folder contents when no default index.html is present.",
    "whyItMatters": "Directory listings allow attackers to browse all files, uploaded documents, logs, and temporary scripts on your server.",
    "howWeCheck": "We probe common folders (/uploads/, /images/, /static/) and inspect responses for \"Index of /\" signatures.",
    "fixes": {
      "nginx": "autoindex off; # in nginx.conf or server block",
      "apache": "Options -Indexes # in httpd.conf or .htaccess",
      "cloudflare": "Cloudflare passes directory responses from origin; disable autoindexing on origin.",
      "nextjs": "Static exports do not enable autoindex unless explicitly configured on custom servers."
    },
    "faqs": [
      {
        "q": "What is autoindex in Nginx?",
        "a": "It is the module that generates automatic file lists when an index file is absent."
      }
    ],
    "relatedSlugs": [
      "backup-file-detection",
      "sensitive-files-env-git"
    ]
  },
  {
    "slug": "robots-txt-sensitive-paths",
    "name": "robots.txt Sensitive Path Exposure",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "low",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Audits robots.txt to ensure Disallow: directives do not inadvertently advertise secret administrative or staging URLs.",
    "whyItMatters": "Attackers inspect robots.txt first to find hidden administrative routes, unreleased features, or sensitive paths.",
    "howWeCheck": "We fetch /robots.txt and analyze Disallow paths for sensitive naming patterns (e.g. /private/, /backup/, /staging/).",
    "fixes": {
      "nginx": "# Only list public indexing rules in robots.txt. Enforce authentication on sensitive endpoints rather than relying on robots.txt",
      "apache": "Remove private path declarations from robots.txt",
      "cloudflare": "Audit robots.txt file",
      "nextjs": "// app/robots.js: Keep rules high-level (/api/ instead of /api/secret-route)"
    },
    "faqs": [
      {
        "q": "Does robots.txt protect pages from being accessed?",
        "a": "No! robots.txt only requests search engine crawlers not to index a page. Anyone can still open the URL."
      }
    ],
    "relatedSlugs": [
      "sitemap-sensitive-paths",
      "admin-panel-exposure"
    ]
  },
  {
    "slug": "sitemap-sensitive-paths",
    "name": "Sitemap Sensitive Path Exposure",
    "category": "secrets",
    "categoryName": "Secrets & Exposure",
    "severity": "low",
    "tier": "free",
    "icon": "FileText",
    "shortDesc": "Scans XML sitemaps to verify they do not include internal, development, or authenticated dashboard URLs.",
    "whyItMatters": "Accidentally listing internal staging URLs or test pages in sitemap.xml exposes unhardened surfaces to attackers.",
    "howWeCheck": "We fetch /sitemap.xml and evaluate listed URLs for private parameters, test environments, and admin directories.",
    "fixes": {
      "nginx": "# Ensure sitemap generator only includes public, indexable canonical URLs",
      "apache": "Audit sitemap generation scripts",
      "cloudflare": "Verify sitemap.xml endpoints",
      "nextjs": "// app/sitemap.js: Filter out internal dashboard and API routes"
    },
    "faqs": [
      {
        "q": "What should be in sitemap.xml?",
        "a": "Only public, canonical URLs returning HTTP 200 with useful public content."
      }
    ],
    "relatedSlugs": [
      "robots-txt-sensitive-paths",
      "directory-listing"
    ]
  },
  {
    "slug": "subdomain-takeover-detection",
    "name": "Subdomain Takeover Vulnerability (Dangling CNAMEs)",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "critical",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Detects dangling CNAME records pointing to decommissioned third-party cloud services (AWS S3, GitHub Pages, Heroku).",
    "whyItMatters": "An attacker can claim the abandoned bucket or service name and host malicious phishing content directly on your trusted domain.",
    "howWeCheck": "We resolve subdomains, check CNAME targets against known vulnerable fingerprinted providers, and probe for \"NoSuchBucket\" or \"Unregistered Domain\" signatures.",
    "fixes": {
      "nginx": "# Delete orphaned CNAME DNS records immediately from your DNS zone",
      "apache": "Remove decommissioned CNAME records",
      "cloudflare": "Delete obsolete DNS CNAME records in Cloudflare DNS",
      "nextjs": "Regularly audit DNS zones for deleted microservices and static hosting buckets"
    },
    "faqs": [
      {
        "q": "What services are most vulnerable to subdomain takeover?",
        "a": "AWS S3, GitHub Pages, Heroku, Vercel, Netlify, Azure Traffic Manager, and Zendesk."
      }
    ],
    "relatedSlugs": [
      "subdomain-exposure",
      "discovered-subdomains"
    ]
  },
  {
    "slug": "subdomain-exposure",
    "name": "Subdomain Exposure & Enumeration",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "low",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Discovers active subdomains via Certificate Transparency logs and DNS resolution to map your external attack surface.",
    "whyItMatters": "Unmonitored development, test, and staging subdomains often run outdated software without proper firewall defenses.",
    "howWeCheck": "We aggregate domain records from Certificate Transparency logs, crt.sh, and common hostname lookups.",
    "fixes": {
      "nginx": "# Decommission or place unused subdomains behind an authentication proxy",
      "apache": "Clean up orphan subdomains",
      "cloudflare": "Review DNS records in Cloudflare and delete unused subdomains",
      "nextjs": "Maintain an updated inventory of all active domain names"
    },
    "faqs": [
      {
        "q": "How do scanners find subdomains without brute force?",
        "a": "Every time an SSL certificate is generated, the domain is recorded publicly in Certificate Transparency logs."
      }
    ],
    "relatedSlugs": [
      "subdomain-takeover-detection",
      "discovered-subdomains"
    ]
  },
  {
    "slug": "discovered-subdomains",
    "name": "Discovered Subdomains Inventory",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "low",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Generates a live inventory of discovered subdomains and assesses the risk posture of secondary microservices.",
    "whyItMatters": "Shadow IT and forgotten cloud instances are the #1 entry point for enterprise security breaches.",
    "howWeCheck": "We map each discovered subdomain to its corresponding IP address, cloud provider, and HTTP status.",
    "fixes": {
      "nginx": "Implement automated asset management and DNS auditing",
      "apache": "Maintain internal DNS inventory",
      "cloudflare": "Audit Cloudflare DNS table quarterly",
      "nextjs": "Track all deployed apps under the root domain"
    },
    "faqs": [
      {
        "q": "What is shadow IT?",
        "a": "Microservices or web apps deployed by internal teams without central security review or monitoring."
      }
    ],
    "relatedSlugs": [
      "subdomain-takeover-detection",
      "subdomain-exposure"
    ]
  },
  {
    "slug": "open-redirect-vulnerability",
    "name": "Open Redirect Vulnerability",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "high",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Tests redirect parameters (?redirect=, ?return=, ?next=, ?url=) for unvalidated destination redirects.",
    "whyItMatters": "Open redirects make phishing attacks highly convincing because the link begins with your trusted brand URL before redirecting to malware.",
    "howWeCheck": "We test redirect parameters with external domains (e.g. https://evil.com) and check if the server returns a 302/301 redirecting off-site.",
    "fixes": {
      "nginx": "# Validate destination URLs against an explicit internal allowlist",
      "apache": "Never redirect to arbitrary user-supplied URL strings without host validation",
      "cloudflare": "Use Cloudflare Worker to enforce destination domain whitelist",
      "nextjs": "// Validate returnUrl in Next.js: if (!url.startsWith('/') || url.startsWith('//')) throw new Error('Invalid URL');"
    },
    "faqs": [
      {
        "q": "Why do attackers use open redirects?",
        "a": "Victims trust your official domain in the email link, but upon clicking, they are forwarded to an exact replica phishing page."
      }
    ],
    "relatedSlugs": [
      "admin-panel-exposure",
      "form-security-analysis"
    ]
  },
  {
    "slug": "graphql-introspection-exposed",
    "name": "GraphQL Introspection Exposed (/graphql)",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "critical",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Tests if GraphQL schema introspection (__schema query) is publicly enabled, disclosing complete schema designs and hidden queries.",
    "whyItMatters": "Introspection provides attackers with an exact blueprint of your database schema, unpublished queries, mutations, and user fields.",
    "howWeCheck": "We send a standard GraphQL introspection query to /graphql and /api/graphql to see if schema data is returned.",
    "fixes": {
      "nginx": "# Disable introspection in your GraphQL server configuration in production (Apollo Server, Yoga, Relay)",
      "apache": "// Apollo Server: introspection: process.env.NODE_ENV !== 'production'",
      "cloudflare": "Cloudflare API Gateway: Block GraphQL schema introspection requests",
      "nextjs": "// In Apollo or GraphQL route handler: set introspection: false in production"
    },
    "faqs": [
      {
        "q": "Should GraphQL introspection ever be enabled in production?",
        "a": "Almost never for private APIs; it should only be enabled if your API is designed as a public developer platform."
      }
    ],
    "relatedSlugs": [
      "exposed-debug-endpoints",
      "open-ports-scan"
    ]
  },
  {
    "slug": "http-method-enumeration",
    "name": "HTTP Method Enumeration (PUT, DELETE, TRACE)",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "medium",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Tests which HTTP methods are permitted and flags dangerous legacy methods such as TRACE or unauthenticated PUT/DELETE.",
    "whyItMatters": "HTTP TRACE can be used in Cross-Site Tracing (XST) attacks to steal HttpOnly cookies reflected in response bodies.",
    "howWeCheck": "We send OPTIONS and TRACE requests to examine the Allow header and verify if TRACE or TRACK succeed.",
    "fixes": {
      "nginx": "if ($request_method !~ ^(GET|HEAD|POST|OPTIONS)$ ) { return 405; }",
      "apache": "TraceEnable off",
      "cloudflare": "Block TRACE and TRACK methods via Cloudflare WAF",
      "nextjs": "Route handlers in Next.js automatically reject unhandled HTTP methods"
    },
    "faqs": [
      {
        "q": "What is Cross-Site Tracing (XST)?",
        "a": "An exploit where an attacker leverages TRACE to reflect request headers (including HttpOnly cookies) back into JavaScript."
      }
    ],
    "relatedSlugs": [
      "cors-misconfiguration",
      "server-info-disclosure"
    ]
  },
  {
    "slug": "error-page-information-leakage",
    "name": "Error Page Information Leakage",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "medium",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Triggers 404 and 500 error conditions to detect verbose stack traces, database error messages, or internal file paths.",
    "whyItMatters": "Raw stack traces reveal internal filesystem directories, database schemas, library versions, and coding bugs.",
    "howWeCheck": "We send malformed requests and examine error responses for database exceptions, file system paths (/var/www, C:\\), and stack frames.",
    "fixes": {
      "nginx": "error_page 404 /404.html;\nerror_page 500 502 503 504 /50x.html;",
      "apache": "ErrorDocument 404 /404.html\nErrorDocument 500 /500.html",
      "cloudflare": "Enable Cloudflare Custom Error Pages for 5xx errors",
      "nextjs": "// Implement custom app/not-found.js and app/error.js in Next.js"
    },
    "faqs": [
      {
        "q": "Why are custom error pages important?",
        "a": "They ensure users receive a friendly message while preventing attackers from discovering server architecture details."
      }
    ],
    "relatedSlugs": [
      "server-info-disclosure",
      "exposed-debug-endpoints"
    ]
  },
  {
    "slug": "open-ports-scan",
    "name": "Common Open Ports Scan (DB/Admin)",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "high",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Scans public IP addresses for exposed non-web ports including SSH (22), MySQL (3306), Redis (6379), MongoDB (27017), and RDP (3389).",
    "whyItMatters": "Database and cache ports should never be exposed to the public internet; they are vulnerable to brute force and zero-authentication exploits.",
    "howWeCheck": "We check whether common administrative and database ports are actively accepting connections on target host IPs.",
    "fixes": {
      "nginx": "# Configure cloud firewall / security group (AWS SG, UFW) to allow only ports 80 and 443 publicly",
      "apache": "sudo ufw default deny incoming\nsudo ufw allow 80/tcp\nsudo ufw allow 443/tcp",
      "cloudflare": "Cloudflare proxies ports 80/443; ensure origin firewall blocks all traffic not originating from Cloudflare IP ranges.",
      "nextjs": "Bind database instances to private VPC subnets with no public IPv4 addresses"
    },
    "faqs": [
      {
        "q": "Why would Redis be accessible publicly?",
        "a": "Default Redis configurations bound to 0.0.0.0 without authentication have been responsible for widespread server takeovers."
      }
    ],
    "relatedSlugs": [
      "admin-panel-exposure",
      "waf-detection"
    ]
  },
  {
    "slug": "waf-detection",
    "name": "Web Application Firewall (WAF) Detection",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "low",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Identifies active edge WAF protections (Cloudflare, AWS WAF, Fastly, Akamai) that block malicious traffic and Layer 7 attacks.",
    "whyItMatters": "A WAF acts as an outer perimeter defense to filter SQL injection, XSS payloads, rate-limit bots, and mitigate zero-day CVEs.",
    "howWeCheck": "We evaluate response headers, block page signatures, and edge proxy fingerprints to verify active WAF defenses.",
    "fixes": {
      "nginx": "Install ModSecurity or NAXSI module for origin filtering",
      "apache": "Configure ModSecurity with OWASP Core Rule Set (CRS)",
      "cloudflare": "Enable Cloudflare WAF managed rules and rate-limiting rules.",
      "nextjs": "Deploy behind Cloudflare, AWS CloudFront + WAF, or Vercel Edge Firewall"
    },
    "faqs": [
      {
        "q": "Does using a WAF replace secure coding practices?",
        "a": "No, a WAF is a defense-in-depth shield; application code must still sanitize inputs and enforce access control."
      }
    ],
    "relatedSlugs": [
      "open-ports-scan",
      "content-security-policy-csp"
    ]
  },
  {
    "slug": "malware-blocklist-status",
    "name": "Malware & Phishing Blocklist Status",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "critical",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Queries global threat intelligence feeds (Cloudflare Threat Intel, Google Safe Browsing) to verify domain clean status.",
    "whyItMatters": "If your domain is flagged for malware or phishing, browsers show red blocking screens and search engines deindex your site.",
    "howWeCheck": "We check Cloudflare security DNS resolvers and threat feeds to confirm whether the domain is flagged.",
    "fixes": {
      "nginx": "# Immediately audit server for backdoors, compromised scripts, or injected redirects, then request review via Google Search Console",
      "apache": "Scan web root for injected malicious PHP scripts",
      "cloudflare": "Verify security status in Cloudflare Security Center",
      "nextjs": "Audit all third-party dependencies and clean any compromised client scripts"
    },
    "faqs": [
      {
        "q": "How do sites get on malware blocklists without knowing?",
        "a": "Through compromised FTP/SSH credentials, outdated CMS plugins, or malicious third-party advertising scripts."
      }
    ],
    "relatedSlugs": [
      "domain-risk-signals",
      "outbound-link-reputation"
    ]
  },
  {
    "slug": "domain-risk-signals",
    "name": "Domain Name Risk Signals & Typosquatting",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "low",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Analyzes domain characteristics (entropy, length, hyphens, suspicious TLDs) that correlate with phishing infrastructure.",
    "whyItMatters": "Attackers register lookalike domains (e.g. paypa1.com) to launch executive impersonation and phishing campaigns.",
    "howWeCheck": "We evaluate lexical characteristics of the domain name and identify high-risk typosquat patterns.",
    "fixes": {
      "nginx": "# Register common defensive typosquats and redirect them to your primary domain",
      "apache": "Maintain domain monitoring for brand defense",
      "cloudflare": "Use Cloudflare Registrar to lock domains with registrar locks",
      "nextjs": "Enforce brand protection policies"
    },
    "faqs": [
      {
        "q": "What is typosquatting?",
        "a": "Registering misspelled variants of popular domain names to mislead users who mistype URLs."
      }
    ],
    "relatedSlugs": [
      "domain-age-expiry",
      "malware-blocklist-status"
    ]
  },
  {
    "slug": "domain-age-expiry",
    "name": "Domain Age & Expiry Registration Health",
    "category": "attack-surface",
    "categoryName": "Active Probing & Surface",
    "severity": "medium",
    "tier": "free",
    "icon": "Crosshair",
    "shortDesc": "Queries RDAP registration databases to monitor registration age and impending domain expiration.",
    "whyItMatters": "Forgetting to renew a domain allows domain drop-catchers to instantly seize control of your brand and all email communications.",
    "howWeCheck": "We perform RDAP queries to extract registration creation dates and upcoming expiration timestamps.",
    "fixes": {
      "nginx": "# Enable auto-renew with multiple fallback credit cards in your domain registrar",
      "apache": "Enable Registrar Lock (Transfer Lock) at registrar",
      "cloudflare": "Cloudflare Registrar provides at-cost registration with automatic renewal and multi-year locks.",
      "nextjs": "Ensure administrative contact emails are actively monitored group inboxes"
    },
    "faqs": [
      {
        "q": "Why is domain age significant in security?",
        "a": "Newly registered domains (< 30 days) are statistically far more likely to host phishing campaigns."
      }
    ],
    "relatedSlugs": [
      "domain-risk-signals",
      "ssl-certificate-expiry"
    ]
  },
  {
    "slug": "vulnerable-javascript-libraries",
    "name": "Known Vulnerable JavaScript Libraries",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "high",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Scans loaded frontend scripts (jQuery, Lodash, Moment, Bootstrap) against Retire.js vulnerability databases.",
    "whyItMatters": "Using vulnerable library versions allows attackers to exploit prototype pollution, regex denial of service, or DOM XSS.",
    "howWeCheck": "We detect library versions using script hash signatures and regex patterns, then match against the National Vulnerability Database (NVD).",
    "fixes": {
      "nginx": "npm update # Upgrade frontend packages to latest patched versions",
      "apache": "Update vendor libraries in asset pipelines",
      "cloudflare": "Audit third-party scripts loaded through Tag Manager",
      "nextjs": "// Run npm audit / yarn audit and upgrade dependencies in package.json"
    },
    "faqs": [
      {
        "q": "How do outdated libraries introduce XSS?",
        "a": "Older versions of jQuery or Lodash had flaws where unsanitized HTML passed into helper functions executed arbitrary scripts."
      }
    ],
    "relatedSlugs": [
      "outdated-frontend-libraries",
      "subresource-integrity-sri"
    ]
  },
  {
    "slug": "outdated-frontend-libraries",
    "name": "Outdated Frontend Frameworks & Libraries",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "medium",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Identifies outdated versions of frontend frameworks (React, Vue, Angular, jQuery) that are missing security patches.",
    "whyItMatters": "End-of-life frameworks no longer receive security fixes, leaving your app permanently exposed to newly discovered CVEs.",
    "howWeCheck": "We inspect global window objects (e.g. React.version, jQuery.fn.jquery) and build manifests.",
    "fixes": {
      "nginx": "npm outdated # Review dependencies and schedule framework upgrade",
      "apache": "Upgrade frontend framework build",
      "cloudflare": "Check client-side bundle versions",
      "nextjs": "Keep Next.js and React updated to the latest stable release"
    },
    "faqs": [
      {
        "q": "What is the risk of using unsupported frameworks?",
        "a": "When zero-day vulnerabilities are disclosed, maintainers will not publish security patches for deprecated versions."
      }
    ],
    "relatedSlugs": [
      "vulnerable-javascript-libraries",
      "subresource-integrity-sri"
    ]
  },
  {
    "slug": "subresource-integrity-sri",
    "name": "Subresource Integrity (SRI) Hashes",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "medium",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Verifies external CDN scripts and stylesheets include cryptographic hashes (integrity=\"sha384-...\") to block CDN tampering.",
    "whyItMatters": "If a third-party CDN (like cdnjs or unpkg) is compromised, attackers can inject malicious malware directly into your visitors’ browsers.",
    "howWeCheck": "We check all <script> and <link> tags pointing to external CDNs for valid integrity attributes.",
    "fixes": {
      "nginx": "<script src=\"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js\" integrity=\"sha512-v2CJ7UaYy4JwqLDIrZUI/4hqeoQieOmAZNXBeQyjo21dadnwR+8ZaIJVT8EE2iyI61OV8e6M8PP2/4hpQINQ/g==\" crossorigin=\"anonymous\"></script>",
      "apache": "Include integrity and crossorigin attributes on all CDN script tags",
      "cloudflare": "Self-host assets or enable SRI on third-party dependencies",
      "nextjs": "Self-host dependencies via npm instead of linking to external CDNs"
    },
    "faqs": [
      {
        "q": "What happens when an SRI hash fails to match?",
        "a": "The browser refuses to execute the script or apply the stylesheet and throws a cryptographic integrity error in the console."
      }
    ],
    "relatedSlugs": [
      "third-party-domain-count",
      "vulnerable-javascript-libraries"
    ]
  },
  {
    "slug": "third-party-domain-count",
    "name": "Third-Party Domain Count & Blast Radius",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "low",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Measures the total number of unique external domains loaded on the page to evaluate third-party risk exposure.",
    "whyItMatters": "Every additional external domain increases your attack surface, introduces potential downtime dependencies, and slows down page speed.",
    "howWeCheck": "We parse all network requests initiated by the page and tally the count of distinct third-party root domains.",
    "fixes": {
      "nginx": "Self-host fonts and analytics where possible to consolidate origins",
      "apache": "Reduce third-party trackers and ad networks",
      "cloudflare": "Use Cloudflare Zaraz to load third-party tools in the cloud rather than on user browsers",
      "nextjs": "// Use next/font to self-host Google Fonts locally automatically"
    },
    "faqs": [
      {
        "q": "What is a reasonable number of third-party domains?",
        "a": "Fewer than 10 external domains is recommended for optimal performance and security hygiene."
      }
    ],
    "relatedSlugs": [
      "subresource-integrity-sri",
      "third-party-script-inventory"
    ]
  },
  {
    "slug": "outdated-wordpress-plugins",
    "name": "Outdated CMS Plugins & Themes (WordPress)",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "high",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Detects active WordPress, Drupal, or Joomla plugins and checks for known vulnerabilities in publicly exposed asset paths.",
    "whyItMatters": "Over 90% of WordPress compromises originate from unpatched third-party plugins rather than WordPress core itself.",
    "howWeCheck": "We analyze asset URLs (/wp-content/plugins/plugin-name/) and check version queries against known vulnerability catalogs.",
    "fixes": {
      "nginx": "wp plugin update --all # Enable automatic background updates for plugins",
      "apache": "Remove inactive or unmaintained plugins immediately",
      "cloudflare": "Enable Cloudflare WordPress WAF Managed Ruleset",
      "nextjs": "If using headless CMS, isolate WordPress on a private internal domain"
    },
    "faqs": [
      {
        "q": "Should I delete deactivated WordPress plugins?",
        "a": "Yes! Inactive plugins still reside on your server and can be invoked directly by attackers if unpatched."
      }
    ],
    "relatedSlugs": [
      "sensitive-files-env-git",
      "admin-panel-exposure"
    ]
  },
  {
    "slug": "third-party-script-inventory",
    "name": "Third-Party Script Inventory & Governance",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "low",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Catalogs all client-side JavaScript tags and tracks their vendor ownership (analytics, customer chat, ads, A/B testing).",
    "whyItMatters": "Magecart attacks frequently hijack innocent customer support or analytics scripts to skim credit cards from payment forms.",
    "howWeCheck": "We inspect loaded script origins and map them to recognized third-party vendors.",
    "fixes": {
      "nginx": "Implement a strict CSP script-src directive restricting allowed external script hosts",
      "apache": "Enforce Content-Security-Policy script-src whitelist",
      "cloudflare": "Use Cloudflare Page Shield to detect client-side script tampering in real-time.",
      "nextjs": "// Use next/script with strategy=\"lazyOnload\" and verify vendor trustworthiness"
    },
    "faqs": [
      {
        "q": "What is a Magecart attack?",
        "a": "An attack where hackers compromise a third-party script to silently record keystrokes on checkout checkout forms."
      }
    ],
    "relatedSlugs": [
      "subresource-integrity-sri",
      "content-security-policy-csp"
    ]
  },
  {
    "slug": "unpinned-cdn-resources",
    "name": "Unpinned CDN Resources (@latest)",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "medium",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Flags script tags loading unpinned CDN URLs (e.g. unpkg.com/package@latest) that can receive untested or malicious updates.",
    "whyItMatters": "Loading floating versions means any compromised version published upstream immediately infects your live production website.",
    "howWeCheck": "We check script and link URLs for unpinned tags like @latest or missing explicit semantic versions.",
    "fixes": {
      "nginx": "<script src=\"https://cdn.jsdelivr.net/npm/package@1.2.3/dist/index.js\"></script>",
      "apache": "Pin exact semantic versions in all external asset URLs",
      "cloudflare": "Lock CDN version dependencies",
      "nextjs": "Bundle assets via npm package dependencies with lockfiles"
    },
    "faqs": [
      {
        "q": "Why is @latest dangerous in production?",
        "a": "An upstream package maintainer account takeover will instantly execute the attacker’s code on your users without any deployment on your end."
      }
    ],
    "relatedSlugs": [
      "subresource-integrity-sri",
      "vulnerable-javascript-libraries"
    ]
  },
  {
    "slug": "foreign-tracking-scripts",
    "name": "Foreign Tracking & Ad Scripts Audit",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "low",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Audits advertising and behavioral tracking scripts for compliance with consumer privacy regulations (GDPR, CCPA).",
    "whyItMatters": "Loading non-consented tracking scripts before user acceptance violates GDPR and can result in severe regulatory fines.",
    "howWeCheck": "We identify advertising network scripts executed before cookie banner consent is recorded.",
    "fixes": {
      "nginx": "Ensure consent management platform blocks tracking scripts until consent is granted",
      "apache": "Gate tracking scripts behind user consent cookies",
      "cloudflare": "Use Cloudflare Zaraz with consent management integrations",
      "nextjs": "Conditionally load tracking scripts only after cookie consent state is confirmed"
    },
    "faqs": [
      {
        "q": "Does Google Analytics require consent under GDPR?",
        "a": "Yes, in the EU/EEA, non-essential cookies and analytics require prior opt-in consent."
      }
    ],
    "relatedSlugs": [
      "cookie-consent-banner",
      "privacy-policy-presence"
    ]
  },
  {
    "slug": "polyfill-supply-chain-risk",
    "name": "Polyfill Supply Chain Risk (polyfill.io)",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "critical",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Detects usage of compromised polyfill services (e.g. polyfill.io) that redirect mobile users to malicious landing pages.",
    "whyItMatters": "The polyfill.io domain was sold to a malicious operator that actively distributed malware payloads to millions of websites.",
    "howWeCheck": "We inspect script tags for references to polyfill.io or related compromised domains.",
    "fixes": {
      "nginx": "Remove all polyfill.io script tags and replace with Cloudflare's mirror (cdnjs.cloudflare.com/polyfill) or modern native ES features.",
      "apache": "Remove polyfill.io references immediately",
      "cloudflare": "Cloudflare provides an automated polyfill replacement worker",
      "nextjs": "Next.js polyfills modern browser features automatically; remove manual polyfill scripts."
    },
    "faqs": [
      {
        "q": "Why did polyfill.io become dangerous in 2024?",
        "a": "The domain registration changed ownership and the new owners began serving malicious redirects."
      }
    ],
    "relatedSlugs": [
      "subresource-integrity-sri",
      "third-party-script-inventory"
    ]
  },
  {
    "slug": "prototype-pollution-vectors",
    "name": "Prototype Pollution Indicators",
    "category": "supply-chain",
    "categoryName": "Dependencies & Supply Chain",
    "severity": "high",
    "tier": "free",
    "icon": "Package",
    "shortDesc": "Analyzes client-side object manipulation utilities for prototype pollution vulnerabilities (Object.prototype.__proto__).",
    "whyItMatters": "Prototype pollution allows attackers to alter JavaScript default object behaviors, leading to denial of service or remote code execution.",
    "howWeCheck": "We analyze recursive merge and query parameter parsers for unsafe __proto__ or constructor.prototype assignments.",
    "fixes": {
      "nginx": "Update Lodash, jQuery, and query-string packages to patched versions",
      "apache": "Freeze Object prototype: Object.freeze(Object.prototype)",
      "cloudflare": "Filter query strings containing __proto__ in WAF",
      "nextjs": "Use Object.create(null) for dictionary maps or Map primitives"
    },
    "faqs": [
      {
        "q": "What is prototype pollution?",
        "a": "Injecting properties into the root JavaScript Object.prototype, which causes all objects in the runtime to inherit the malicious property."
      }
    ],
    "relatedSlugs": [
      "vulnerable-javascript-libraries",
      "dom-based-xss"
    ]
  },
  {
    "slug": "login-page-over-https",
    "name": "Login Page Over HTTPS",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "critical",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Verifies that authentication forms (password, email inputs) and their target action endpoints are served exclusively over HTTPS.",
    "whyItMatters": "Submitting login credentials over unencrypted HTTP exposes cleartext passwords to anyone monitoring local network traffic.",
    "howWeCheck": "We check pages containing password inputs to verify both the hosting page and form action URLs use HTTPS.",
    "fixes": {
      "nginx": "Enforce HTTPS across the entire domain: return 301 https://$host$request_uri;",
      "apache": "Redirect all HTTP auth routes to HTTPS",
      "cloudflare": "Always Use HTTPS in Cloudflare SSL settings",
      "nextjs": "Ensure API authentication endpoints only accept secure requests"
    },
    "faqs": [
      {
        "q": "Can a login form be on HTTP if the POST action is HTTPS?",
        "a": "No! An attacker can modify the form on the insecure HTTP page before submission."
      }
    ],
    "relatedSlugs": [
      "https-enforcement",
      "form-security-analysis"
    ]
  },
  {
    "slug": "password-field-autocomplete",
    "name": "Password Field Autocomplete Policy",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "low",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Ensures sensitive password inputs leverage autocomplete=\"current-password\" or \"new-password\" for password manager integration.",
    "whyItMatters": "Proper autocomplete attributes enable password managers to generate high-entropy passwords and prevent clipboard exposure.",
    "howWeCheck": "We verify that input[type=\"password\"] fields declare appropriate autocomplete attributes.",
    "fixes": {
      "nginx": "<input type=\"password\" name=\"password\" autocomplete=\"current-password\" required>",
      "apache": "Configure form attributes in HTML templates",
      "cloudflare": "Managed in application frontend code",
      "nextjs": "<input type=\"password\" autoComplete=\"current-password\" />"
    },
    "faqs": [
      {
        "q": "Should autocomplete be set to off for passwords?",
        "a": "No, modern security standards recommend autocomplete=\"current-password\" to encourage password manager use."
      }
    ],
    "relatedSlugs": [
      "login-page-over-https",
      "multi-factor-authentication"
    ]
  },
  {
    "slug": "multi-factor-authentication",
    "name": "Multi-Factor Authentication (MFA) Support",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "low",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Checks whether account portals support two-factor authentication (TOTP, WebAuthn/Passkeys, or SMS).",
    "whyItMatters": "MFA blocks 99.9% of automated account takeover attacks even when passwords have been compromised in third-party data breaches.",
    "howWeCheck": "We inspect account settings and authentication flows for MFA enrollment options and WebAuthn API support.",
    "fixes": {
      "nginx": "Integrate WebAuthn or TOTP (speakeasy, otplib) in your authentication service",
      "apache": "Enable 2FA on admin consoles",
      "cloudflare": "Require MFA on Cloudflare Zero Trust Access policies",
      "nextjs": "Implement Passkey / WebAuthn authentication via @simplewebauthn"
    },
    "faqs": [
      {
        "q": "Are Passkeys more secure than SMS 2FA?",
        "a": "Yes! Passkeys (FIDO2/WebAuthn) are cryptographically bound to the domain and completely immune to phishing."
      }
    ],
    "relatedSlugs": [
      "login-page-over-https",
      "session-token-entropy"
    ]
  },
  {
    "slug": "session-token-entropy",
    "name": "Session Token Shannon Entropy Analysis",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Measures the randomness and bit-length of session identifiers to verify protection against session prediction attacks.",
    "whyItMatters": "Low-entropy or sequential session cookies allow attackers to calculate valid session IDs and hijack user accounts without passwords.",
    "howWeCheck": "We calculate Shannon entropy on issued session cookies to confirm they contain at least 128 bits of cryptographically secure pseudorandomness.",
    "fixes": {
      "nginx": "# Use crypto.randomBytes(32).toString('hex') for session tokens",
      "apache": "Ensure session IDs use cryptographic PRNGs (e.g. /dev/urandom)",
      "cloudflare": "Rely on secure authentication session providers (NextAuth, Supabase, Clerk)",
      "nextjs": "Use crypto.randomUUID() or standard crypto primitives for session tokens"
    },
    "faqs": [
      {
        "q": "How long should a session token be?",
        "a": "At least 128 bits (16 random bytes), typically encoded as a 32-character hexadecimal string or 24-character base64 string."
      }
    ],
    "relatedSlugs": [
      "secure-cookies",
      "login-page-over-https"
    ]
  },
  {
    "slug": "dom-based-xss",
    "name": "DOM-Based XSS Sink Analysis",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "high",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Scans frontend JavaScript for dangerous execution sinks (eval, document.write, innerHTML, location.href) fed by unvalidated inputs.",
    "whyItMatters": "DOM XSS occurs directly inside the visitor’s browser and executes attacker payloads without touching the origin web server.",
    "howWeCheck": "We analyze client scripts for dangerous patterns where URL hash, search parameters, or postMessage feed directly into HTML injection sinks.",
    "fixes": {
      "nginx": "Use textContent instead of innerHTML; use DOMPurify when rendering rich HTML",
      "apache": "Sanitize client-side DOM insertions with DOMPurify",
      "cloudflare": "Implement Content-Security-Policy with require-trusted-types-for 'script'",
      "nextjs": "// Avoid dangerouslySetInnerHTML without sanitizing via DOMPurify: DOMPurify.sanitize(input)"
    },
    "faqs": [
      {
        "q": "How does DOM XSS differ from Reflected XSS?",
        "a": "Reflected XSS involves the server echoing input into HTML, while DOM XSS happens entirely in the client-side JavaScript execution."
      }
    ],
    "relatedSlugs": [
      "inline-script-analysis",
      "content-security-policy-csp"
    ]
  },
  {
    "slug": "inline-script-analysis",
    "name": "Inline Script Analysis & Event Handlers",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Audits raw <script> blocks and inline event attributes (onclick, onload) that bypass CSP nonce protections.",
    "whyItMatters": "Using inline script blocks prevents the deployment of a strict CSP and increases vulnerability to injection.",
    "howWeCheck": "We parse the HTML DOM for script tags lacking nonce attributes and elements with on* event handlers.",
    "fixes": {
      "nginx": "Move all inline scripts into external .js files or supply cryptographic nonces",
      "apache": "Refactor inline JS into modular script assets",
      "cloudflare": "Add nonces via Cloudflare Workers CSP header transform",
      "nextjs": "Use Next.js Script component or standard component event listeners (onClick={...})"
    },
    "faqs": [
      {
        "q": "Why are inline scripts flagged in security audits?",
        "a": "Because an attacker injecting HTML cannot be distinguished from a legitimate inline script unless cryptographic nonces are enforced."
      }
    ],
    "relatedSlugs": [
      "dom-based-xss",
      "content-security-policy-csp"
    ]
  },
  {
    "slug": "form-security-analysis",
    "name": "Form Security Analysis (Action URLs & CSRF)",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "high",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Audits HTML forms for cross-origin submission targets, missing CSRF token protections, and insecure HTTP actions.",
    "whyItMatters": "Missing CSRF protections allow unauthorized cross-origin requests to submit actions on behalf of authenticated users.",
    "howWeCheck": "We check form action targets for protocol matching and evaluate CSRF token inputs.",
    "fixes": {
      "nginx": "Ensure all forms submit to HTTPS endpoints on the same origin",
      "apache": "Implement Anti-CSRF token verification on state-changing requests",
      "cloudflare": "Protect state-changing endpoints in Cloudflare WAF",
      "nextjs": "// Next.js Server Actions enforce CSRF protection automatically via Origin header validation"
    },
    "faqs": [
      {
        "q": "Does SameSite=Lax prevent CSRF?",
        "a": "SameSite=Lax blocks CSRF for POST and PUT requests, but CSRF tokens provide essential defense-in-depth."
      }
    ],
    "relatedSlugs": [
      "login-page-over-https",
      "secure-cookies"
    ]
  },
  {
    "slug": "clickjacking-defense",
    "name": "Clickjacking & UI Redress Defense",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "high",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Evaluates frame embedding defenses to prevent deceptive UI overlays and clickjacking exploits.",
    "whyItMatters": "Attackers load your application inside an invisible iframe to trick users into executing destructive actions.",
    "howWeCheck": "We verify that Content-Security-Policy frame-ancestors is set to 'none' or 'self' alongside X-Frame-Options: DENY.",
    "fixes": {
      "nginx": "add_header Content-Security-Policy \"frame-ancestors 'none';\" always;\nadd_header X-Frame-Options \"DENY\" always;",
      "apache": "Header always set X-Frame-Options \"DENY\"",
      "cloudflare": "Add frame-ancestors 'none' to response headers",
      "nextjs": "Configure frame-ancestors 'none' in next.config.mjs"
    },
    "faqs": [
      {
        "q": "Can frame-busting JavaScript prevent clickjacking?",
        "a": "No, frame-busting JS can be bypassed using iframe sandbox attributes. HTTP headers are required."
      }
    ],
    "relatedSlugs": [
      "x-frame-options",
      "content-security-policy-csp"
    ]
  },
  {
    "slug": "cross-tab-opener-leakage",
    "name": "Cross-Tab Opener Leakage (rel=\"noopener\")",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "low",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Ensures external links with target=\"_blank\" declare rel=\"noopener noreferrer\" to prevent reverse tab-nabbing.",
    "whyItMatters": "Without noopener, the opened tab has window.opener access and can navigate your tab to a fraudulent login page.",
    "howWeCheck": "We scan all <a> tags with target=\"_blank\" and flag any missing rel=\"noopener\" or rel=\"noreferrer\".",
    "fixes": {
      "nginx": "<a href=\"https://external.com\" target=\"_blank\" rel=\"noopener noreferrer\">Link</a>",
      "apache": "Ensure template links include rel=\"noopener noreferrer\"",
      "cloudflare": "Managed in application frontend code",
      "nextjs": "Next.js automatically adds rel=\"noopener noreferrer\" to target=\"_blank\" links"
    },
    "faqs": [
      {
        "q": "What is reverse tab-nabbing?",
        "a": "An attack where a newly opened link redirects the parent tab using window.opener.location = \"https://phishing.com\"."
      }
    ],
    "relatedSlugs": [
      "open-redirect-vulnerability",
      "cross-origin-isolation"
    ]
  },
  {
    "slug": "clipboard-hijacking-defense",
    "name": "Clipboard Hijacking Vulnerability",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Scans for suspicious navigator.clipboard writes and copy event listeners that tamper with copied cryptocurrency or terminal strings.",
    "whyItMatters": "Malicious scripts intercept copy events to replace crypto wallet addresses or curl commands with malicious payloads.",
    "howWeCheck": "We analyze script event handlers attached to copy events and navigator.clipboard.writeText calls.",
    "fixes": {
      "nginx": "Audit third-party scripts that request clipboard-write permissions",
      "apache": "Restrict clipboard API access in Permissions-Policy",
      "cloudflare": "Add Permissions-Policy: clipboard-write=(self)",
      "nextjs": "Only invoke navigator.clipboard inside explicit user-triggered button click handlers"
    },
    "faqs": [
      {
        "q": "How do clipboard hijackers work?",
        "a": "They detect when you copy a cryptocurrency address and swap it with the attacker’s wallet address before you paste."
      }
    ],
    "relatedSlugs": [
      "permissions-policy",
      "third-party-script-inventory"
    ]
  },
  {
    "slug": "websocket-encryption-security",
    "name": "WebSocket Encryption (WSS Enforcement)",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "high",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Checks that all WebSocket connections negotiate secure wss:// protocols rather than unencrypted ws:// connections.",
    "whyItMatters": "Unencrypted ws:// connections expose real-time chat messages, financial tickers, and session data to packet sniffing.",
    "howWeCheck": "We analyze WebSocket constructor URLs in script files to verify exclusive use of wss://.",
    "fixes": {
      "nginx": "proxy_set_header Upgrade $http_upgrade;\nproxy_set_header Connection \"Upgrade\";",
      "apache": "RewriteEngine on\nRewriteCond %{HTTP:Upgrade} websocket [NC]\nRewriteRule /(.*) wss://backend/$1 [P,L]",
      "cloudflare": "Enable WebSockets in Cloudflare Network dashboard",
      "nextjs": "const ws = new WebSocket(`wss://${window.location.host}/ws`);"
    },
    "faqs": [
      {
        "q": "Does CSP restrict WebSocket connections?",
        "a": "Yes! The connect-src directive in CSP dictates which wss:// origins the browser may connect to."
      }
    ],
    "relatedSlugs": [
      "https-enforcement",
      "content-security-policy-csp"
    ]
  },
  {
    "slug": "pii-exposure-source-code",
    "name": "PII Exposure in Source Code",
    "category": "client-auth",
    "categoryName": "Auth & Client-Side Security",
    "severity": "medium",
    "tier": "free",
    "icon": "Key",
    "shortDesc": "Scans HTML and script files for exposed Personally Identifiable Information (hardcoded emails, phone numbers, SSNs).",
    "whyItMatters": "Exposing developer or customer PII violates privacy laws and provides attackers with reconnaissance data for social engineering.",
    "howWeCheck": "We run regex detectors for credit card numbers, Social Security Numbers, and phone numbers in rendered HTML.",
    "fixes": {
      "nginx": "Scrub internal email addresses and test data from production HTML builds",
      "apache": "Sanitize production output templates",
      "cloudflare": "Use Cloudflare Email Address Obfuscation to mask emails from scrapers",
      "nextjs": "Do not pass internal user records into public component props"
    },
    "faqs": [
      {
        "q": "Why is PII in HTML comments dangerous?",
        "a": "Developers often leave comments containing customer IDs or personal phone numbers that scrapers easily extract."
      }
    ],
    "relatedSlugs": [
      "data-leak-html-comments",
      "gdpr-compliance-indicators"
    ]
  },
  {
    "slug": "owasp-top-10-mapping",
    "name": "OWASP Top 10 (2021) Control Mapping",
    "category": "compliance",
    "categoryName": "Compliance & Data Privacy",
    "severity": "low",
    "tier": "free",
    "icon": "CheckCircle2",
    "shortDesc": "Maps automated findings against the OWASP Top 10 standard categories (Broken Access Control, Cryptographic Failures, Injection).",
    "whyItMatters": "Provides security engineers and auditors with immediate visibility into alignment with industry standard benchmarks.",
    "howWeCheck": "We correlate detected vulnerabilities with specific OWASP Top 10 control IDs (A01:2021 through A10:2021).",
    "fixes": {
      "nginx": "Implement recommended headers, TLS settings, and input validation",
      "apache": "Review findings mapped to OWASP categories",
      "cloudflare": "Enable Cloudflare OWASP Core Ruleset",
      "nextjs": "Address highlighted vulnerability categories in application logic"
    },
    "faqs": [
      {
        "q": "What is the #1 vulnerability on OWASP Top 10?",
        "a": "Broken Access Control (A01:2021) is currently the most widespread web application vulnerability."
      }
    ],
    "relatedSlugs": [
      "gdpr-compliance-indicators",
      "soc2-readiness-indicators"
    ]
  },
  {
    "slug": "gdpr-compliance-indicators",
    "name": "GDPR Compliance & Cookie Governance",
    "category": "compliance",
    "categoryName": "Compliance & Data Privacy",
    "severity": "low",
    "tier": "free",
    "icon": "CheckCircle2",
    "shortDesc": "Evaluates consent management mechanisms, cookie disclosures, and privacy policy availability under EU GDPR.",
    "whyItMatters": "Non-compliance with GDPR can result in regulatory fines up to €20M or 4% of annual global turnover.",
    "howWeCheck": "We verify the presence of a privacy policy link and evaluate tracking cookie consent controls.",
    "fixes": {
      "nginx": "Ensure consent banners block tracking scripts until explicit user opt-in",
      "apache": "Publish accessible Privacy Policy and Terms links",
      "cloudflare": "Configure Cloudflare Zaraz with GDPR consent enforcement mode",
      "nextjs": "Implement a consent management banner (Klaro, Cookiebot, Osano)"
    },
    "faqs": [
      {
        "q": "Does every website need a Privacy Policy?",
        "a": "Yes, any website collecting user data (including IP addresses, contact forms, or analytics) requires a privacy policy."
      }
    ],
    "relatedSlugs": [
      "privacy-policy-presence",
      "cookie-consent-banner"
    ]
  },
  {
    "slug": "pci-dss-readiness",
    "name": "PCI DSS v4.0 Payment Security Readiness",
    "category": "compliance",
    "categoryName": "Compliance & Data Privacy",
    "severity": "low",
    "tier": "free",
    "icon": "CheckCircle2",
    "shortDesc": "Audits payment form security against PCI DSS requirements (TLS 1.2+, HTTPS enforcement, script integrity on checkout).",
    "whyItMatters": "Failure to protect cardholder data environments results in hefty fines, loss of merchant processing, and legal liability.",
    "howWeCheck": "We verify TLS encryption, cipher standards, and script governance on checkout pages.",
    "fixes": {
      "nginx": "Enforce TLS 1.2+ and use hosted payment fields (Stripe Elements, Braintree)",
      "apache": "Strictly isolate cardholder data environments",
      "cloudflare": "Use Cloudflare Page Shield to satisfy PCI DSS 4.0 Requirement 6.4.3 (script management on payment pages)",
      "nextjs": "Never handle raw credit card numbers directly on origin servers; use tokenized iframe elements"
    },
    "faqs": [
      {
        "q": "What does PCI DSS 4.0 require for client scripts?",
        "a": "Requirement 6.4.3 mandates an inventory and integrity verification of all scripts loaded on payment pages."
      }
    ],
    "relatedSlugs": [
      "vulnerable-javascript-libraries",
      "tls-version"
    ]
  },
  {
    "slug": "soc2-readiness-indicators",
    "name": "SOC 2 Type II Security Readiness Indicators",
    "category": "compliance",
    "categoryName": "Compliance & Data Privacy",
    "severity": "low",
    "tier": "free",
    "icon": "CheckCircle2",
    "shortDesc": "Assesses security controls supporting SOC 2 Trust Services Criteria (Security, Confidentiality, and Availability).",
    "whyItMatters": "Demonstrates baseline technical hygiene for enterprise B2B vendors undergoing SOC 2 security audits.",
    "howWeCheck": "We check for enforced encryption in transit, external vulnerability scanning hygiene, and access control headers.",
    "fixes": {
      "nginx": "Enforce strict HTTPS, HSTS, secure cookies, and automated vulnerability monitoring",
      "apache": "Maintain automated logging and security headers",
      "cloudflare": "Enable Cloudflare WAF and DDoS mitigation",
      "nextjs": "Document continuous monitoring and vulnerability scanning cadences"
    },
    "faqs": [
      {
        "q": "How does automated scanning help with SOC 2?",
        "a": "Auditors require evidence of continuous automated external vulnerability scanning and remediation tracking."
      }
    ],
    "relatedSlugs": [
      "owasp-top-10-mapping",
      "hipaa-basic-checks"
    ]
  },
  {
    "slug": "hipaa-basic-checks",
    "name": "HIPAA Basic Security Safeguards",
    "category": "compliance",
    "categoryName": "Compliance & Data Privacy",
    "severity": "low",
    "tier": "free",
    "icon": "CheckCircle2",
    "shortDesc": "Checks technical transmission security safeguards (encryption in transit) required for protected health information (ePHI).",
    "whyItMatters": "HIPAA Security Rule § 164.312 requires covered entities to implement mechanism to encrypt ePHI in transit.",
    "howWeCheck": "We evaluate end-to-end TLS encryption strength and verify absence of plaintext transmission.",
    "fixes": {
      "nginx": "ssl_protocols TLSv1.2 TLSv1.3;\nadd_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" always;",
      "apache": "Enforce modern TLS encryption for all endpoints",
      "cloudflare": "Enable end-to-end Full (Strict) SSL encryption mode",
      "nextjs": "Ensure any healthcare intake forms transmit exclusively over verified encrypted channels"
    },
    "faqs": [
      {
        "q": "Does HTTPS satisfy HIPAA transmission requirements?",
        "a": "Yes, enforcing modern TLS 1.2+ across all data transmission satisfies the HIPAA Technical Safeguards standard."
      }
    ],
    "relatedSlugs": [
      "tls-version",
      "https-enforcement"
    ]
  },
  {
    "slug": "pii-exposure-in-html",
    "name": "PII Exposure in Rendered HTML",
    "category": "compliance",
    "categoryName": "Compliance & Data Privacy",
    "severity": "high",
    "tier": "free",
    "icon": "CheckCircle2",
    "shortDesc": "Scans public HTML for leaked sensitive personal data including national identification numbers, credit cards, or internal email patterns.",
    "whyItMatters": "Unintended exposure of customer data in HTML source violates GDPR, CCPA, and privacy mandates.",
    "howWeCheck": "We parse rendered page source for regular expressions matching sensitive identifiers.",
    "fixes": {
      "nginx": "Filter internal debug metadata from public response bodies",
      "apache": "Ensure template engines do not print full user models",
      "cloudflare": "Scrub sensitive patterns using Cloudflare Workers if needed",
      "nextjs": "Only serialize the exact necessary fields in server component props"
    },
    "faqs": [
      {
        "q": "How does PII leak into HTML unnoticed?",
        "a": "When developers pass entire user database records to client components, hidden fields get serialized into JSON script tags."
      }
    ],
    "relatedSlugs": [
      "data-leak-html-comments",
      "gdpr-compliance-indicators"
    ]
  },
  {
    "slug": "data-leak-html-comments",
    "name": "Data Leaks in HTML Comments",
    "category": "compliance",
    "categoryName": "Compliance & Data Privacy",
    "severity": "medium",
    "tier": "free",
    "icon": "CheckCircle2",
    "shortDesc": "Inspects HTML source code for un-stripped developer comments (<!-- TODO: ... -->) leaking internal paths or credentials.",
    "whyItMatters": "Comments frequently reveal developer names, internal JIRA ticket keys, staging server URLs, or passwords.",
    "howWeCheck": "We extract all HTML comments <!-- ... --> and analyze them for sensitive keywords and internal network addresses.",
    "fixes": {
      "nginx": "Enable HTML minification to strip comments in production builds",
      "apache": "Configure build minification in CI/CD",
      "cloudflare": "Enable \"Auto Minify -> HTML\" in Cloudflare Speed settings",
      "nextjs": "Next.js production builds automatically strip HTML comments"
    },
    "faqs": [
      {
        "q": "Does HTML minification remove comments?",
        "a": "Yes, standard production bundlers strip all non-conditional HTML comments."
      }
    ],
    "relatedSlugs": [
      "pii-exposure-in-html",
      "source-map-exposure"
    ]
  },
  {
    "slug": "privacy-policy-presence",
    "name": "Privacy Policy & Terms Link Presence",
    "category": "compliance",
    "categoryName": "Compliance & Data Privacy",
    "severity": "low",
    "tier": "free",
    "icon": "CheckCircle2",
    "shortDesc": "Verifies the website contains a clear, crawlable link to an accessible Privacy Policy in the page footer or navigation.",
    "whyItMatters": "Required by global privacy laws (CalOPPA, GDPR) and advertising networks (Google Ads, Meta).",
    "howWeCheck": "We search DOM anchor tags for links containing \"privacy\", \"privacy policy\", or \"terms\".",
    "fixes": {
      "nginx": "Add clear footer links: <a href=\"/privacy\">Privacy Policy</a>",
      "apache": "Ensure footer includes privacy policy links",
      "cloudflare": "Verify links in site template",
      "nextjs": "<Link href=\"/privacy\">Privacy Policy</Link> in Footer component"
    },
    "faqs": [
      {
        "q": "Is a Privacy Policy legally required even for blogs?",
        "a": "Yes, if your blog uses analytics, contact forms, or display ads that collect user IP addresses or cookies."
      }
    ],
    "relatedSlugs": [
      "cookie-consent-banner",
      "gdpr-compliance-indicators"
    ]
  },
  {
    "slug": "cookie-consent-banner",
    "name": "Cookie Consent & Tracking Banner",
    "category": "compliance",
    "categoryName": "Compliance & Data Privacy",
    "severity": "low",
    "tier": "free",
    "icon": "CheckCircle2",
    "shortDesc": "Checks for the presence of an active Cookie Consent banner or Consent Management Platform (CMP) for visitor privacy.",
    "whyItMatters": "Enables users to accept or decline tracking cookies before data collection begins, as mandated by the EU ePrivacy Directive.",
    "howWeCheck": "We look for standard consent banner DOM elements and CMP scripts (OneTrust, Cookiebot, Termly, Klaro).",
    "fixes": {
      "nginx": "Integrate a compliant CMP banner and gate non-essential scripts",
      "apache": "Deploy CMP on all customer-facing pages",
      "cloudflare": "Integrate consent management via Cloudflare Zaraz",
      "nextjs": "Add a lightweight React Cookie Consent component"
    },
    "faqs": [
      {
        "q": "What happens if tracking cookies fire before consent?",
        "a": "Data protection authorities (such as the CNIL) consider this a direct violation of privacy laws."
      }
    ],
    "relatedSlugs": [
      "privacy-policy-presence",
      "gdpr-compliance-indicators"
    ]
  }
];

export function getCheckBySlug(slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();
  return SECURITY_CHECKS.find((c) => c.slug === normalized) || null;
}

export function getChecksByCategory(category) {
  if (!category || category === 'all') return SECURITY_CHECKS;
  return SECURITY_CHECKS.filter((c) => c.category === category);
}
