/**
 * lib/scannerExplanations.js
 *
 * Single source of truth for the plain-language "what this check is / why it
 * matters" text, keyed by the exact finding `title` used in the scanners.
 *
 * Used in two places:
 *  1. AuditFindingCard renders it as the detail text for a NORMAL (unlocked)
 *     finding when the scanner didn't supply its own `details`.
 *  2. filterFindingsByPlan resolves it server-side for a LOCKED finding (the
 *     real title is never sent to the client) so the "More information" panel
 *     still explains the gated check — without revealing the site-specific
 *     result, which is the paid value.
 */

export const FINDING_EXPLANATIONS = {
  // ─── Security · headers / transport ──────────────────────────────────────
  'HTTPS Enforced': "HTTPS encrypts the communication between your user's browser and your server, protecting sensitive data from man-in-the-middle attacks and packet sniffing.",
  'Content-Security-Policy': "A Content Security Policy (CSP) is an added layer of security that helps detect and mitigate attacks like Cross-Site Scripting (XSS) and data injection, by restricting which domains the browser treats as valid script sources.",
  'X-Frame-Options': "The X-Frame-Options header controls whether a browser may render your page inside a <frame>/<iframe>. It defends against clickjacking by preventing your content being embedded on other sites.",
  'Strict-Transport-Security': "HTTP Strict Transport Security (HSTS) forces browsers to only ever connect over HTTPS, protecting against protocol-downgrade attacks and cookie hijacking.",
  'Server Info Disclosure': "Exposing server version details (e.g. \"nginx/1.20.1\" or \"X-Powered-By: Express\") lets attackers quickly look up known vulnerabilities for your exact stack, cutting the time needed to breach you.",
  'Web Application Firewall (WAF)': "A Web Application Firewall filters, monitors and blocks malicious HTTP traffic, protecting against attacks such as CSRF, XSS, file inclusion and SQL injection.",
  'Secure Cookies': "The Secure attribute keeps cookies to HTTPS only; HttpOnly hides them from client-side scripts. Together they stop XSS from stealing session tokens.",
  'CORS Misconfiguration': "An overly permissive Cross-Origin Resource Sharing policy (wildcards or reflected origins) lets malicious sites read your authenticated data.",
  'Exposed API Keys': "Hardcoded API keys inside client-side bundles can be scraped by anyone and used to impersonate your app, bypass billing, or access external services — causing financial or data loss.",
  'Outdated Frontend Libraries': "Outdated JavaScript libraries with known CVEs expose users to XSS and other client-side attacks; attackers scan for these signatures to exploit documented flaws.",
  'Exposed Sensitive Files': "Misconfigured servers can expose config files (.env), version-control histories (.git) or backups that contain passwords, secret keys and source code — leading to full compromise.",
  'Site Fetch': "The scanner could not reach the provided URL. Ensure the domain resolves and the server is accepting connections.",

  // ─── Security · tier-gated (Starter / Pro / Agency) ──────────────────────
  'Admin Panel Exposure': "Checks whether common admin/login paths (e.g. /admin, /wp-admin) are publicly reachable, giving attackers a target for brute-force and credential-stuffing.",
  'BIMI Record': "Checks for a Brand Indicators for Message Identification DNS record, which lets verified senders show their logo in inboxes — a trust and anti-spoofing signal.",
  'Backup File Detection': "Probes for leftover backup files (.bak, .old, .zip, .sql) that can expose source code, credentials or full database dumps.",
  'CAA Records': "Checks for Certification Authority Authorization DNS records that restrict which CAs may issue certificates for your domain, limiting mis-issuance.",
  'CDN Detection': "Identifies whether your site sits behind a CDN, which affects caching, DDoS resilience and how other network checks should be interpreted.",
  'CMS / Framework Version Detection': "Detects the CMS/framework version your site discloses — exposed versions let attackers look up matching known vulnerabilities.",
  'CSP Deep Analysis': "Performs an in-depth audit of your Content-Security-Policy directives for weaknesses like 'unsafe-inline', wildcards or missing fallbacks.",
  'Cache-Control for Sensitive Pages': "Verifies that authenticated/sensitive pages send no-store/no-cache headers so private data isn't retained by browsers or shared proxies.",
  'Certificate Key Strength': "Checks that your TLS certificate uses a modern key (RSA ≥ 2048 or ECDSA) strong enough to resist factoring attacks.",
  'Certificate Transparency (CT) Logs': "Cross-checks public Certificate Transparency logs for certificates issued for your domain, helping detect unauthorized or mis-issued certificates.",
  'Cookie Prefix Hardening': "Checks whether sensitive cookies use the __Host-/__Secure- prefixes that enforce secure, same-origin scoping.",
  'Cross-Origin Security Suite': "Audits the COOP/COEP/CORP headers that isolate your document from cross-origin attacks such as Spectre and XS-leaks.",
  'DKIM Record': "Checks for DomainKeys Identified Mail signing records that let receivers verify your email wasn't altered in transit.",
  'DMARC Enforcement Strength': "Evaluates whether your DMARC policy actually enforces (quarantine/reject) rather than sitting at 'none', which only monitors spoofing.",
  'DNSSEC Validation': "Checks whether DNSSEC is enabled and validating — it cryptographically signs your DNS records to prevent cache-poisoning and spoofing.",
  'DOM-Based XSS Indicators': "Scans client-side JavaScript for dangerous sinks (innerHTML, document.write, eval) that can enable DOM-based cross-site scripting.",
  'Data Leak in HTML Comments': "Inspects HTML comments for leaked internal notes, credentials, TODOs or system details left in the markup.",
  'Discovered Subdomains': "Enumerates public subdomains that expand your attack surface and may expose forgotten or unmaintained services.",
  'Domain Age': "Reports how long the domain has been registered — very new domains carry higher fraud/abuse risk signals.",
  'Domain Expiry': "Checks how close your domain registration is to expiring; a lapsed domain can be hijacked and cause total loss of service.",
  'Error Page Information Leakage': "Triggers an error response and inspects it for stack traces, file paths or framework details that help attackers.",
  'Exposed Debug Endpoints': "Probes for debug/actuator/telemetry endpoints that can reveal configuration or allow unauthenticated actions.",
  'Form Security Analysis': "Audits your forms for CSRF protection, secure submission and safe autocomplete handling on sensitive fields.",
  'GDPR Compliance Indicators': "Checks for signals of GDPR readiness — consent banners, a privacy policy and data-handling disclosures for EU users.",
  'GraphQL Introspection Exposed': "Checks whether GraphQL introspection is publicly enabled, which hands attackers your full API schema.",
  'HIPAA Basic Checks': "Looks for baseline safeguards expected when handling health information — encryption, access notices and policy links.",
  'HSTS Preload Eligibility': "Checks whether your HSTS header meets the requirements to join browsers' preload list for always-on HTTPS.",
  'HTTP Method Enumeration': "Tests which HTTP methods your server allows; risky methods like PUT/DELETE/TRACE can enable tampering or information leaks.",
  'HTTP/2 Support': "Detects HTTP/2, which improves performance and multiplexing; its absence is a modernization signal.",
  'Hosting Provider Identification': "Identifies your hosting provider/ASN — useful context for reputation and infrastructure-risk assessment.",
  'IPv6 Support': "Checks whether your domain is reachable over IPv6, an availability and modernization signal for the growing IPv6-only audience.",
  'Inline Script Analysis': "Reviews inline <script> usage, which weakens CSP and raises XSS exposure versus externalized, hashed scripts.",
  'Known Vulnerable JavaScript Libraries': "Fingerprints your JavaScript libraries and checks each version against public vulnerability databases (CVE/OSV).",
  'Login Page Over HTTPS': "Confirms your login page is served over HTTPS so submitted credentials can't be intercepted in transit.",
  'MTA-STS Policy': "Checks for an MTA-STS policy that forces inbound mail servers to use TLS, preventing downgrade and interception of your email.",
  'Mail Server (MX) Records': "Validates your MX records and mail routing — misconfiguration can cause lost mail or enable spoofing.",
  'Malware/Phishing Blocklist Status': "Checks your domain against threat-intelligence blocklists for malware or phishing reputation.",
  'Multi-Factor Authentication Support': "Looks for indicators that your login supports MFA, a critical control against credential theft.",
  'OWASP Top 10 Mapping': "Maps the scan's findings to the OWASP Top 10 categories so you can see your exposure against the industry standard.",
  'Open DNS Resolver Check': "Tests whether your DNS resolver answers recursive queries publicly, which can be abused for DDoS amplification.",
  'Open Port Scan (Common DB/Admin)': "Scans common database/admin ports (3306, 5432, 6379, 27017…) that should never be exposed to the internet.",
  'Open Redirect Vulnerability': "Tests redirect parameters for open-redirect flaws that attackers use for phishing and OAuth token theft.",
  'Outbound Link Reputation': "Checks the reputation of the domains you link out to, since linking to flagged sites harms trust and endangers users.",
  'Outdated WordPress Plugin Detection': "Detects outdated WordPress plugins with known vulnerabilities — a leading cause of site compromise.",
  'PCI DSS Basic Checks': "Looks for baseline controls expected when handling card data — HTTPS everywhere, secure forms and no card-data leakage.",
  'PII Exposure in HTML': "Scans rendered HTML for personally identifiable information (emails, phone numbers, IDs) exposed to anyone.",
  'PII Exposure in Source Code': "Scans inline scripts and source for leaked PII or personal data embedded in the page code.",
  'Reporting-Endpoints': "Checks for the Reporting-Endpoints header used to collect CSP and network-error reports so you can monitor attacks.",
  'Reverse DNS / PTR Record': "Verifies a matching PTR record for your mail IP, which improves deliverability and is a legitimacy signal.",
  'SOC 2 Readiness Indicators': "Looks for public signals of SOC 2-aligned practices — a security policy, trust page and disclosures.",
  'SPF Policy Strength': "Evaluates whether your SPF record ends in a strict -all rather than a permissive ~all/?all that weakens spoofing protection.",
  'SSL Certificate Chain Validation': "Verifies your certificate presents a complete, trusted chain so browsers don't warn on or fail the handshake.",
  'SSL Certificate Expiry': "Checks how soon your TLS certificate expires; an expired certificate breaks HTTPS and blocks every user.",
  'Self-Signed Certificate': "Detects self-signed certificates that browsers don't trust, exposing users to warnings and man-in-the-middle risk.",
  'Server Response Time': "Measures server responsiveness; slow responses hurt UX and can indicate under-provisioned or stressed infrastructure.",
  'Source Map Exposure': "Checks for publicly served .map files that expose your original, unminified source code to anyone.",
  'Session Token Entropy': "Analyzes session-token randomness; low entropy makes tokens guessable and sessions hijackable.",
  'Subdomain Takeover Detection': "Checks for dangling DNS records pointing to unclaimed services that an attacker could claim to hijack a subdomain.",
  'Subdomain Takeover Scan': "Scans your subdomains for takeover-vulnerable configurations across common hosting providers.",
  'Subresource Integrity (SRI)': "Checks whether external scripts/styles use SRI hashes so a compromised CDN can't silently inject malicious code.",
  'TLS Version': "Checks the negotiated TLS version; legacy TLS 1.0/1.1 are deprecated and insecure.",
  'Third-Party Script Inventory': "Inventories the third-party scripts you load — each one is a supply-chain risk if the provider is compromised.",

  // ─── Email auth (shared) ─────────────────────────────────────────────────
  'SPF Record': "Sender Policy Framework (SPF) lets receiving servers verify that mail claiming to be from your domain came from an authorized host, helping block spoofing.",
  'DMARC Record': "DMARC builds on SPF and DKIM to tell receiving servers what to do with mail that fails authentication — a strict policy layer against email spoofing.",

  // ─── SEO ─────────────────────────────────────────────────────────────────
  'robots.txt configuration': "The robots.txt file tells search-engine crawlers which pages they may and may not crawl (the Robots Exclusion Protocol).",
  'XML Sitemap presence': "An XML sitemap lists a site's important pages so search engines can find and crawl them all, aiding faster indexing.",
  'Canonical URL': "A canonical URL tells search engines which page is the primary one among duplicates, resolving duplicate-content issues.",
  'Hreflang Tags': "Hreflang tags tell search engines which language a page targets so the right version is served to the right users.",
  'Meta Robots Indexability': "The meta robots tag controls crawling/indexing; a 'noindex' directive explicitly blocks the page from search results.",
  'URL Structure': "Clean, semantic URLs (hyphens, not underscores) are easier for users and search engines to read, improving relevance signals.",
  'Response Time (TTFB)': "Time to First Byte measures connection setup and server responsiveness; faster responses improve UX and crawl budget.",
  'Mobile Friendliness': "With mobile-first indexing, Google ranks the mobile version of your content; the viewport tag is critical for responsive design.",
  'Title Tag Optimization': "Title tags are a major ranking factor and should describe the page concisely — too short lacks keywords, too long gets truncated.",
  'Meta Description': "Meta descriptions summarize a page; while not a direct ranking factor, they heavily influence click-through rate from search results.",
  'Duplicate Title/Description': "Using identical text for title and meta description wastes an opportunity to give users and search engines extra context and keywords.",
  'H1 Tag Hierarchy': "The H1 is the page's main headline; exactly one H1 helps search engines understand the primary topic.",
  'Title Keyword in H1': "Matching your primary keyword across the title and H1 reinforces the page's core topic and relevance to search engines.",
  'Image Alt Text': "Alt text describes an image's function; it's vital for accessibility and helps search engines rank your images.",
  'Thin Content': "Search engines favour comprehensive content; very low word counts can be judged 'thin' and struggle to rank.",
  'Content Readability': "Readable content improves UX, lowering bounce rate and lifting engagement — indirect SEO signals.",
  'Schema.org JSON-LD': "Schema markup helps search engines show richer results (rich snippets); JSON-LD is Google's recommended format.",
  'Open Graph Tags': "Open Graph tags control how URLs appear when shared on social media, improving visibility and click-through.",
  'Twitter Card Tags': "Twitter Card tags make your content look rich when shared on X, driving more traffic.",
  'Schema Types Inventory': "Identifies which structured-data types are present so you can target the right rich results.",
  'Internal Link Count': "Internal links connect content, convey site structure to Google and spread link equity around your site.",
  'Nofollow on Internal Links': "'nofollow' on internal links blocks link equity (PageRank) flowing through your site; internal links should generally be followed.",
  'Missing/Generic Anchor Text': "Anchor text signals what the destination is about; generic text like 'click here' wastes keyword-relevance opportunity.",
  'External Link Protocols': "Linking to insecure (HTTP) sites is a poor user experience and can slightly diminish your own trust signals.",
  'Broken Internal Links': "Broken links dead-end users and crawlers, harming UX and wasting crawl budget.",
  'Lazy Loading Images': 'Checks whether below-the-fold images defer loading with loading="lazy". Lazy loading keeps images off the critical path so the page paints faster and uses less bandwidth on first load.',
  'Modern Image Formats': 'Detects images still served as PNG/JPG/GIF instead of WebP or AVIF. Modern formats are dramatically smaller at the same quality, cutting page weight and improving load speed and Core Web Vitals.',
  'Keyword Prominence': 'Evaluates whether your primary keyword appears early — within the first 100 words of body content. Search engines weight early mentions more heavily when judging what a page is about.',
  'Semantic HTML Structure': 'Checks whether the page uses HTML5 landmark elements (<nav>, <main>, <article>, <footer>) instead of generic <div>s, which helps crawlers and assistive tech understand your layout.',
  'Largest Contentful Paint (LCP)': 'Measures how quickly the largest visible element (hero image, headline) renders. LCP is a Google ranking signal; a slow LCP hurts both rankings and conversion. Pro pulls your real LCP from Google PageSpeed Insights.',
  'Cumulative Layout Shift (CLS)': 'Measures how much the page visually jumps around as it loads. High CLS frustrates users and is a Core Web Vitals ranking factor. Pro reports your exact CLS score and what to reserve space for.',
  'First Contentful Paint (FCP)': 'Measures the time until the first piece of content appears. A fast FCP reassures users the page is working. Pro pulls your real FCP from Google PageSpeed Insights.',
  'Core Web Vitals': 'Pulls your real Largest Contentful Paint, Cumulative Layout Shift and First Contentful Paint from Google PageSpeed Insights — the field metrics Google uses as ranking signals.',
  'Redirect Chains': 'Detects internal links that bounce through two or more 301/302 redirects before resolving. Each hop wastes crawl budget and dilutes the SEO link equity passed to the final page.',
  'Local SEO NAP Consistency': 'Validates your LocalBusiness structured data for consistent Name, Address and Phone (NAP) details — the signals Google uses for local pack rankings and map results.',
  'AI Search Intent Mapping': 'An AI analysis that classifies your page against the four search intents (Informational, Transactional, Navigational, Commercial) and grades how well your content satisfies what a searcher actually wants.',
  'LSI Keyword Gap Analysis': 'An AI semantic analysis that surfaces Latent Semantic Indexing (LSI) topics — the related concepts competitors cover that your page is missing — so you can close topical gaps and rank for more queries.',
  'Semantic Coverage Score': 'An AI-scored measure of how completely your content covers the topic versus what top-ranking pages address, highlighting where depth is thin.',

  // ─── AEO ─────────────────────────────────────────────────────────────────
  'OpenAI GPTBot Access': "GPTBot is OpenAI's crawler. Allowing it lets your content be ingested and potentially cited in ChatGPT responses.",
  'Anthropic ClaudeBot Access': "ClaudeBot is Anthropic's crawler. Allowing it makes your information available to Claude models for accurate answers and citations.",
  'PerplexityBot Access': "Perplexity relies on real-time scraping to give cited answers; allowing PerplexityBot is key for visibility in their AI search engine.",
  'Google-Extended Access': "Google-Extended controls access for Google's generative AI (Gemini) separately from standard Googlebot search indexing.",
  'Crawl Delay Limits': "Strict crawl delays in robots.txt can stop aggressive AI crawlers fetching your content in time, shrinking your footprint in their data.",
  'AI.txt / LLMs.txt Presence': "An llms.txt file is an emerging standard giving AI models a streamlined, markdown representation of your site's content and rules.",
  'Q&A Formatting': "AI engines look for direct question-and-answer pairs; subheadings phrased as questions match common user prompts.",
  'Direct Answer Paragraphs': "AIs often lift the first short paragraph after a heading as a direct answer; keeping it concise and definitive improves extraction.",
  'Structured Lists': "Language models parse bulleted/numbered lists easily, making it more likely an AI reproduces your points accurately.",
  'Rich Schema.org Data': "FAQPage and HowTo schemas give AI engines explicitly structured Q&A data to ingest without parsing complex HTML.",
  'Data Tables': "LLMs understand markdown/HTML tables well; tabular data is easier for AIs to compare and synthesize.",
  'Content Depth': "AI models prefer comprehensive sources for long-form answers; deeper content offers more entities and relationships to learn.",
  'Author & Freshness': "AI engines prioritize up-to-date content by identifiable authors to keep answer quality high and reduce hallucination.",
  'Canonical Source Attribution': "A canonical tag helps AI crawlers identify the original source, so your domain gets the citation instead of a scraper.",
  'Expert Credentials': "E-E-A-T applies to AEO; clear author bios and Person schema help AI establish the credibility of your information.",
  'Source Citations': "Outbound links to authoritative domains (.gov/.edu) signal to AI models that your content is well-researched and grounded.",

  // ─── GEO ─────────────────────────────────────────────────────────────────
  'Author Byline and Bio': "Explicit author signals (rel='author', Person schema) establish the human expertise behind content, which generative engines rely on for trust.",
  'Social / sameAs Links': "Linking verified social profiles and Wikipedia via sameAs schema helps generative engines build a complete Knowledge Graph entity for your brand.",
  'Brand Logo Detection': "Defining your logo in HTML/Schema ensures generative engines can display your official branding accurately when they cite you.",
  'Publication Dates': "Clear publication and modification dates are strong freshness signals; AI prefers citing recently updated content.",
  'About Page Linked': "An accessible About/Team page is a core trust signal establishing the organization's legitimacy and real-world presence.",
  'Content Depth (Word Count)': "Generative engines favour comprehensive, deep content that thoroughly covers a topic and its subtopics.",
  'Breadcrumb Trails': "Breadcrumbs (visible and in schema) help LLMs understand your content hierarchy and how topics relate.",
  'FAQ Schema / Section': "FAQ sections mirror the Q&A format of AI prompts, making your content highly likely to be extracted as a direct answer.",
  'Internal Link Density': "Dense internal linking builds topical clusters that associate your domain with deep authority when engines crawl them.",
  'Subtopic Hierarchy (H2/H3)': "Detailed H2/H3 tags give AI a clear outline to rapidly parse and extract specific information.",
  'External Citations': "AI engines trust content that cites sources; outbound references act as a bibliography proving your content is researched.",
  'Data Point Density': "A high density of specific numbers, stats and years makes content more factual and citable for AI answering factual queries.",
  'Quotes and Citations': "Proper HTML citation tags (blockquote, cite) structure external opinions so AI can attribute and extract them.",
  'Authoritative Source Links': "Citing highly trusted domains (.edu/.gov/academic) passes a 'trust by association' signal to generative engines.",
  'Paragraph Chunking': "LLMs prefer short, self-contained paragraphs (2-4 sentences); long, rambling ones are harder to isolate and cite.",
  'Data Structuring (Tables)': "LLMs excel at parsing tabular data; converting comparisons into HTML tables makes data highly accessible for synthesis.",
  'List Usage': "Bulleted/numbered lists break complex steps into digestible chunks that language models frequently reproduce.",
  'Pronoun Ambiguity': "Replacing ambiguous pronouns with explicit nouns preserves context if an AI extracts a single sentence.",
  'Knowledge Graph Entity Signals': "An @id field in your JSON-LD gives each entity a stable identifier that the Google Knowledge Graph uses to recognise your brand as a distinct entity; without it, engines can't reliably resolve who you are.",
  'Contact & Trust Signals': "Visible phone, email, address or ContactPoint schema let generative engines verify you are a real, reachable organisation — verifiable entities earn more trust and citations.",
  'Unique Value Proposition': "Differentiating language early in the page ('only', 'first', 'unlike') signals an original perspective; AIs prefer to cite distinctive sources over commodity, rephrased content.",
  'Definition Format Detection': "Clean 'X is…' / 'X refers to…' definition sentences are the exact extractable format LLMs lift as direct answers, so pages that define their concepts get cited more.",
  'Semantic HTML Landmarks': "Landmark elements (<article>, <section>, <aside>, <nav>) let LLMs separate your primary content from navigation and boilerplate, improving what they extract and attribute.",
  'Image Captions': "LLMs can't see images but they do read <figcaption> text and adjacent captions, so captioned visuals add extractable, citable context.",
  'Wikipedia-Style Inline Citations': "Citations placed inline next to the claim they support (same paragraph) — the way Wikipedia does it — dramatically increase an LLM's trust versus references dumped in a footer.",
  'Statistic Freshness': "Statistics accompanied by a year ('in 2025', 'a 2024 study') let engines judge how current your data is; undated stats get deprioritised in favour of fresher sources.",
  'Content Uniqueness Indicators': "First-person research ('we tested', 'our data'), case studies and expert quotes are signals of original content that LLMs preferentially cite over rephrased summaries.",
  'Multi-Format Content Score': "Pages that combine several formats — prose, lists, tables, code, captioned images — give AI engines multiple extractable structures, so richer pages are cited more reliably.",
  'Heading Completeness': "Descriptive heading phrases ('How to Install Node.js') mirror how users prompt AI, so they match queries far better than terse single-word labels ('Installation').",
  'Entity Disambiguation Score': "Complete Organization/WebSite schema (description, foundingDate, founder, sameAs, logo) lets LLMs distinguish your brand from similarly named ones; sparse data causes entity confusion.",
  'Topical Cluster Detection': "Internal links that form coherent pillar-and-cluster topic groups signal deep authority on a subject, which generative engines reward over scattered, random navigation.",
  'Comparison & \"Best Of\" Optimization': "Comparison content ('X vs Y', alternatives, pros/cons, 'best of') is the single most-cited content type in AI shopping and recommendation queries.",
  'Structured Summary Detection': "TL;DR, executive-summary and key-takeaways blocks are the sections LLMs extract first as a direct answer snippet, so pages that include them surface more often.",
  'Citation Simulation': "An AI role-plays as a generative engine and judges whether it would cite your page for a given topic, explaining the specific reasons behind a yes or no.",
  'Knowledge Graph Gap Analysis': "An AI compares your entity signals against a complete Knowledge Graph entry and identifies the missing properties (founding date, HQ, key people, industry) holding your brand back.",
  'Topical Authority Depth Map': "An AI generates the full map of subtopics your page should cover to be the definitive source, then checks which are present and which are missing.",
  'Competitive Positioning Report': "A deep AI analysis of where your brand sits in an LLM's trust hierarchy versus competitors, with specific content recommendations to outrank them.",
};

