/**
 * lib/landingContent.js
 * Single source of truth for the public marketing site.
 *
 * Every capability listed here maps to a real, shipped check in
 * lib/scanners/* or a real product surface. Nothing aspirational.
 * Keyword choices come from the competitor keyword-intelligence
 * workbooks in the project root (Profound, AI Rank Lab, Ahrefs,
 * Semrush, Astra).
 */
import {
  Shield,
  Search,
  Sparkles,
  Bot,
  Target,
  Activity,
  Smartphone,
} from 'lucide-react';

/**
 * Master switch for the public sign-up / log-in / "Get Started" / upgrade CTAs
 * across the marketing site. Set to `false` to temporarily hide all auth/upgrade
 * buttons (e.g. during an upgrade window); `true` = normal, buttons visible.
 */
export const SHOW_AUTH_CTAS = true;

/** AI engines the platform actually checks against (robots directives, live queries). */
export const AI_ENGINES = ['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Google AI Overviews', 'Copilot'];

export const NAV_PLATFORM = [
  {
    href: '/landing/features/security-scanner',
    icon: Shield,
    accent: 'text-scanner-security',
    bgSoft: 'bg-scanner-security/10',
    title: 'Security Scanner',
    description: '90+ checks: headers, TLS, secret & CVE detection, domain reputation & AI analysis',
  },
  {
    href: '/landing/features/seo-audit',
    icon: Search,
    accent: 'text-scanner-seo',
    bgSoft: 'bg-scanner-seo/10',
    title: 'SEO Audit',
    description: '30+ checks: technical, on-page, schema, links & Core Web Vitals',
  },
  {
    href: '/landing/features/aeo-audit',
    icon: Sparkles,
    accent: 'text-scanner-aeo',
    bgSoft: 'bg-scanner-aeo/10',
    title: 'AEO Audit',
    description: '28+ checks across 8 AI crawlers - get cited by ChatGPT & Perplexity',
  },
  {
    href: '/landing/features/geo-audit',
    icon: Bot,
    accent: 'text-scanner-geo',
    bgSoft: 'bg-scanner-geo/10',
    title: 'GEO Audit',
    description: '33 checks + AI citation simulation: entity authority & citation-worthiness',
  },
  {
    href: '/landing/features/brand-visibility',
    icon: Target,
    accent: 'text-scanner-brand',
    bgSoft: 'bg-scanner-brand/10',
    title: 'Brand Visibility',
    description: 'Live prompt tracking. Is AI recommending your brand?',
  },
  {
    href: '/landing/features/site-health',
    icon: Activity,
    accent: 'text-scanner-health',
    bgSoft: 'bg-scanner-health/10',
    title: 'Site Health',
    description: 'Core Web Vitals & WCAG 2.2 accessibility monitoring',
  },
  {
    href: '/landing/features/aso-audit',
    icon: Smartphone,
    accent: 'text-scanner-aso',
    bgSoft: 'bg-scanner-aso/10',
    title: 'ASO Audit',
    description: '30+ checks: metadata, visuals, ratings & competitive signals — Starter+ plan',
    planBadge: 'Starter+',
  },
];

export const NAV_COMPANY = [
  { href: '/landing/about', title: 'About', description: 'Why we built Igris Radar' },
  { href: '/landing/blog', title: 'Blog', description: 'Insights on AI search and SEO' },
  { href: '/landing/contact', title: 'Contact', description: 'Talk to the team' },
];

/**
 * Per-feature page content, rendered by FeaturePageTemplate.
 * `checks` lists are the real findings each scanner produces.
 */
