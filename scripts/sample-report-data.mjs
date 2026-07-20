/**
 * Fake scan data for the 5 landing-page sample PDF reports.
 * Not real scan output — used only to render marketing sample PDFs.
 */

// Helper: build a "free" (fully visible) finding.
function f(category, severity, title, description, passed, remediation, tier = 'free') {
  return { category, severity, title, description, passed, remediation, tier, locked: false };
}

// Helper: build a locked/blurred finding — no title/description leaked.
function locked(category, severity, tier) {
  return { category, severity, tier, locked: true, passed: false };
}

export const SECURITY_REPORT = {
  url: 'https://igrisradar.com',
  scanType: 'security',
  score: 58,
  categories: { Headers: 45, Transport: 80, Cookies: 55, Exposure: 40 },
  findings: [
    f('Headers', 'critical', 'Content-Security-Policy Missing', 'No CSP header was found, leaving the site exposed to cross-site scripting (XSS) injection.', false, 'Add a Content-Security-Policy header restricting script, style and frame sources to trusted origins.'),
    f('Transport', 'passed', 'HTTPS Enforced', 'Site is served over HTTPS with valid certificate and automatic HTTP redirect.', true, ''),
    f('Cookies', 'high', 'Session Cookie Missing Secure Flag', 'The session cookie is not marked Secure, allowing it to be sent over unencrypted connections.', false, 'Set the Secure and HttpOnly flags on all session cookies.'),
    f('Exposure', 'medium', 'Server Version Disclosed', 'Response headers reveal the exact web server and framework version.', false, 'Suppress the X-Powered-By and Server headers in production.'),
    f('Headers', 'passed', 'X-Frame-Options Present', 'Clickjacking protection header is correctly configured.', true, ''),
    locked('Headers', 'high', 'starter'),
    locked('Exposure', 'critical', 'starter'),
    locked('Cookies', 'medium', 'starter'),
    locked('Transport', 'high', 'pro'),
    locked('Exposure', 'medium', 'pro'),
    locked('Headers', 'low', 'agency'),
  ],
};

export const SEO_REPORT = {
  url: 'https://igrisradar.com',
  scanType: 'seo',
  score: 64,
  categories: { 'Technical SEO': 70, Content: 55, 'On-Page': 68, Links: 60 },
  findings: [
    f('Technical SEO', 'passed', 'HTTPS Enforced', 'Site is served over a secure HTTPS connection.', true, ''),
    f('Technical SEO', 'high', 'XML Sitemap Missing', 'No sitemap.xml could be found at the domain root or referenced in robots.txt.', false, 'Generate an XML sitemap and submit it to Google Search Console.'),
    f('On-Page', 'medium', 'Meta Description Too Short', 'The homepage meta description is 62 characters, below the recommended 120-155.', false, 'Expand the meta description to summarize the page value proposition within 155 characters.'),
    f('Content', 'high', 'Duplicate Title Tags', '3 pages share an identical <title> tag, diluting relevance signals.', false, 'Write a unique, keyword-specific title for every indexable page.'),
    f('Links', 'passed', 'No Broken Internal Links', 'All internal links returned a successful response code.', true, ''),
    locked('Technical SEO', 'medium', 'starter'),
    locked('On-Page', 'high', 'starter'),
    locked('Content', 'low', 'starter'),
    locked('Links', 'medium', 'pro'),
    locked('Technical SEO', 'critical', 'pro'),
    locked('Content', 'medium', 'agency'),
  ],
};

export const AEO_REPORT = {
  url: 'https://igrisradar.com',
  scanType: 'aeo',
  score: 47,
  categories: { 'Answer Readiness': 40, 'Schema Markup': 35, Citations: 50, Structure: 62 },
  findings: [
    f('Schema Markup', 'critical', 'Organization Schema Missing', 'No JSON-LD Organization schema was detected, making it harder for AI engines to verify brand identity.', false, 'Add an Organization schema block with name, logo and sameAs social profile links.'),
    f('Answer Readiness', 'high', 'No Direct-Answer Format', 'Key pages bury the answer in paragraph text instead of a scannable summary near the top.', false, 'Lead each page with a 1-2 sentence direct answer before supporting detail.'),
    f('Structure', 'passed', 'Heading Hierarchy Valid', 'H1-H3 tags follow a logical, non-skipping order.', true, ''),
    f('Citations', 'medium', 'Missing Author/Source Attribution', 'Blog content has no visible author or publish date, reducing trust signals AI crawlers weigh.', false, 'Add visible author bylines and publish/updated dates to all articles.'),
    f('Schema Markup', 'passed', 'FAQPage Schema Present', 'FAQ sections are marked up correctly for rich snippet eligibility.', true, ''),
    locked('Answer Readiness', 'high', 'starter'),
    locked('Schema Markup', 'medium', 'starter'),
    locked('Citations', 'critical', 'starter'),
    locked('Structure', 'medium', 'pro'),
    locked('Answer Readiness', 'low', 'pro'),
    locked('Citations', 'high', 'agency'),
  ],
};

