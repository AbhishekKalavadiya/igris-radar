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
    description: 'Headers, exposed secrets, email spoofing & OWASP-aligned checks',
  },
  {
    href: '/landing/features/seo-audit',
    icon: Search,
    accent: 'text-scanner-seo',
    bgSoft: 'bg-scanner-seo/10',
    title: 'SEO Audit',
    description: 'Full technical, on-page, structured data & link health audit',
  },
  {
    href: '/landing/features/aeo-audit',
    icon: Sparkles,
    accent: 'text-scanner-aeo',
    bgSoft: 'bg-scanner-aeo/10',
    title: 'AEO Audit',
    description: 'Answer engine optimization to get cited by ChatGPT & Perplexity',
  },
  {
    href: '/landing/features/geo-audit',
    icon: Bot,
    accent: 'text-scanner-geo',
    bgSoft: 'bg-scanner-geo/10',
    title: 'GEO Audit',
    description: 'Generative engine optimization: entity authority & citation-worthiness',
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
];

export const NAV_COMPANY = [
  { href: '/landing/about', title: 'About', description: 'Why we built Igris Radar' },
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
    sub: 'Run an automated website security audit that inspects your HTTP headers, hunts for exposed secrets and sensitive files, and verifies your email anti-spoofing records. Clear severity ratings, concrete remediation, zero noise.',
    heroBullets: ['Security headers & SSL/TLS', 'Exposed API keys & .env files', 'SPF & DMARC email records'],
    stats: [
      { value: 14, suffix: '+', label: 'automated security checks per scan' },
      { value: 4, suffix: '', label: 'severity levels, from critical to low' },
      { value: 30, suffix: 's', label: 'typical time to a full report' },
    ],
    categories: [
      {
        title: 'Transport & header security',
        blurb: 'The response headers your server sends are your first line of defense. We verify each one and explain exactly what a missing header exposes you to.',
        checks: [
          { name: 'HTTPS enforcement', detail: 'Confirms your site is served over an encrypted connection, protecting users from man-in-the-middle attacks.' },
          { name: 'Content-Security-Policy', detail: 'Detects a missing or weak CSP, your main defense against cross-site scripting (XSS) and data injection.' },
          { name: 'Strict-Transport-Security (HSTS)', detail: 'Ensures browsers refuse downgraded HTTP connections, blocking protocol-downgrade and cookie-hijacking attacks.' },
          { name: 'X-Frame-Options', detail: 'Stops your pages from being embedded in hostile iframes, the mechanism behind clickjacking.' },
          { name: 'Server info disclosure', detail: 'Flags version banners like "nginx/1.20.1" that let attackers look up known CVEs for your exact stack.' },
          { name: 'WAF detection', detail: 'Checks whether a web application firewall is filtering traffic in front of your app.' },
        ],
      },
      {
        title: 'Secrets & sensitive exposure',
        blurb: 'One leaked key in a client-side bundle can mean a five-figure cloud bill or a full compromise. We scan what the public can see.',
        checks: [
          { name: 'Exposed API keys', detail: 'Scrapes your public HTML and JavaScript bundles for hardcoded credentials anyone could harvest.' },
          { name: 'Exposed sensitive files', detail: 'Probes for publicly reachable .env files, .git directories, and backup files that leak configuration and source.' },
          { name: 'Secure cookie flags', detail: 'Verifies session cookies carry Secure and HttpOnly attributes so scripts and open networks can\'t steal them.' },
          { name: 'CORS misconfiguration', detail: 'Detects wildcard or overly permissive cross-origin policies that let malicious sites read authenticated data.' },
          { name: 'Outdated frontend libraries', detail: 'Identifies JavaScript libraries with known CVEs that expose your users to client-side attacks.' },
        ],
      },
      {
        title: 'Email & domain trust',
        blurb: 'Attackers don\'t need your server to impersonate your brand. An unprotected domain is enough to send email as you.',
        checks: [
          { name: 'SPF record', detail: 'Verifies your Sender Policy Framework record so mail servers can reject spoofed senders.' },
          { name: 'DMARC record', detail: 'Confirms a DMARC policy tells receiving servers what to do when authentication fails. This is your policy layer against phishing sent in your name.' },
        ],
      },
    ],
    reportPoints: [
      'Severity-ranked findings from critical to low, with passed checks listed for your records',
      'Plain-language "why this matters" explanation for every finding',
      'Copy-paste remediation guidance, plus an agent-native fix prompt you can hand to your AI coding assistant',
      'A 0-100 security score you can track scan-over-scan on the trend chart',
    ],
    faqs: [
      { q: 'What is a website security scanner?', a: 'A website security scanner is an automated tool that inspects a live website for misconfigurations and exposures: missing security headers, leaked secrets, unsafe cookies, permissive CORS, and missing email authentication records. Igris Radar runs 14+ of these checks from a single URL and returns a severity-ranked report in about 30 seconds.' },
      { q: 'Is this a penetration test?', a: 'No. A penetration test is a manual engagement by security experts. Igris Radar is a continuous, automated security audit. It is the layer you run weekly to catch configuration drift, leaked keys, and missing headers between deeper engagements.' },
      { q: 'What are security headers and why do they matter?', a: 'Security headers are HTTP response headers, like Content-Security-Policy, HSTS, and X-Frame-Options, that instruct browsers how to protect your users. Missing headers are among the most common findings in any security audit and are usually a one-line fix.' },
      { q: 'How does the fix workflow work?', a: 'Every failed check ships with remediation guidance and an AI-ready fix prompt. Paste the prompt into your AI coding assistant and it has the full context to patch the issue in your codebase.' },
      { q: 'Do I need to install anything?', a: 'No agents, no DNS changes, no code snippets. Enter a URL, and the scanner analyses everything visible from the outside, the same vantage point an attacker has.' },
    ],
    references: [
      { label: 'Web application security', source: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Web_application_security' },
      { label: 'OWASP Secure Headers Project', source: 'OWASP', href: 'https://owasp.org/www-project-secure-headers/' },
    ],
    ctaTitle: 'Scan your site for vulnerabilities now',
    ctaSub: 'Free plan includes 3 full scans a month. No credit card required.',
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
    sub: 'Technical SEO, on-page signals, structured data, and link health in one scan. See exactly what\'s holding back your search visibility, with a prioritized fix list and a competitor comparison to show where you fall behind.',
    heroBullets: ['Technical + on-page + schema + links', 'Side-by-side competitor analysis', 'Multi-page crawl mode'],
    stats: [
      { value: 25, suffix: '+', label: 'SEO checks across 4 categories' },
      { value: 4, suffix: '', label: 'audit categories scored separately' },
      { value: 100, suffix: '', label: 'point SEO score, tracked over time' },
    ],
    categories: [
      {
        title: 'Technical SEO',
        blurb: 'If crawlers can\'t reach, render, and index your pages, nothing else matters. This is the foundation layer of every site audit.',
        checks: [
          { name: 'robots.txt configuration', detail: 'Confirms search engines are told what they can and cannot crawl, and that you aren\'t blocking pages you need indexed.' },
          { name: 'XML sitemap presence', detail: 'Verifies a sitemap lists your important pages so crawlers find and index them faster.' },
          { name: 'Canonical URLs', detail: 'Checks canonical tags resolve duplicate-content issues so ranking signals consolidate on one URL.' },
          { name: 'Meta robots indexability', detail: 'Catches stray noindex directives silently removing pages from search results.' },
          { name: 'Response time (TTFB)', detail: 'Measures server responsiveness. Slow first bytes hurt both rankings and crawl budget.' },
          { name: 'Mobile friendliness', detail: 'Validates the viewport configuration Google\'s mobile-first indexing depends on.' },
          { name: 'Hreflang tags', detail: 'Checks language and region targeting for international sites.' },
          { name: 'URL structure', detail: 'Flags unreadable URLs. Clean, semantic paths improve both relevance signals and click-through.' },
        ],
      },
      {
        title: 'On-page SEO',
        blurb: 'The content-level signals search engines read first: titles, descriptions, headings, and the substance of the page itself.',
        checks: [
          { name: 'Title tag optimization', detail: 'Length and keyword checks on the single strongest on-page ranking factor.' },
          { name: 'Meta descriptions', detail: 'Flags missing or truncated descriptions that depress your click-through rate on the results page.' },
          { name: 'H1 hierarchy', detail: 'Verifies exactly one H1 exists and headings descend logically, forming the outline crawlers parse.' },
          { name: 'Title/H1 keyword alignment', detail: 'Confirms your title and H1 reinforce the same core topic.' },
          { name: 'Image alt text', detail: 'Finds images missing alt attributes, an accessibility failure and lost image-search traffic.' },
          { name: 'Thin content detection', detail: 'Flags pages whose word count is too low to compete for meaningful terms.' },
          { name: 'Content readability', detail: 'Scores how easily your content reads. Engagement metrics feed back into rankings.' },
        ],
      },
      {
        title: 'Structured data',
        blurb: 'Schema markup is how you qualify for rich results, and increasingly, how AI systems parse your pages.',
        checks: [
          { name: 'Schema.org JSON-LD', detail: 'Detects and validates the structured data Google recommends for rich snippets.' },
          { name: 'Schema types inventory', detail: 'Lists every schema type on the page so you know which rich results you\'re eligible for.' },
          { name: 'Open Graph tags', detail: 'Verifies how your pages render when shared on LinkedIn and Facebook.' },
          { name: 'Twitter Card tags', detail: 'Checks the markup that controls your appearance on X.' },
        ],
      },
      {
        title: 'Link health',
        blurb: 'Internal links distribute authority through your site. Broken ones leak it.',
        checks: [
          { name: 'Broken internal links', detail: 'Finds dead ends that waste crawl budget and frustrate users.' },
          { name: 'Internal link count & density', detail: 'Measures whether your pages are connected enough to establish topical hierarchy.' },
          { name: 'Nofollow on internal links', detail: 'Catches nofollow attributes accidentally blocking PageRank flow inside your own site.' },
          { name: 'Anchor text quality', detail: 'Flags "click here" anchors that waste relevance signals.' },
          { name: 'External link protocols', detail: 'Identifies outbound links to insecure HTTP destinations.' },
        ],
      },
    ],
    reportPoints: [
      'Category-level scores for Technical, On-Page, Structured Data, and Link Health',
      'SERP preview that shows your title and description as Google renders them',
      'Competitor comparison: run the same audit on a rival URL and see the gap category by category',
      'Optional multi-page crawl and AI deep analysis with title suggestions, keyword analysis, and an E-E-A-T estimate',
    ],
    faqs: [
      { q: 'What is an SEO audit?', a: 'An SEO audit is a systematic review of the factors that determine how well your site can rank in search engines: crawlability, indexation, on-page content signals, structured data, and link health. Igris Radar automates 25+ of these checks and returns a scored, prioritized report in minutes.' },
      { q: 'How is this different from a site crawler like Screaming Frog?', a: 'Desktop crawlers give you raw data and leave interpretation to you. Igris Radar scores every finding, explains why it matters in plain language, generates a fix prompt for each issue, and tracks your score over time. Analysis is included, not just extraction.' },
      { q: 'Can I compare my site against a competitor?', a: 'Yes. Add a competitor URL to any scan and we run the identical audit on both sites, then show a side-by-side category breakdown of exactly where you lead and where you trail.' },
      { q: 'Does it check structured data?', a: 'Yes. The audit extracts and validates Schema.org JSON-LD, inventories every schema type present, and checks Open Graph and Twitter Card tags. Structured data matters double now: it powers rich results and feeds AI answer engines.' },
      { q: 'What does the AI deep analysis add?', a: 'On Pro plans, Gemini-powered deep analysis reviews your actual content and returns title suggestions, a meta description strategy, keyword analysis, a content gap summary, and an E-E-A-T score estimate.' },
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
    heroBullets: ['AI crawler access verification', 'Answer-ready content structure', 'Citation-readiness signals'],
    stats: [
      { value: 16, suffix: '+', label: 'AEO checks across 3 categories' },
      { value: 4, suffix: '', label: 'AI crawlers verified: GPTBot, ClaudeBot, PerplexityBot, Google-Extended' },
      { value: 100, suffix: '', label: 'point AI-readiness score' },
    ],
    categories: [
      {
        title: 'AI crawlability',
        blurb: 'Before an answer engine can cite you, its crawler has to be allowed in. Most sites block AI bots without knowing it.',
        checks: [
          { name: 'OpenAI GPTBot access', detail: 'Verifies ChatGPT\'s crawler can ingest your content, the prerequisite for being cited in its answers.' },
          { name: 'Anthropic ClaudeBot access', detail: 'Confirms Claude\'s crawler isn\'t blocked in your robots.txt.' },
          { name: 'PerplexityBot access', detail: 'Perplexity cites sources in real time. A blocked crawler means zero visibility in its answers.' },
          { name: 'Google-Extended access', detail: 'Checks the directive that controls Gemini and AI Overview training access, separate from normal Google search.' },
          { name: 'Crawl delay limits', detail: 'Flags aggressive crawl-delay rules that throttle AI crawlers out of your content.' },
          { name: 'llms.txt presence', detail: 'Detects the emerging llms.txt standard that gives AI models a clean, structured summary of your site.' },
        ],
      },
      {
        title: 'Answer-ready content structure',
        blurb: 'AI engines extract answers, not pages. Content structured as questions, direct answers, and lists gets reproduced; walls of text get skipped.',
        checks: [
          { name: 'Q&A formatting', detail: 'Checks whether headings are phrased as the questions users actually ask AI assistants.' },
          { name: 'Direct answer paragraphs', detail: 'Verifies each heading is followed by a concise, definitive paragraph, the snippet AI engines lift verbatim.' },
          { name: 'Structured lists', detail: 'Confirms complex information is broken into bulleted and numbered lists that language models parse reliably.' },
          { name: 'Data tables', detail: 'Detects tabular data, the format LLMs synthesize and compare most accurately.' },
          { name: 'FAQ & HowTo schema', detail: 'Validates the rich Schema.org types that hand answer engines pre-structured Q&A data.' },
          { name: 'Content depth', detail: 'Measures whether coverage is comprehensive enough for AI models to treat your page as a primary source.' },
        ],
      },
      {
        title: 'Citation-readiness',
        blurb: 'AI engines weigh trust signals when choosing whom to cite. These checks measure whether your content earns the citation.',
        checks: [
          { name: 'Author & freshness signals', detail: 'Verifies identifiable authorship and visible publication dates. AI engines prefer accountable, current sources.' },
          { name: 'Canonical source attribution', detail: 'Ensures your domain gets credited as the original source, not a scraper or syndicator.' },
          { name: 'Expert credentials (E-E-A-T)', detail: 'Checks author bios and Person schema that establish the expertise behind your content.' },
          { name: 'Source citations', detail: 'Confirms outbound links to authoritative references. Models trust content that shows its work.' },
        ],
      },
    ],
    reportPoints: [
      'AI-readiness score with category breakdown: Crawlability, Content Structure, Citation-Readiness',
      'An AI answer preview showing how an answer engine would extract and present your content',
      'Competitor AEO comparison that shows who\'s better positioned to be cited in your space',
      'AI deep analysis (Pro): citation likelihood rating, answer format suggestions, and question coverage gaps',
    ],
    faqs: [
      { q: 'What is AEO (Answer Engine Optimization)?', a: 'Answer Engine Optimization is the practice of structuring your content so AI assistants such as ChatGPT, Claude, Perplexity, and Gemini can crawl it, extract accurate answers from it, and cite your brand as the source. It\'s the AI-era counterpart to SEO: instead of ranking on a results page, you\'re competing to be the answer.' },
      { q: 'How is AEO different from SEO?', a: 'SEO optimizes for ranked lists of links; AEO optimizes for being quoted inside a single generated answer. The technical foundations overlap, especially crawlability and structured data, but AEO adds AI-crawler access, question-formatted content, direct-answer paragraphs, and citation trust signals.' },
      { q: 'Which AI crawlers does the audit check?', a: 'The audit verifies robots.txt access for OpenAI\'s GPTBot, Anthropic\'s ClaudeBot, PerplexityBot, and Google-Extended (which governs Gemini), plus crawl-delay rules and the emerging llms.txt standard.' },
      { q: 'What is llms.txt?', a: 'llms.txt is an emerging convention: a markdown file at your site root that gives language models a clean, curated summary of your site\'s content and rules. Our audit detects whether you have one and flags it as an opportunity if you don\'t.' },
      { q: 'How do I know if AI engines can cite my content?', a: 'Run the audit. It scores the three things citation depends on: whether AI crawlers can access your pages, whether your content is structured for answer extraction, and whether your trust signals justify the citation.' },
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
    sub: 'GEO goes beyond crawlability: it measures whether generative engines see your site as a trustworthy entity worth citing. Our GEO audit scores entity authority, topical depth, factual density, and AI readability, the signals that decide who gets recommended.',
    heroBullets: ['Entity authority & trust signals', 'Topical depth mapping', 'Factual density scoring'],
    stats: [
      { value: 18, suffix: '+', label: 'GEO heuristics per scan' },
      { value: 4, suffix: '', label: 'signal groups: entity, depth, facts, readability' },
      { value: 100, suffix: '', label: 'point GEO score with trend tracking' },
    ],
    categories: [
      {
        title: 'Entity authority',
        blurb: 'Generative engines build a knowledge-graph picture of your brand. These checks measure how complete and credible that picture is.',
        checks: [
          { name: 'Author bylines & bios', detail: 'Verifies explicit authorship signals, such as rel=author and Person schema, that establish human expertise behind the content.' },
          { name: 'Social & sameAs links', detail: 'Checks the schema links to verified profiles that help engines assemble your brand\'s knowledge-graph entity.' },
          { name: 'Brand logo detection', detail: 'Confirms your logo is declared in schema so AI citations display your official branding.' },
          { name: 'Publication dates', detail: 'Validates visible created and modified dates. Freshness is a citation tiebreaker for time-sensitive queries.' },
          { name: 'About page linked', detail: 'An accessible About page is a core legitimacy signal engines look for.' },
        ],
      },
      {
        title: 'Topical depth',
        blurb: 'Generative engines favor sources that cover a topic completely: clusters, hierarchies, and depth over one-off posts.',
        checks: [
          { name: 'Content depth (word count)', detail: 'Measures whether coverage is substantial enough to serve as a primary source.' },
          { name: 'Subtopic hierarchy (H2/H3)', detail: 'Verifies a clear heading outline AI systems use to parse and extract sections.' },
          { name: 'Breadcrumb trails', detail: 'Checks visible and schema breadcrumbs that reveal your content\'s topical structure.' },
          { name: 'Internal link density', detail: 'Measures the topic clusters that signal domain-level authority to generative engines.' },
        ],
      },
      {
        title: 'Factual density',
        blurb: 'LLMs cite content they can quote confidently: specific numbers, attributed quotes, and referenced claims.',
        checks: [
          { name: 'Data point density', detail: 'Counts concrete figures, statistics, and dates, the raw material of citable content.' },
          { name: 'Quotes & citations markup', detail: 'Checks blockquote and cite elements that make attributions machine-readable.' },
          { name: 'External citations', detail: 'Verifies your content references sources. A bibliography signals research, not opinion.' },
          { name: 'Authoritative source links', detail: 'Detects links to .gov, .edu and academic domains that pass trust by association.' },
        ],
      },
      {
        title: 'AI readability',
        blurb: 'How easily can a language model isolate, quote, and attribute your sentences? Structure decides.',
        checks: [
          { name: 'Paragraph chunking', detail: 'Flags rambling paragraphs. LLMs extract short, self-contained 2-4 sentence chunks cleanly.' },
          { name: 'Data structuring (tables)', detail: 'Verifies comparisons live in HTML tables that models parse without error.' },
          { name: 'List usage', detail: 'Confirms steps and features are formatted as lists, the structure models reproduce most faithfully.' },
          { name: 'Pronoun ambiguity', detail: 'Detects sentences that start with ambiguous "this" or "it", where context is lost the moment AI extracts a single sentence.' },
        ],
      },
    ],
    reportPoints: [
      'GEO score across four signal groups, with an entity authority card and topic cluster map',
      'Citation simulator: a preview of how a generative engine would cite your page',
      'Prompt coverage heatmap (Pro) shows which user prompts around your target topic your content actually answers',
      'Competitor GEO comparison to benchmark your citation-worthiness against rivals',
    ],
    faqs: [
      { q: 'What is GEO (Generative Engine Optimization)?', a: 'Generative Engine Optimization is the discipline of making your website the source generative AI systems trust, quote, and recommend. Where AEO focuses on answer extraction, GEO focuses on the deeper trust layer: entity authority, topical depth, factual density, and machine readability.' },
      { q: 'GEO vs SEO: what\'s the difference?', a: 'SEO earns you a ranking; GEO earns you a citation. Search engines match keywords to pages, while generative engines synthesize answers from sources they trust. GEO optimizes the trust signals, such as authorship, structured facts, and topical coverage, that get you into that trusted set.' },
      { q: 'GEO vs AEO: aren\'t they the same?', a: 'They\'re adjacent. AEO is about being extractable: crawler access and answer-shaped content. GEO is about being authoritative: whether engines believe your brand is the entity worth citing. Igris Radar audits both, separately, because the fixes differ.' },
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
};

/** How the platform works. The same 3 steps everywhere. */
export const HOW_IT_WORKS = [
  { step: '01', title: 'Enter any URL', text: 'No installs, no code snippets, no DNS changes. Every audit starts from a single URL, yours or a competitor\'s.' },
  { step: '02', title: 'Scanners do the work', text: 'Purpose-built engines audit security, SEO, AEO, GEO, brand visibility, and site health, with each check scored and severity-ranked.' },
  { step: '03', title: 'Fix with AI-ready prompts', text: 'Every finding ships with plain-language remediation and an agent-native fix prompt you can paste straight into your AI coding assistant.' },
];