/** Coarser fallback keyed by finding category. */
export const CATEGORY_EXPLANATIONS = {
  // SEO
  'Technical SEO': 'Technical checks that determine whether search engines can crawl, render and index your page efficiently.',
  'On-Page SEO': 'On-page checks covering the content, keywords, headings and media that tell search engines what your page is about.',
  'Structured Data': 'Checks for Schema.org / JSON-LD markup that helps search and AI engines understand your content and show rich results.',
  'Link Health': 'Checks on your internal and external links — crawlability, equity flow and broken destinations.',
  // Security
  'Headers': 'Checks the HTTP security response headers your server returns, which enable browser-level protections against common web attacks.',
  'SSL/TLS': 'Checks your certificate and TLS configuration — the foundation of an encrypted, trusted HTTPS connection.',
  'DNS Security': 'Checks DNS-level protections and email-authentication records (SPF, DKIM, DMARC, DNSSEC) that prevent spoofing and hijacking.',
  'Secrets': "Scans your page's HTML and scripts for exposed API keys, tokens and other secrets.",
  'Info Disclosure': 'Checks whether your responses, error pages and assets leak details about your technology stack that aid attackers.',
  'Infrastructure': 'Probes network-level properties of your host — DNS records, response timing, protocol support and open ports.',
  'Domain Reputation': 'Checks your domain against threat-intelligence sources and its registration record for risk signals.',
  'Compliance': 'Checks for public signals that your site follows relevant compliance frameworks (GDPR, PCI, HIPAA, SOC 2).',
  'Best Practices': 'Checks for recommended security files and configurations that indicate a mature security posture.',
};

/**
 * Resolves the best available explanation for a finding.
 * @param {{ title?: string, category?: string }} finding
 * @returns {string}
 */
export function getFindingExplanation(finding) {
  if (!finding) return '';
  return (
    FINDING_EXPLANATIONS[finding.title] ||
    CATEGORY_EXPLANATIONS[finding.category] ||
    'This is an advanced audit check available on a higher plan. Upgrade to run it against your site and see the detailed result and recommended fix.'
  );
}