export const FEATURE_PAGES = {
  'security-scanner': {
    key: 'security',
    icon: Shield,
    accentText: 'text-scanner-security',
    accentBg: 'bg-scanner-security',
    accentBgSoft: 'bg-scanner-security/10',
    accentBorder: 'border-scanner-security/25',
    eyebrow: 'Website Security Scanner',
    h1: 'Find the vulnerabilities attackers look for, before they do',
    sub: 'Run a deep, automated website security audit from a single URL. Igris Radar inspects your headers and TLS, hunts for exposed secrets and sensitive files, cross-checks your JavaScript libraries against live CVE databases, verifies your email anti-spoofing records, maps your public attack surface, and checks your domain against malware blocklists - then an AI analyst turns it all into a plain-language action plan.',
    heroBullets: ['90+ checks across 15 security categories', 'Live CVE detection for your JS libraries', 'AI analysis: threat modeling, OWASP & compliance'],
    stats: [
      { value: 90, suffix: '+', label: 'automated security checks per scan' },
      { value: 15, suffix: '', label: 'security categories, from TLS to threat intel' },
      { value: 5, suffix: '', label: 'severity levels, each with remediation' },
    ],
    categories: [
      {
        title: 'Transport, TLS & header security',
        blurb: 'The response headers and certificate your server presents are your first line of defense. We verify each one and explain exactly what a weakness exposes you to.',
        checks: [
          { name: 'HTTPS & HSTS enforcement', detail: 'Confirms encrypted transport and that browsers refuse downgraded HTTP, blocking man-in-the-middle and protocol-downgrade attacks. Includes HSTS preload eligibility.' },
          { name: 'Content-Security-Policy deep analysis', detail: 'Goes beyond presence - flags unsafe-inline, unsafe-eval, wildcard sources, and missing frame-ancestors that quietly defeat your XSS protection.' },
          { name: 'SSL certificate health', detail: 'Checks expiry, self-signed and chain validity, and key strength (RSA vs ECC aware), plus the negotiated TLS version and Certificate Transparency logging.' },
          { name: 'Cookie hardening', detail: 'Per-cookie Secure / HttpOnly / SameSite checks, plus __Host- / __Secure- prefix verification and session-token entropy analysis.' },
          { name: 'Cross-origin & clickjacking', detail: 'X-Frame-Options, COOP / COEP / CORP isolation, and CORS reflection tests that only flag genuinely exploitable policies - not harmless wildcards.' },
          { name: 'Information disclosure', detail: 'Server and version banners, verbose error pages, and CMS version leaks that hand attackers a ready-made CVE shortlist.' },
        ],
      },
      {
        title: 'Secrets & sensitive exposure',
        blurb: 'One leaked key in a client-side bundle can mean a five-figure cloud bill or a full compromise. We scan everything the public can reach.',
        checks: [
          { name: 'Exposed API keys & tokens', detail: 'Scans HTML and JavaScript for AWS, Google, Stripe, Firebase, Slack, GitHub, SendGrid and private-key patterns anyone could harvest.' },
          { name: 'Exposed files & repositories', detail: 'Probes for reachable .env files, .git / .svn / .hg / .bzr repos, backup archives, and database dumps left in the web root.' },
          { name: 'Source map exposure', detail: 'Detects public .js.map files that hand attackers your original, un-minified source code and business logic.' },
          { name: 'Debug & admin endpoints', detail: 'Finds exposed profilers (/actuator, /server-status) and public admin login panels that invite brute-force attacks.' },
          { name: 'Directory listing & data leaks', detail: 'Open directory indexes, PII in page source, and secrets accidentally left in HTML comments.' },
        ],
      },
      {
        title: 'Vulnerable dependencies & supply chain',
        blurb: 'The code you didn\'t write is still your attack surface. We fingerprint what you load and check it against live vulnerability data.',
        checks: [
          { name: 'Known-vulnerable JS libraries (CVEs)', detail: 'Fingerprints the exact version of every JavaScript library you load and queries the OSV database for published CVEs - pinpointing precisely which version to upgrade to.' },
          { name: 'Outdated WordPress plugins', detail: 'Detects plugin versions from the page and compares them against the official wordpress.org release feed.' },
          { name: 'Subresource Integrity (SRI)', detail: 'Flags external scripts loaded without integrity hashes - the exact vector behind CDN supply-chain attacks.' },
          { name: 'Third-party footprint', detail: 'Inventories every external domain your page loads and the supply-chain risk each one adds.' },
        ],
      },
      {
        title: 'Email, DNS & domain trust',
        blurb: 'Attackers don\'t need your server to impersonate your brand - an unprotected domain is enough to send email as you.',
        checks: [
          { name: 'SPF & DMARC strength', detail: 'Not just presence: flags weak SPF (~all / +all) and monitor-only DMARC (p=none) that look configured but don\'t actually stop spoofing.' },
          { name: 'DKIM, BIMI & MTA-STS', detail: 'Verifies mail-signing keys, verified brand indicators, and strict transport policy for inbound email.' },
          { name: 'DNSSEC & CAA', detail: 'Confirms DNSSEC signing via a validating resolver, and CAA records that restrict which authorities can issue certificates for your domain.' },
        ],
      },
      {
        title: 'Domain reputation & threat intelligence',
        blurb: 'Is your domain - or anything it links to - already flagged as malicious? We check the same threat feeds browsers and mail filters use.',
        checks: [
          { name: 'Malware / phishing blocklist', detail: 'Checks your domain against Cloudflare\'s threat-intelligence resolver. A listing usually means the site is compromised or abused.' },
          { name: 'Outbound link reputation', detail: 'Screens the third-party domains your page loads for known-malicious hosts - a classic sign of injected ads or hacked scripts.' },
          { name: 'Domain age & expiry (RDAP)', detail: 'Flags newly-registered domains (a strong phishing signal) and domains about to lapse (a hijack and downtime risk).' },
          { name: 'Domain risk signals', detail: 'High-abuse TLDs, punycode / homograph, and typosquat-prone naming that hurt trust and email deliverability.' },
        ],
      },
      {
        title: 'Attack surface & active probing',
        blurb: 'We map what an attacker sees first - every public subdomain, and the endpoints most likely to be exploited.',
        checks: [
          { name: 'Subdomain enumeration', detail: 'Discovers your public subdomains from Certificate Transparency logs - the same passive recon attackers run before an attack.' },
          { name: 'Subdomain takeover', detail: 'Tests discovered subdomains for dangling CNAMEs pointing at unclaimed S3, Heroku, GitHub Pages and similar services an attacker could hijack.' },
          { name: 'Open redirects & GraphQL introspection', detail: 'Probes for unvalidated redirect parameters and exposed GraphQL schemas that leak your entire API surface.' },
          { name: 'Exposed services & ports', detail: 'Checks for open database / admin ports and misconfigured endpoints reachable from the public internet.' },
        ],
      },
    ],
    reportPoints: [
      'Severity-ranked findings from critical to low, with every passed check listed for your records',
      'A "why this matters" and "how we test this" explanation on every finding, plus copy-paste remediation and an agent-native AI fix prompt',
      'Streaming AI security analysis: a plain-language executive summary, prioritized top risks, and a remediation plan that writes itself out section by section',
      'On higher tiers the AI adds attack-chain threat modeling, OWASP Top 10 mapping, ready-to-paste config snippets, and GDPR / PCI compliance readiness',
      'A 0-100 security score tracked scan-over-scan, with continuous monitoring and email alerts on higher plans',
    ],
    faqs: [
      { q: 'What is a website security scanner?', a: 'A website security scanner is an automated tool that inspects a live website for misconfigurations and exposures. Igris Radar runs 90+ checks across 15 categories - headers, TLS, exposed secrets, vulnerable libraries, email records, domain reputation, and public attack surface - from a single URL, and returns a severity-ranked report with an AI-written action plan in under a minute.' },
      { q: 'Does it detect vulnerable JavaScript libraries?', a: 'Yes. We fingerprint the exact version of every JavaScript library your page loads and check each one against the OSV vulnerability database, which aggregates GitHub, npm and other advisories. You get the specific CVEs and the version to upgrade to - not a generic "update your dependencies."' },
      { q: 'Can it find subdomains and takeover risks?', a: 'Yes. Igris Radar enumerates your public subdomains from Certificate Transparency logs, then tests each one for subdomain takeover - dangling DNS records pointing at unclaimed third-party services like S3 or Heroku that an attacker could claim to serve content from your domain.' },
      { q: 'What does the AI security analysis do?', a: 'After the scan, an AI analyst reviews your findings and streams back a plain-language report: an executive summary and prioritized risks on every paid tier, plus attack-chain threat modeling, OWASP Top 10 mapping, copy-paste remediation code, and GDPR / PCI compliance readiness on the Agency plan. It turns a list of findings into a clear plan of what to fix first and why.' },
      { q: 'Is this a penetration test?', a: 'No. A penetration test is a manual engagement by security experts. Igris Radar is a continuous, automated security audit - the layer you run weekly to catch configuration drift, leaked keys, vulnerable dependencies, and missing headers between deeper engagements.' },
      { q: 'Do I need to install anything?', a: 'No agents, no DNS changes, no code snippets. Enter a URL and the scanner analyses everything visible from the outside - the same vantage point an attacker has.' },
    ],
    references: [
      { label: 'Web application security', source: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Web_application_security' },
      { label: 'OWASP Secure Headers Project', source: 'OWASP', href: 'https://owasp.org/www-project-secure-headers/' },
      { label: 'OSV - Open Source Vulnerabilities database', source: 'OSV', href: 'https://osv.dev/' },
    ],
    ctaTitle: 'Scan your site for vulnerabilities now',
    ctaSub: 'Free plan includes 10 full scans a month. No credit card required.',
  },

  'seo-audit': {
    key: 'seo',
    icon: Search,
    accentText: 'text-scanner-seo',
    accentBg: 'bg-scanner-seo',
    accentBgSoft: 'bg-scanner-seo/10',
    accentBorder: 'border-scanner-seo/25',
    eyebrow: 'SEO Audit Tool',
    h1: 'Run a complete SEO audit in minutes, not billable hours',
    sub: 'Technical SEO, on-page signals, structured data, link health, and Core Web Vitals in one scan - 30+ checks. See exactly what\'s holding back your search visibility, with a prioritized fix list and a competitor comparison to show where you fall behind.',
    heroBullets: ['Technical + on-page + schema + links + speed', 'Side-by-side competitor analysis', 'Multi-page crawl & AI deep analysis'],
    stats: [
      { value: 30, suffix: '+', label: 'SEO checks across 4 categories' },
      { value: 3, suffix: '', label: 'Core Web Vitals pulled from Google PageSpeed (Pro)' },
      { value: 100, suffix: '', label: 'point SEO score, tracked over time' },
    ],
    categories: [
      {
        title: 'Technical SEO & performance',
        blurb: 'If crawlers can\'t reach, render, and index your pages fast, nothing else matters. This is the foundation layer of every site audit - now including the Core Web Vitals Google uses as ranking signals.',
        checks: [
          { name: 'HTTPS enforcement', detail: 'Confirms your pages are served over secure HTTPS, a baseline ranking and trust signal.' },
          { name: 'robots.txt configuration', detail: 'Confirms search engines are told what they can and cannot crawl, and that you aren\'t blocking pages you need indexed.' },
          { name: 'XML sitemap presence', detail: 'Verifies a sitemap lists your important pages so crawlers find and index them faster.' },
          { name: 'Canonical URLs', detail: 'Checks canonical tags resolve duplicate-content issues so ranking signals consolidate on one URL.' },
          { name: 'Meta robots indexability', detail: 'Catches stray noindex directives silently removing pages from search results.' },
          { name: 'Response time (TTFB)', detail: 'Measures server responsiveness. Slow first bytes hurt both rankings and crawl budget.' },
          { name: 'Mobile friendliness', detail: 'Validates the viewport configuration Google\'s mobile-first indexing depends on.' },
          { name: 'Semantic HTML structure', detail: 'Checks for HTML5 landmarks (<nav>, <main>, <article>, <footer>) that help crawlers understand your layout.' },
          { name: 'Hreflang tags', detail: 'Checks language and region targeting for international sites.' },
          { name: 'URL structure', detail: 'Flags unreadable URLs. Clean, semantic paths improve both relevance signals and click-through.' },
          { name: 'Core Web Vitals - LCP, CLS, FCP (Pro)', detail: 'Pulls your real Largest Contentful Paint, Cumulative Layout Shift, and First Contentful Paint from Google PageSpeed Insights - the field metrics Google ranks on.' },
        ],
      },
      {
        title: 'On-page SEO',
        blurb: 'The content-level signals search engines read first: titles, descriptions, headings, media, and the substance of the page itself.',
        checks: [
          { name: 'Title tag optimization', detail: 'Length and keyword checks on the single strongest on-page ranking factor.' },
          { name: 'Meta descriptions', detail: 'Flags missing or truncated descriptions that depress your click-through rate on the results page.' },
          { name: 'Duplicate title / description', detail: 'Catches identical title and meta description text that wastes a chance to add context and keywords.' },
          { name: 'H1 hierarchy', detail: 'Verifies exactly one H1 exists and headings descend logically, forming the outline crawlers parse.' },
          { name: 'Title/H1 keyword alignment', detail: 'Confirms your title and H1 reinforce the same core topic.' },
          { name: 'Keyword prominence', detail: 'Checks whether your primary keyword appears early - within the first 100 words - where engines weight it most.' },
          { name: 'Image alt text', detail: 'Finds images missing alt attributes, an accessibility failure and lost image-search traffic.' },
          { name: 'Modern image formats & lazy loading', detail: 'Flags PNG/JPG served instead of WebP/AVIF, and below-the-fold images that don\'t defer loading - both slow the page and hurt Core Web Vitals.' },
          { name: 'Thin content detection', detail: 'Flags pages whose word count is too low to compete for meaningful terms.' },
          { name: 'Content readability', detail: 'Scores how easily your content reads. Engagement metrics feed back into rankings.' },
        ],
      },
      {
        title: 'Structured data',
        blurb: 'Schema markup is how you qualify for rich results, power local search, and - increasingly - how AI systems parse your pages.',
        checks: [
          { name: 'Schema.org JSON-LD', detail: 'Detects and validates the structured data Google recommends for rich snippets.' },
          { name: 'Schema types inventory', detail: 'Lists every schema type on the page so you know which rich results you\'re eligible for.' },
          { name: 'Open Graph tags', detail: 'Verifies how your pages render when shared on LinkedIn and Facebook.' },
          { name: 'Twitter Card tags', detail: 'Checks the markup that controls your appearance on X.' },
          { name: 'Local SEO NAP consistency (Pro)', detail: 'Validates your LocalBusiness schema for consistent Name, Address, and Phone - the signals behind local pack and map rankings.' },
        ],
      },
      {
        title: 'Link health',
        blurb: 'Internal links distribute authority through your site. Broken ones and redirect chains leak it.',
        checks: [
          { name: 'Broken internal links', detail: 'Finds dead ends that waste crawl budget and frustrate users.' },
          { name: 'Internal link count & density', detail: 'Measures whether your pages are connected enough to establish topical hierarchy.' },
          { name: 'Nofollow on internal links', detail: 'Catches nofollow attributes accidentally blocking PageRank flow inside your own site.' },
          { name: 'Anchor text quality', detail: 'Flags "click here" anchors that waste relevance signals.' },
          { name: 'External link protocols', detail: 'Identifies outbound links to insecure HTTP destinations.' },
          { name: 'Redirect chains (Pro)', detail: 'Detects internal links that bounce through two or more redirects before resolving, wasting crawl budget and diluting link equity.' },
        ],
      },
    ],
    reportPoints: [
      'Category-level scores for Technical, On-Page, Structured Data, and Link Health',
      'Findings organized by plan tier - Free, Starter, Pro, and Agency - so you see exactly what each level unlocks',
      'SERP preview that shows your title and description as Google renders them',
      'Competitor comparison: run the same audit on a rival URL and see the gap category by category',
      'Multi-page crawl plus AI deep analysis (Pro/Agency): title suggestions, keyword and search-intent mapping, LSI keyword gap analysis, a semantic coverage score, and an E-E-A-T estimate',
    ],
    faqs: [
      { q: 'What is an SEO audit?', a: 'An SEO audit is a systematic review of the factors that determine how well your site can rank in search engines: crawlability, indexation, on-page content signals, structured data, link health, and page speed. Igris Radar automates 30+ of these checks - including real Core Web Vitals from Google PageSpeed - and returns a scored, prioritized report in minutes.' },
      { q: 'How is this different from a site crawler like Screaming Frog?', a: 'Desktop crawlers give you raw data and leave interpretation to you. Igris Radar scores every finding, explains why it matters in plain language, generates a fix prompt for each issue, and tracks your score over time. Analysis is included, not just extraction.' },
      { q: 'Does it measure Core Web Vitals?', a: 'Yes. On Pro plans the audit pulls your real Largest Contentful Paint, Cumulative Layout Shift, and First Contentful Paint from Google PageSpeed Insights - the field metrics Google uses as ranking signals - and rates each good / needs-improvement / poor.' },
      { q: 'Can I compare my site against a competitor?', a: 'Yes. Add a competitor URL to any scan and we run the identical audit on both sites, then show a side-by-side category breakdown of exactly where you lead and where you trail.' },
      { q: 'What does the AI deep analysis add?', a: 'On Pro and Agency plans, Gemini-powered deep analysis reviews your actual content and returns title suggestions, a meta description strategy, keyword and search-intent analysis, an LSI keyword gap analysis, a semantic coverage score, and an E-E-A-T estimate.' },
    ],
    references: [
      { label: 'Search engine optimization', source: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Search_engine_optimization' },
      { label: 'Google Search Central documentation', source: 'Google', href: 'https://developers.google.com/search/docs' },
    ],
    ctaTitle: 'Audit your search visibility now',
    ctaSub: 'Your first SEO report is minutes away. Free plan, no credit card.',
  },

  'aeo-audit': {
    key: 'aeo',
    icon: Sparkles,
    accentText: 'text-scanner-aeo',
    accentBg: 'bg-scanner-aeo',
    accentBgSoft: 'bg-scanner-aeo/10',
    accentBorder: 'border-scanner-aeo/25',
    eyebrow: 'Answer Engine Optimization',
    h1: 'Get your content cited by ChatGPT, Claude, and Perplexity',
    sub: 'AEO is the new SEO. When millions ask AI assistants instead of searching, the brands that get cited win. Our AEO audit measures whether answer engines can crawl, parse, and confidently cite your content, then tells you exactly what to fix.',
    heroBullets: ['8 AI crawlers verified in robots.txt', 'Answer-ready content structure', 'Citation-readiness & trust signals'],
    stats: [
      { value: 28, suffix: '+', label: 'AEO checks across 3 categories' },
      { value: 8, suffix: '', label: 'AI crawlers verified: GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Googlebot, Bytespider, CCBot, Applebot' },
      { value: 100, suffix: '', label: 'point AI-readiness score' },
    ],
    categories: [
      {
        title: 'AI crawlability',
        blurb: 'Before an answer engine can cite you, its crawler has to be allowed in - and it has to be able to read your content without running JavaScript. Most sites block AI bots without knowing it.',
        checks: [
          { name: 'OpenAI GPTBot access', detail: 'Verifies ChatGPT\'s crawler can ingest your content, the prerequisite for being cited in its answers.' },
          { name: 'Anthropic ClaudeBot access', detail: 'Confirms Claude\'s crawler isn\'t blocked in your robots.txt.' },
          { name: 'PerplexityBot access', detail: 'Perplexity cites sources in real time. A blocked crawler means zero visibility in its answers.' },
          { name: 'Google-Extended & Googlebot access', detail: 'Checks the Google-Extended directive that governs Gemini training, plus Googlebot itself - which generates Google\'s AI Overviews in Search.' },
          { name: 'Expanded bot coverage (Starter)', detail: 'Also verifies ByteDance Bytespider (TikTok AI), Common Crawl CCBot (a core LLM training set), and Applebot-Extended (Apple Intelligence).' },
          { name: 'Meta AI indexing directives', detail: 'Flags noai / noimageai meta tags that explicitly opt your page out of AI indexing.' },
          { name: 'Crawl delay limits', detail: 'Flags aggressive crawl-delay rules that throttle AI crawlers out of your content.' },
          { name: 'llms.txt & ai.txt presence', detail: 'Detects the emerging llms.txt / ai.txt standards that give AI models a clean, structured summary of your site.' },
          { name: 'JavaScript rendering dependency (Pro)', detail: 'Most AI bots don\'t execute JavaScript. This flags pages whose content only appears after client-side rendering, invisible to those crawlers.' },
          { name: 'Bot-optimized response time (Pro)', detail: 'AI crawlers use strict timeout budgets. Measures your TTFB against the tighter threshold they abandon a fetch at.' },
        ],
      },
      {
        title: 'Answer-ready content structure',
        blurb: 'AI engines extract answers, not pages. Content structured as questions, direct answers, definitions, and lists gets reproduced; walls of text get skipped.',
        checks: [
          { name: 'Q&A formatting', detail: 'Checks whether headings are phrased as the questions users actually ask AI assistants.' },
          { name: 'Direct answer paragraphs', detail: 'Verifies each heading is followed by a concise, definitive paragraph, the snippet AI engines lift verbatim.' },
          { name: 'Definition / summary block', detail: 'Checks for a short opening paragraph (under 60 words) near the H1 - the ideal length AIs extract as a direct answer.' },
          { name: 'Heading hierarchy depth', detail: 'Confirms heading levels nest without skipping ranks so engines can follow your topic tree.' },
          { name: 'Structured lists & data tables', detail: 'Confirms complex information is broken into lists and tables, the formats LLMs parse and compare most reliably.' },
          { name: 'FAQ & HowTo schema', detail: 'Validates the rich Schema.org types that hand answer engines pre-structured Q&A data.' },
          { name: 'Answer box formatting score (Starter)', detail: 'Scores whether your Q&A answers are concise (under 50 words) and open with a definitive, non-hedging statement - the shape of a clean answer box.' },
          { name: 'Code examples & snippets (Starter)', detail: 'Detects runnable code blocks. AI coding assistants preferentially cite pages with concrete examples.' },
          { name: 'Structured data completeness (Pro)', detail: 'Validates that your FAQ / HowTo JSON-LD has every required field populated (question name, answer text, step arrays), not just present.' },
        ],
      },
      {
        title: 'Citation-readiness',
        blurb: 'AI engines weigh trust signals when choosing whom to cite. These checks measure whether your content earns the citation.',
        checks: [
          { name: 'Author & freshness signals', detail: 'Verifies identifiable authorship and visible publication dates. AI engines prefer accountable, current sources.' },
          { name: 'Canonical source attribution', detail: 'Ensures your domain gets credited as the original source, not a scraper or syndicator.' },
          { name: 'Expert credentials (E-E-A-T)', detail: 'Checks author bios and Person schema that establish the expertise behind your content.' },
          { name: 'Publisher identity schema', detail: 'Looks for Organization / WebSite JSON-LD that tells AI engines who stands behind the content.' },
          { name: 'Last-modified freshness', detail: 'Checks for article:modified_time or dateModified signals. AIs deprioritize stale content.' },
          { name: 'Source citations', detail: 'Confirms outbound links to authoritative references. Models trust content that shows its work.' },
          { name: 'Internal link context (Starter)', detail: 'Flags generic anchor text ("click here", "read more") that wastes the signals AIs use to map how your pages relate.' },
        ],
      },
    ],
    reportPoints: [
      'AI-readiness score with category breakdown: Crawlability, Content Structure, Citation-Readiness',
      'Findings organized by plan tier - Free, Starter, Pro, and Agency - so you see exactly what each level unlocks',
      'An AI answer preview showing how an answer engine would extract and present your content',
      'Competitor AEO comparison that shows who\'s better positioned to be cited in your space',
      'Agency AI intelligence: answer-engine simulation, question-coverage gap analysis, factual-density scoring, and content-freshness AI scoring',
    ],
    faqs: [
      { q: 'What is AEO (Answer Engine Optimization)?', a: 'Answer Engine Optimization is the practice of structuring your content so AI assistants such as ChatGPT, Claude, Perplexity, and Gemini can crawl it, extract accurate answers from it, and cite your brand as the source. It\'s the AI-era counterpart to SEO: instead of ranking on a results page, you\'re competing to be the answer. Igris Radar runs 28+ AEO checks across crawlability, content structure, and citation-readiness.' },
      { q: 'How is AEO different from SEO?', a: 'SEO optimizes for ranked lists of links; AEO optimizes for being quoted inside a single generated answer. The technical foundations overlap, especially crawlability and structured data, but AEO adds AI-crawler access, question-formatted content, direct-answer paragraphs, and citation trust signals.' },
      { q: 'Which AI crawlers does the audit check?', a: 'It verifies robots.txt access for eight crawlers: OpenAI\'s GPTBot, Anthropic\'s ClaudeBot, PerplexityBot, Google-Extended (Gemini) and Googlebot (AI Overviews), plus ByteDance Bytespider, Common Crawl CCBot, and Applebot-Extended. It also flags crawl-delay throttling, noai meta directives, and whether AI bots can read your content without JavaScript.' },
      { q: 'What is llms.txt?', a: 'llms.txt is an emerging convention: a markdown file at your site root that gives language models a clean, curated summary of your site\'s content and rules. Our audit detects whether you have one (or an ai.txt) and flags it as an opportunity if you don\'t.' },
      { q: 'How do I know if AI engines can cite my content?', a: 'Run the audit. It scores the three things citation depends on: whether AI crawlers can access and render your pages, whether your content is structured for answer extraction, and whether your trust signals justify the citation. Higher tiers add AI answer-engine simulation and question-coverage gap analysis.' },
    ],
    references: [
      { label: 'Question answering', source: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Question_answering' },
      { label: 'The llms.txt specification', source: 'llmstxt.org', href: 'https://llmstxt.org' },
    ],
    ctaTitle: 'Check your AI visibility now',
    ctaSub: 'Find out in 60 seconds whether answer engines can cite you.',
  },

  'geo-audit': {
    key: 'geo',
    icon: Bot,
    accentText: 'text-scanner-geo',
    accentBg: 'bg-scanner-geo',
    accentBgSoft: 'bg-scanner-geo/10',
    accentBorder: 'border-scanner-geo/25',
    eyebrow: 'Generative Engine Optimization',
    h1: 'Make generative AI treat your brand as the authority',
    sub: 'GEO goes beyond crawlability: it measures whether generative engines see your site as a trustworthy entity worth citing. Our GEO audit runs 33 checks across entity authority, topical depth, factual density, and AI readability - the signals that decide who gets recommended - then layers on AI citation simulation and knowledge-graph gap analysis.',
    heroBullets: ['33 checks + 4 AI intelligence features', 'Knowledge-graph entity & trust signals', 'Citation simulation and gap analysis'],
    stats: [
      { value: 33, suffix: '+', label: 'GEO checks across 4 signal groups' },
      { value: 4, suffix: '', label: 'AI intelligence features on the Agency tier' },
      { value: 100, suffix: '', label: 'point GEO score with trend tracking' },
    ],
    categories: [
      {
        title: 'Entity authority',
        blurb: 'Generative engines build a knowledge-graph picture of your brand. These checks measure how complete and credible that picture is - so an LLM resolves you to one distinct, trusted entity.',
        checks: [
          { name: 'Author bylines & bios', detail: 'Verifies explicit authorship signals, such as rel=author and Person schema, that establish human expertise behind the content.' },
          { name: 'Knowledge Graph entity signals', detail: 'Checks for @id identifiers in your JSON-LD - the field the Google Knowledge Graph uses to recognize your brand as a distinct entity. Without it, engines can\'t reliably resolve who you are.' },
          { name: 'Contact & trust signals', detail: 'Looks for a verifiable phone, email, postal address, or ContactPoint schema. Generative engines trust entities they can confirm are real and reachable.' },
          { name: 'Social & sameAs links', detail: 'Checks the schema links to verified profiles that help engines assemble your brand\'s knowledge-graph entity.' },
          { name: 'Brand logo detection', detail: 'Confirms your logo is declared in schema so AI citations display your official branding.' },
          { name: 'Publication dates', detail: 'Validates visible created and modified dates. Freshness is a citation tiebreaker for time-sensitive queries.' },
          { name: 'About page linked', detail: 'An accessible About page is a core legitimacy signal engines look for.' },
          { name: 'Entity disambiguation score (Pro)', detail: 'Scores how completely your Organization / WebSite schema is filled in - description, foundingDate, founder, sameAs, logo. Sparse data causes LLMs to confuse your brand with similarly named ones.' },
        ],
      },
      {
        title: 'Topical depth',
        blurb: 'Generative engines favor sources that own a topic completely: original perspectives, coherent clusters, and depth over one-off posts.',
        checks: [
          { name: 'Content depth (word count)', detail: 'Measures whether coverage is substantial enough to serve as a primary source.' },
          { name: 'Unique value proposition', detail: 'Checks whether your opening makes a differentiated claim ("only", "first", "unlike"). AIs prefer to cite original perspectives over commodity, rephrased content.' },
          { name: 'FAQ schema & sections', detail: 'Detects FAQ content and FAQPage schema that map directly onto the questions users put to AI assistants.' },
          { name: 'Subtopic hierarchy (H2/H3)', detail: 'Verifies a clear heading outline AI systems use to parse and extract sections.' },
          { name: 'Breadcrumb trails', detail: 'Checks visible and schema breadcrumbs that reveal your content\'s topical structure.' },
          { name: 'Internal link density', detail: 'Measures the topic clusters that signal domain-level authority to generative engines.' },
          { name: 'Content uniqueness indicators (Starter)', detail: 'Detects first-person research ("we tested", "our data"), case studies, and expert quotes - the signals of original content LLMs preferentially cite.' },
          { name: 'Topical cluster detection (Pro)', detail: 'Analyzes whether your internal links form a coherent pillar-and-cluster structure around a topic, the architecture generative engines reward, rather than scattered navigation.' },
        ],
      },
      {
        title: 'Factual density',
        blurb: 'LLMs cite content they can quote confidently: clean definitions, dated statistics, attributed quotes, and inline-referenced claims.',
        checks: [
          { name: 'Definition format detection', detail: 'Looks for clean "X is..." / "X refers to..." definition patterns - the exact extractable format LLMs lift as a direct answer.' },
          { name: 'Data point density', detail: 'Counts concrete figures, statistics, and dates, the raw material of citable content.' },
          { name: 'Statistic freshness (Starter)', detail: 'Checks whether your statistics carry a year reference ("in 2025", "a 2024 study"). Undated stats get deprioritized in favor of fresher sources.' },
          { name: 'Wikipedia-style inline citations (Starter)', detail: 'Measures whether citations sit inline next to the claim they support, the way Wikipedia does, rather than dumped in a footer - which dramatically increases LLM trust.' },
          { name: 'Quotes & citations markup', detail: 'Checks blockquote and cite elements that make attributions machine-readable.' },
          { name: 'External citations', detail: 'Verifies your content references sources. A bibliography signals research, not opinion.' },
          { name: 'Authoritative source links', detail: 'Detects links to .gov, .edu and academic domains that pass trust by association.' },
          { name: 'Comparison & "best of" optimization (Pro)', detail: 'Detects comparison framing (X vs Y, alternatives, pros/cons, "best of") - the single most-cited content type in AI shopping and recommendation queries.' },
        ],
      },
      {
        title: 'AI readability',
        blurb: 'How easily can a language model isolate, quote, and attribute your content? Structure, formatting, and semantic markup decide.',
        checks: [
          { name: 'Paragraph chunking', detail: 'Flags rambling paragraphs. LLMs extract short, self-contained 2-4 sentence chunks cleanly.' },
          { name: 'Semantic HTML landmarks', detail: 'Checks for <article>, <section>, <aside> and <nav> landmarks that let engines separate your primary content from navigation and boilerplate.' },
          { name: 'Image captions', detail: 'Detects images wrapped in <figure>/<figcaption>. LLMs can\'t see images but they do read captions - the only part they can quote.' },
          { name: 'Data structuring (tables)', detail: 'Verifies comparisons live in HTML tables that models parse without error.' },
          { name: 'List usage', detail: 'Confirms steps and features are formatted as lists, the structure models reproduce most faithfully.' },
          { name: 'Pronoun ambiguity', detail: 'Detects sentences that start with ambiguous "this" or "it", where context is lost the moment AI extracts a single sentence.' },
          { name: 'Multi-format content score (Starter)', detail: 'Scores how many content formats you mix - prose, lists, tables, code, captioned images. Pages combining three or more are extracted more reliably.' },
          { name: 'Heading completeness (Starter)', detail: 'Checks that headings are descriptive phrases ("How to Install Node.js") rather than terse labels ("Installation") - descriptive headings match how users prompt AI.' },
          { name: 'Structured summary detection (Pro)', detail: 'Looks for a TL;DR, executive summary, or key-takeaways block - the section LLMs extract first as a direct-answer snippet.' },
        ],
      },
    ],
    reportPoints: [
      'GEO score across four signal groups, with an entity authority card and topic cluster map',
      'Findings organized by plan tier - Free, Starter, Pro, and Agency - so you see exactly what each level unlocks',
      'Every finding ships with a plain-language explanation, remediation, and an agent-native AI fix prompt',
      'Citation simulator plus a prompt coverage heatmap (Pro) that maps which user prompts around your topic your content actually answers',
      'Agency AI intelligence: citation simulation, Knowledge Graph gap analysis, a topical-authority depth map, and a competitive positioning report',
      'Competitor GEO comparison to benchmark your citation-worthiness against rivals, with trend tracking scan over scan',
    ],
    faqs: [
      { q: 'What is GEO (Generative Engine Optimization)?', a: 'Generative Engine Optimization is the discipline of making your website the source generative AI systems trust, quote, and recommend. Where AEO focuses on answer extraction, GEO focuses on the deeper trust layer: entity authority, topical depth, factual density, and machine readability. Igris Radar runs 33 GEO checks across those four groups, plus four AI intelligence features on the Agency tier.' },
      { q: 'GEO vs SEO: what\'s the difference?', a: 'SEO earns you a ranking; GEO earns you a citation. Search engines match keywords to pages, while generative engines synthesize answers from sources they trust. GEO optimizes the trust signals, such as authorship, knowledge-graph entity data, structured facts, and topical coverage, that get you into that trusted set.' },
      { q: 'GEO vs AEO: aren\'t they the same?', a: 'They\'re adjacent. AEO is about being extractable: crawler access and answer-shaped content. GEO is about being authoritative: whether engines believe your brand is the entity worth citing. Igris Radar audits both, separately, because the fixes differ.' },
      { q: 'What do the Knowledge Graph and entity checks do?', a: 'They measure how well generative engines can resolve your brand to a single, trusted entity: whether your JSON-LD carries an @id identifier, whether your Organization schema is complete enough to disambiguate you (foundingDate, founder, sameAs, logo), and whether you publish verifiable contact and trust signals. On the Agency tier, an AI runs a full Knowledge Graph gap analysis against a complete entity entry.' },
      { q: 'What are the Agency AI intelligence features?', a: 'Four premium AI analyses: citation simulation (an AI role-plays a generative engine deciding whether to cite you and why), Knowledge Graph gap analysis (missing entity properties), a topical-authority depth map (the subtopics you should cover to be definitive), and a competitive positioning report benchmarking your trust hierarchy against rivals.' },
      { q: 'What is the prompt coverage heatmap?', a: 'On Pro plans you provide a target topic, and the audit maps realistic user prompts around it against your content, showing precisely which questions you cover, partially cover, or miss entirely.' },
      { q: 'How long does a GEO audit take?', a: 'A single-page audit completes in under a minute. Enable multi-page crawl and AI deep analysis and a full report typically lands within two to three minutes.' },
    ],
    references: [
      { label: 'Generative engine optimization', source: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Generative_engine_optimization' },
      { label: 'Schema.org structured data vocabulary', source: 'Schema.org', href: 'https://schema.org' },
    ],
    ctaTitle: 'Score your citation-worthiness',
    ctaSub: 'Run a GEO audit and see what generative engines see.',
  },

  'brand-visibility': {
    key: 'brand',
    icon: Target,
    accentText: 'text-scanner-brand',
    accentBg: 'bg-scanner-brand',
    accentBgSoft: 'bg-scanner-brand/10',
    accentBorder: 'border-scanner-brand/25',
    eyebrow: 'AI Brand Visibility Tracker',
    h1: 'Is AI recommending your brand? Now you\'ll know.',
    sub: 'Your customers ask ChatGPT for recommendations every day. Our brand visibility tracker sends your real prompts to the live AI engines, detects whether your brand is mentioned, reads the sentiment, and scores your share of AI answers. No guesswork, just actual responses.',
    heroBullets: ['Live queries to real AI engines', 'Mention detection + sentiment', 'Prompt-by-engine visibility matrix'],
    stats: [
      { value: 4, suffix: '', label: 'AI engines queried live: ChatGPT, Claude, Perplexity, Gemini' },
      { value: 100, suffix: '%', label: 'visibility score = share of prompts where you\'re mentioned' },
      { value: 3, suffix: '', label: 'sentiment classes: positive, neutral, negative' },
    ],
    categories: [
      {
        title: 'Live prompt tracking',
        blurb: 'You define the prompts your buyers actually type, like "best security scanner" or "top SEO audit tools", and we ask the engines for real.',
        checks: [
          { name: 'Custom prompt sets', detail: 'Track any prompt that matters to your business, one per line, covering the questions where being recommended wins customers.' },
          { name: 'Multi-engine querying', detail: 'Each prompt is sent live to your selected engines: ChatGPT (OpenAI), Claude (Anthropic), Perplexity, and Gemini.' },
          { name: 'Real responses, not estimates', detail: 'We analyse the actual generated answers, never simulated or cached results.' },
        ],
      },
      {
        title: 'Mention & sentiment analysis',
        blurb: 'Being mentioned is half the story. How the AI talks about you is the other half.',
        checks: [
          { name: 'Brand mention detection', detail: 'Every response is scanned for your brand: a definitive yes or no per prompt, per engine.' },
          { name: 'Sentiment classification', detail: 'Mentions are classified positive, neutral, or negative, so a citation that damns with faint praise doesn\'t hide in your metrics.' },
          { name: 'Response previews', detail: 'Hover any cell of the matrix to read exactly what the AI said about you.' },
        ],
      },
      {
        title: 'Visibility scoring',
        blurb: 'One number your team can move: the share of prompt-engine combinations where your brand appears.',
        checks: [
          { name: 'Visibility score', detail: 'The percentage of tracked prompts where AI engines mentioned your brand: your AI share of voice.' },
          { name: 'Mention matrix', detail: 'A prompt-by-engine grid showing exactly where you appear, where you don\'t, and the sentiment of each mention.' },
          { name: 'Tracked history', detail: 'Every run is saved per brand, so you can re-run the same prompt set and watch visibility change as you ship AEO fixes.' },
        ],
      },
    ],
    reportPoints: [
      'Visibility score: your brand\'s share of voice across AI answers',
      'Full mention matrix with every prompt crossed with every engine, and sentiment per cell',
      'Response previews so you can read the exact AI answer behind each result',
      'Historical runs per brand to measure whether your AEO and GEO work is moving the number',
    ],
    faqs: [
      { q: 'How do I track my brand in ChatGPT?', a: 'Enter your brand name, your domain, and the prompts your customers actually ask, for example "best website security scanner". Igris Radar sends those prompts live to ChatGPT (and any other engines you select), detects whether your brand appears in the answers, and scores the results in a visibility matrix.' },
      { q: 'Which AI engines can I track?', a: 'ChatGPT (OpenAI), Claude (Anthropic), Perplexity, and Google Gemini. You choose which engines each tracking run queries.' },
      { q: 'What is an AI visibility score?', a: 'It\'s the percentage of your tracked prompt-and-engine combinations where the AI\'s answer mentioned your brand, effectively your share of voice in AI recommendations. If you track 10 prompts across 2 engines and appear in 12 of the 20 answers, your score is 60%.' },
      { q: 'Are the results real AI responses?', a: 'Yes. Each tracking run sends your prompts to the live engines via their APIs and analyses the actual generated answers. Results reflect what the AI genuinely says at that moment, which is why re-running over time shows real movement.' },
      { q: 'How does this connect to the AEO and GEO audits?', a: 'Brand visibility is the outcome; AEO and GEO are the levers. Track your baseline visibility, run the audits, fix what they surface, then re-run your prompt set to measure the lift.' },
    ],
    references: [
      { label: 'Brand awareness', source: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Brand_awareness' },
      { label: 'Share of voice', source: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Share_of_voice' },
    ],
    ctaTitle: 'See what AI says about your brand',
    ctaSub: 'Run your first tracking prompts in under two minutes.',
  },

  'site-health': {
    key: 'health',
    icon: Activity,
    accentText: 'text-scanner-health',
    accentBg: 'bg-scanner-health',
    accentBgSoft: 'bg-scanner-health/10',
    accentBorder: 'border-scanner-health/25',
    eyebrow: 'Site Health Monitor',
    h1: 'Core Web Vitals and accessibility, measured like Google measures them',
    sub: 'Slow pages lose rankings and revenue; inaccessible pages lose users and invite legal risk. Our site health check runs Google\'s PageSpeed analysis for your Core Web Vitals and audits your pages against WCAG 2.2 accessibility rules, all in one report.',
    heroBullets: ['LCP, INP, CLS & FCP metrics', 'WCAG 2.2 accessibility audit', 'Pass / needs-improvement / poor ratings'],
    stats: [
      { value: 4, suffix: '', label: 'Core Web Vitals measured: LCP, INP, CLS, FCP' },
      { value: 12, suffix: '+', label: 'WCAG accessibility rules audited' },
      { value: 100, suffix: '', label: 'point accessibility score' },
    ],
    categories: [
      {
        title: 'Core Web Vitals',
        blurb: 'The performance metrics Google uses as ranking signals, measured through the official PageSpeed analysis.',
        checks: [
          { name: 'Largest Contentful Paint (LCP)', detail: 'Loading performance. Your main content should render within 2.5 seconds. Rated good, needs improvement, or poor.' },
          { name: 'Interaction to Next Paint (INP)', detail: 'Responsiveness. Under 200ms means the page reacts instantly to every tap and click.' },
          { name: 'Cumulative Layout Shift (CLS)', detail: 'Visual stability. A score above 0.1 means your content jumps around while loading.' },
          { name: 'First Contentful Paint (FCP)', detail: 'How quickly anything renders. Under 1.8 seconds keeps users from bouncing.' },
        ],
      },
      {
        title: 'Accessibility (WCAG 2.2)',
        blurb: 'Automated checks against the standard behind accessibility law in most markets, with each failure explained in plain language.',
        checks: [
          { name: 'Color contrast', detail: 'Detects text that low-vision users, and anyone in sunlight, can\'t read.' },
          { name: 'Image alt text', detail: 'Finds images with no text alternative for screen readers.' },
          { name: 'Button & link names', detail: 'Catches icon-only controls that screen readers announce as just "button".' },
          { name: 'Form labels', detail: 'Verifies every input has an associated label announcing its purpose.' },
          { name: 'Heading order', detail: 'Flags skipped heading levels that break navigation for assistive technology.' },
          { name: 'Document language & title', detail: 'Checks the lang attribute and page title screen readers announce first.' },
          { name: 'ARIA correctness', detail: 'Validates ARIA roles and attributes. Wrong ARIA is worse than none.' },
          { name: 'Viewport zoom', detail: 'Detects viewport settings that block low-vision users from zooming.' },
        ],
      },
    ],
    reportPoints: [
      'Each Core Web Vital with its measured value and Google\'s good / needs-improvement / poor rating',
      'A 0-100 accessibility score with every detected issue listed and explained',
      'Per-rule "why this matters" tooltips written for developers, not lawyers',
      'History across checks so you can catch performance regressions before rankings feel them',
    ],
    faqs: [
      { q: 'What are Core Web Vitals?', a: 'Core Web Vitals are Google\'s user-experience metrics: Largest Contentful Paint (loading), Interaction to Next Paint (responsiveness), and Cumulative Layout Shift (visual stability). They\'re confirmed ranking signals, and Igris Radar measures them through Google\'s own PageSpeed analysis, alongside First Contentful Paint.' },
      { q: 'What LCP score is good?', a: 'Under 2.5 seconds is good, 2.5 to 4 seconds needs improvement, and above 4 seconds is poor. The report shows your measured value with its rating, plus the same for INP (target: under 200ms) and CLS (target: under 0.1).' },
      { q: 'What does the accessibility audit check?', a: 'It runs automated WCAG 2.2 rules: color contrast, image alt text, button and link names, form labels, heading order, document language and title, ARIA validity, and viewport zoom restrictions. Each comes with a plain-language explanation of who it affects and how to fix it.' },
      { q: 'Why do accessibility and performance share one report?', a: 'Because they share a fate: both are user-experience signals that affect rankings, conversions, and legal exposure, and both are owned by the same engineering team. One scan, one score, one fix list.' },
      { q: 'How often should I check site health?', a: 'After every significant deploy, at minimum. Performance regressions typically ship silently inside ordinary releases; paid plans support scheduled monitoring so score drops alert you rather than your analytics.' },
    ],
    references: [
      { label: 'Web Content Accessibility Guidelines', source: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Web_Content_Accessibility_Guidelines' },
      { label: 'Core Web Vitals', source: 'web.dev', href: 'https://web.dev/articles/vitals' },
    ],
    ctaTitle: 'Check your site health now',
    ctaSub: 'Web Vitals + accessibility in one scan. Free to start.',
  },

  'aso-audit': {
    key: 'aso',
    icon: Smartphone,
    accentText: 'text-scanner-aso',
    accentBg: 'bg-scanner-aso',
    accentBgSoft: 'bg-scanner-aso/10',
    accentBorder: 'border-scanner-aso/25',
    eyebrow: 'App Store Optimization',
    h1: 'Rank higher in the App Store and Google Play — with data, not guesswork',
    sub: 'ASO is SEO for mobile apps. When someone searches the App Store or Google Play for what your app does, the winner is whichever listing has the strongest metadata, best visuals, highest ratings, and deepest keyword coverage. Igris Radar runs 30+ ASO checks — metadata optimization, visual assets, ratings health, and competitive signals — and tells you exactly what to fix to climb the rankings and convert more installs.',
    heroBullets: ['iOS App Store & Google Play supported', '30+ checks across 4 ASO categories', 'Keyword, ratings & competitor gap analysis'],
    planBadge: 'Starter+',
    stats: [
      { value: 30, suffix: '+', label: 'ASO checks per scan across 4 categories' },
      { value: 2, suffix: '', label: 'platforms: iOS App Store & Google Play' },
      { value: 100, suffix: '', label: 'point ASO score, tracked scan over scan' },
    ],
    categories: [
      {
        title: 'Metadata optimization',
        blurb: 'Your title, subtitle, and description are your highest-leverage ASO signals. Every character counts — the algorithm reads them for keyword relevance; users read them to decide whether to tap Install.',
        checks: [
          { name: 'App title length & keyword presence', detail: 'Checks whether your title fits within the iOS 30-char or Android 50-char limit and whether it leads with your strongest keyword — the single most influential ranking factor in both stores.' },
          { name: 'Subtitle / short description', detail: 'Verifies your subtitle (iOS) or short description (Android) is present, within limits, and adds keyword coverage your title cannot fit.' },
          { name: 'Long description quality', detail: 'Measures word count and keyword density in your long description. The Google Play algorithm reads it directly for indexation; App Store uses it for conversion.' },
          { name: 'Developer name signals', detail: 'Developer name contributes to trust and can carry keyword signals. We verify it is properly registered and consistent across storefronts.' },
          { name: 'App category selection', detail: 'Confirms your app is assigned to the most relevant primary category — wrong category placement wastes keyword relevance and filters you out of relevant browse results.' },
          { name: 'In-app purchase disclosure', detail: 'Flags whether IAP disclosure is present and accurate. Undisclosed IAP triggers user complaints and store policy violations.' },
          { name: 'Content rating accuracy', detail: 'Verifies the content rating matches your app\'s actual content. Mismatched ratings lead to store removals and lost discoverability in age-restricted searches.' },
          { name: 'Last-updated freshness', detail: 'App stores surface recently-updated apps more prominently. We flag stale listings that have not been updated in over 90 days.' },
          { name: 'Keyword stuffing detection', detail: 'Catches overly repetitive keyword use that hurts readability and can trigger store spam filters, reducing rather than improving ranking.' },
          { name: 'Localization coverage', detail: 'Checks how many languages and locales your listing supports. Localized metadata multiplies your addressable keyword space across markets.' },
        ],
      },
      {
        title: 'Visual assets',
        blurb: 'Screenshots, icons, and preview videos are your install-conversion rate. No amount of keyword work recovers from a listing that looks unprofessional or fails to show the app in action.',
        checks: [
          { name: 'Icon quality & presence', detail: 'Verifies your app icon is present and detects if it meets minimum resolution requirements. A missing or blurry icon is an immediate trust failure.' },
          { name: 'Screenshot count', detail: 'Confirms you are using the maximum number of allowed screenshots. Each screenshot slot is free conversion-rate real estate.' },
          { name: 'Screenshot dimensions & format', detail: 'Checks screenshot dimensions match the store requirements for each device type. Wrong dimensions are rejected or displayed cropped.' },
          { name: 'Feature graphic (Android)', detail: 'Verifies the feature graphic is present on Android listings. It appears at the top of your Play Store page and is the first visual impression.' },
          { name: 'Preview video presence', detail: 'Flags listings without a preview video. Apps with videos see measurably higher install conversion rates, especially for games and complex tools.' },
        ],
      },
      {
        title: 'Ratings & reviews',
        blurb: 'Your rating is a direct ranking signal and the first social-proof data point users read. Both stores surface highly-rated apps; both bury apps with fresh waves of negative reviews.',
        checks: [
          { name: 'Average rating score', detail: 'Flags apps below 4.0 stars — the threshold below which click-through rates drop significantly in both stores.' },
          { name: 'Total review count', detail: 'Low review counts signal an unproven app. We flag listings below the threshold where social proof becomes a conversion driver.' },
          { name: 'Review recency', detail: 'Checks whether recent reviews exist. A high average built on old reviews masked by recent 1-stars is a conversion and ranking risk.' },
          { name: 'Review sentiment signals', detail: 'Scans visible review text for recurring complaint patterns (crashes, login issues, pricing) that surface problems to fix before they cascade into rating drops.' },
        ],
      },
      {
        title: 'Competitive signals',
        blurb: 'Your ASO score is relative, not absolute. These checks benchmark your listing against category leaders and estimate how much organic traffic you are leaving on the table.',
        checks: [
          { name: 'Download / install estimate bracket', detail: 'Estimates your install range from visible store signals. Low install counts reduce keyword ranking weight — it signals to the algorithm the app is unproven.' },
          { name: 'Category rank signals', detail: 'Infers your approximate category chart position from available signals and flags if you are outside the top-100 zone where discoverability drops sharply.' },
          { name: 'Competitor keyword gap', detail: 'Compares your metadata against top category competitors to identify high-volume keywords they rank for that your listing does not include.' },
          { name: 'Universal app flag (iOS)', detail: 'Checks if your iOS app is marked as a universal app (iPhone + iPad). Universal apps appear in more search contexts than device-specific builds.' },
        ],
      },
    ],
    reportPoints: [
      'ASO score (0–100) with category breakdowns: Metadata, Visuals, Ratings, Competitive',
      'Per-finding severity ranking (critical → low) with a plain-language explanation and AI-ready fix prompt for each issue',
      'Keyword gap report showing which high-traffic terms your top competitors rank for that your listing misses',
      'Side-by-side competitor comparison: run the same audit on a rival app listing to see exactly where you trail',
      'Scan history and trend tracking — see whether your ASO fixes are moving the score after each update',
    ],
    faqs: [
      { q: 'What is ASO (App Store Optimization)?', a: 'App Store Optimization is the practice of improving your mobile app\'s visibility and conversion rate in the iOS App Store and Google Play Store. It covers keyword optimization in your title, subtitle, and description; visual asset quality (screenshots, icon, preview video); ratings and review health; and competitive positioning. Igris Radar automates 30+ ASO checks across all four areas and returns a scored, prioritized report.' },
      { q: 'How is ASO different from SEO?', a: 'They share the same goal — discoverability — but different algorithms. App Store search weights metadata keyword placement, ratings velocity, download volume, and visual conversion rate, whereas web SEO weights backlinks, Core Web Vitals, and content depth. Igris Radar runs separate, purpose-built audits for both, so you can optimize your website and your app listing from one platform.' },
      { q: 'Does the audit work for both iOS and Android?', a: 'Yes. Paste your App Store or Google Play URL and the scanner automatically detects the platform. iOS checks use the 30-character title limit and Subtitle field; Android checks use the 50-character title and Short Description field. The scoring and reporting format is the same for both.' },
      { q: 'Which plan includes the ASO audit?', a: 'ASO audits are available on the Starter plan and above ($5/month). The Free plan does not include ASO scanning. All ASO checks are included from Starter onwards — there are no ASO-only Pro or Agency tiers.' },
      { q: 'How do I use the keyword gap analysis?', a: 'After your scan, the report shows the keywords your top-category competitors include in their titles and descriptions that your listing does not. You can use these as a prioritized rewrite list — adding the highest-volume missing keywords to your next metadata update.' },
      { q: 'How often should I re-run an ASO audit?', a: 'After every metadata update and after every significant competitor release. Store algorithms re-index listings within a day or two of changes, so re-scanning 48–72 hours after an update shows whether your edits improved the score.' },
    ],
    references: [
      { label: 'App Store Optimization', source: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/App_store_optimization' },
      { label: 'Google Play — App listing best practices', source: 'Android Developers', href: 'https://developer.android.com/distribute/best-practices/launch/store-listing' },
      { label: 'App Store — Product page best practices', source: 'Apple Developer', href: 'https://developer.apple.com/app-store/product-page/' },
    ],
    ctaTitle: 'Audit your app store listing now',
    ctaSub: 'Find out in 60 seconds what\'s holding back your installs. Starter plan, no credit card needed.',
  },
};

/** How the platform works. The same 3 steps everywhere. */
export const HOW_IT_WORKS = [
  { step: '01', title: 'Enter any URL', text: 'No installs, no code snippets, no DNS changes. Every audit starts from a single URL, yours or a competitor\'s.' },
  { step: '02', title: 'Scanners do the work', text: 'Purpose-built engines audit security, SEO, AEO, GEO, brand visibility, and site health, with each check scored and severity-ranked.' },
  { step: '03', title: 'Fix with AI-ready prompts', text: 'Every finding ships with plain-language remediation and an agent-native fix prompt you can paste straight into your AI coding assistant.' },
];