export const GEO_REPORT = {
  url: 'https://igrisradar.com',
  scanType: 'geo',
  score: 52,
  categories: { 'AI Visibility': 45, 'Crawler Access': 60, 'Content Depth': 50, Freshness: 55 },
  findings: [
    f('Crawler Access', 'critical', 'GPTBot Blocked in robots.txt', 'robots.txt explicitly disallows GPTBot, excluding the site from ChatGPT browsing and training crawls.', false, 'Remove the GPTBot disallow rule unless intentionally opting out of AI crawling.'),
    f('AI Visibility', 'high', 'Not Cited in Sample AI Answers', 'Across 12 tested prompts in your topic space, igrisradar.com was not referenced by any AI engine.', false, 'Publish first-party data and original research that AI engines can cite as a primary source.'),
    f('Content Depth', 'passed', 'Sufficient Word Count', 'Core pages exceed the 800-word depth threshold associated with stronger AI citation rates.', true, ''),
    f('Freshness', 'medium', 'Stale Publish Dates', 'Several high-value pages have not been updated in over 12 months.', false, 'Refresh statistics, screenshots and examples on cornerstone pages at least quarterly.'),
    f('Crawler Access', 'passed', 'PerplexityBot Allowed', 'robots.txt permits PerplexityBot to crawl all indexable content.', true, ''),
    locked('AI Visibility', 'high', 'starter'),
    locked('Content Depth', 'medium', 'starter'),
    locked('Freshness', 'low', 'starter'),
    locked('Crawler Access', 'medium', 'pro'),
    locked('AI Visibility', 'critical', 'pro'),
    locked('Content Depth', 'high', 'agency'),
  ],
};

// App report (ASO) - chess.com, shown with only 3 low-severity findings
// unlocked per the Starter-tier app-scan gating; everything else hidden.
export const ASO_REPORT = {
  url: 'Chess.com (iOS + Android)',
  scanType: 'aso',
  score: 71,
  categories: { Metadata: 65, Visuals: 70, Ratings: 88, Keywords: 60 },
  findings: [
    f('Metadata', 'low', 'Subtitle Under-utilized', 'The iOS subtitle uses 24 of 30 available characters, leaving keyword opportunity unused.', false, 'Extend the subtitle to the full 30-character limit with an additional high-intent keyword.'),
    f('Visuals', 'passed', 'Icon Meets Resolution Guidelines', 'App icon meets both App Store and Play Store minimum resolution and safe-area requirements.', true, ''),
    f('Ratings', 'low', 'Review Response Rate Below Benchmark', 'Only 8% of recent reviews have a developer response, below the 20% benchmark tied to conversion lift.', false, 'Respond to at least 1 in 5 new reviews, prioritizing 1-3 star ratings.'),
    locked('Metadata', 'high', 'starter'),
    locked('Keywords', 'critical', 'starter'),
    locked('Keywords', 'medium', 'starter'),
    locked('Visuals', 'medium', 'pro'),
    locked('Metadata', 'medium', 'pro'),
    locked('Ratings', 'high', 'agency'),
    locked('Keywords', 'high', 'agency'),
  ],
};

export const ALL_REPORTS = [
  { key: 'security', title: 'Security Scan', data: SECURITY_REPORT },
  { key: 'seo', title: 'SEO Audit', data: SEO_REPORT },
  { key: 'aeo', title: 'AEO Audit', data: AEO_REPORT },
  { key: 'geo', title: 'GEO Audit', data: GEO_REPORT },
  { key: 'aso', title: 'App Store Optimization Audit', data: ASO_REPORT },
];
