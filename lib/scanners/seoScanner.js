import { fetchWithCheerio } from './shared/fetcher.js';
import { createFindingsCollector } from './shared/findings.js';
import { addScanErrorFinding } from './shared/scanErrors.js';
import { calculateScore } from './shared/scoring.js';
import { hasRobotsTxt, fetchRobotsTxt, getSitemapUrls } from './shared/robotsParser.js';
import { extractSchemas, extractOpenGraph, extractTwitterCards } from './shared/schemaExtractor.js';
import { extractCleanText, extractProseText, fleschReadingEase } from './shared/textContent.js';
import { fetchPageSpeed } from './shared/pageSpeed.js';
import { traceRedirects } from './shared/redirectChain.js';

const TIER_RANK = { free: 0, starter: 1, pro: 2 };

// Common English stop words + brand/filler terms stripped before comparing
// title / H1 / body terms, so words like "the", "best" or "your" don't drive
// keyword checks. Shared by the H1-keyword and keyword-prominence checks.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for',
  'with', 'at', 'by', 'from', 'is', 'are', 'best', 'top', 'your', 'you',
  'how', 'what', 'why', 'vs'
]);

/**
 * Runs the SEO audit. Deterministic checks are tagged with the plan `tier`
 * that unlocks them (findings.js/filterFindingsByPlan handle redaction), while
 * quota- or latency-heavy checks (Core Web Vitals, redirect tracing, the wider
 * broken-link crawl) only *execute* when the caller's plan is high enough.
 *
 * @param {string} url
 * @param {{ plan?: string }} [options]
 */
export async function runSeoScan(url, { plan = 'free' } = {}) {
  const rank = TIER_RANK[plan] ?? 0;
  const { addFinding, addTeaser, getFindings } = createFindingsCollector();
  const startTime = Date.now();
  // Captured so the caller can reuse this exact HTML snapshot for AI deep
  // analysis instead of re-fetching the page (a second fetch risks a different
  // page version or a bot challenge). Stays null if the fetch fails.
  let capturedHtml = null;

  try {
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

    // Kick off the PageSpeed Insights request (Pro+) up front so it runs
    // concurrently with the fetch/parse/link-checking work below instead of
    // adding its ~45s latency sequentially. PSI follows redirects itself, so
    // the pre-fetch normalizedUrl is fine here. Awaited in the Pro block.
    const psiPromise = rank >= TIER_RANK.pro ? fetchPageSpeed(normalizedUrl) : null;

    // Check HTTPS enforcement
    addFinding(
      'Technical SEO', 'high', 'HTTPS Enforced',
      'Checks if the site is served over a secure HTTPS connection.',
      normalizedUrl.startsWith('https'),
      'Ensure the site uses an SSL certificate and redirects HTTP to HTTPS.',
      'How to enforce HTTPS redirects in Next.js/Node.js'
    );

    const { html, $, response, targetUrl } = await fetchWithCheerio(normalizedUrl);
    capturedHtml = html;
    const ttfb = Date.now() - startTime;

    // --- TECHNICAL SEO ---
    
    const robotsTxt = await fetchRobotsTxt(targetUrl.origin);
    addFinding(
      'Technical SEO', 'high', 'robots.txt configuration',
      'Checks if robots.txt exists and is accessible.',
      !!robotsTxt,
      'Create a robots.txt file at the root of your domain.',
      'Generate a standard robots.txt for a Next.js app.'
    );

    const sitemaps = getSitemapUrls(robotsTxt);
    let hasValidSitemap = sitemaps.length > 0;
    if (!hasValidSitemap) {
      try {
        const smRes = await fetch(new URL('/sitemap.xml', targetUrl.origin), { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        hasValidSitemap = smRes.ok;
      } catch (e) {}
    }
    addFinding(
      'Technical SEO', 'high', 'XML Sitemap presence',
      'Checks for a valid sitemap.xml.',
      hasValidSitemap,
      'Generate an XML sitemap and submit it to Google Search Console.',
      'How to auto-generate a sitemap.xml in Next.js App Router.'
    );

    const canonical = $('link[rel="canonical"]').attr('href');
    addFinding(
      'Technical SEO', 'high', 'Canonical URL',
      'Checks if a canonical link exists to prevent duplicate content issues.',
      !!canonical,
      'Add a <link rel="canonical" href="..."> tag pointing to the preferred URL.',
      'How to add canonical URLs using Next.js Metadata API.'
    );

    const hreflang = $('link[rel="alternate"][hreflang]').length > 0;
    // We'll mark hreflang as 'passed' if present, but won't penalize if missing since not all sites need it.
    addFinding(
      'Technical SEO', 'low', 'Hreflang Tags',
      'Checks for internationalization tags.',
      true, // Soft pass for now
      'If your site is multi-language, add hreflang tags.',
      ''
    );

    const metaRobots = $('meta[name="robots"]').attr('content') || '';
    const isNoIndex = metaRobots.toLowerCase().includes('noindex');
    addFinding(
      'Technical SEO', 'critical', 'Meta Robots Indexability',
      'Ensures the page is not blocked from indexing by a noindex tag.',
      !isNoIndex,
      'Remove the noindex directive from the meta robots tag.',
      'How to configure robots metadata in Next.js to allow indexing.'
    );

    // URL structure (no underscores, no massive query params)
    const hasUnderscores = targetUrl.pathname.includes('_');
    addFinding(
      'Technical SEO', 'low', 'URL Structure',
      'Checks if the URL is clean and SEO-friendly.',
      !hasUnderscores,
      'Use hyphens instead of underscores in URLs.',
      ''
    );

    addFinding(
      'Technical SEO', 'medium', 'Response Time (TTFB)',
      `Time to First Byte: ${ttfb}ms (Optimal: <600ms).`,
      ttfb < 600,
      'Optimize server response times, leverage caching, or use a CDN.',
      'How to improve Next.js server response time and cache API routes.'
    );

    const viewport = $('meta[name="viewport"]').length > 0;
    addFinding(
      'Technical SEO', 'critical', 'Mobile Friendliness',
      'Checks for viewport meta tag for responsive design.',
      viewport,
      'Add a proper viewport meta tag in your HTML head.',
      'Add viewport configuration to Next.js layout.'
    );

    // Semantic HTML5 landmarks (Free) — modern structure vs "div soup".
    const landmarks = ['nav', 'main', 'header', 'footer', 'article', 'section', 'aside'];
    const presentLandmarks = landmarks.filter(tag => $(tag).length > 0);
    const hasCoreLandmarks = $('main').length > 0 && $('nav').length > 0 && $('footer').length > 0;
    addFinding(
      'Technical SEO', 'medium', 'Semantic HTML Structure',
      `Found landmark tags: ${presentLandmarks.length ? presentLandmarks.join(', ') : 'none'}. Modern pages use <nav>, <main> and <footer> instead of generic <div>s.`,
      hasCoreLandmarks,
      'Wrap page regions in semantic HTML5 landmarks (<nav>, <main>, <article>, <footer>) so crawlers and assistive tech understand your layout.',
      'Refactor this HTML to use semantic HTML5 landmark elements instead of generic div wrappers.',
      '', 'free'
    );


    // --- ON-PAGE SEO ---

    const title = $('title').text().trim();
    const titlePassed = title.length >= 10 && title.length <= 70;
    addFinding(
      'On-Page SEO', 'critical', 'Title Tag Optimization',
      `Title length: ${title.length} chars. Optimal is 10-70 chars.`,
      titlePassed,
      'Write a descriptive title tag between 10 and 70 characters.',
      'Generate 5 SEO-optimized title tags for a page about this topic.'
    );

    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const descPassed = metaDesc.length >= 50 && metaDesc.length <= 160;
    addFinding(
      'On-Page SEO', 'critical', 'Meta Description',
      `Description length: ${metaDesc.length} chars. Optimal is 50-160 chars.`,
      descPassed,
      'Write a compelling meta description between 50 and 160 characters.',
      'Write a 150-character meta description for this page.'
    );

    addFinding(
      'On-Page SEO', 'medium', 'Duplicate Title/Description',
      'Checks if the title and description are identical.',
      title && metaDesc && title !== metaDesc,
      'Ensure the meta description is a unique summary, not just a copy of the title.',
      ''
    );

    const h1Count = $('h1').length;
    addFinding(
      'On-Page SEO', 'critical', 'H1 Tag Hierarchy',
      `Found ${h1Count} H1 tags. Optimal is exactly 1.`,
      h1Count === 1,
      'Ensure there is exactly one <h1> tag on the page, representing the main topic.',
      ''
    );

    if (h1Count === 1) {
      const h1Text = $('h1').text().trim().toLowerCase();
      const titleWords = title
        .toLowerCase()
        .split(/[\s|\-–—]+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
      const titleInH1 = titleWords.length > 0 && titleWords.some(w => h1Text.includes(w));
      addFinding(
        'On-Page SEO', 'medium', 'Title Keyword in H1',
        'Checks if main keywords from the title appear in the H1.',
        titleInH1,
        'Include your primary keyword in both the title tag and H1 heading.',
        ''
      );
    }

    const images = $('img');
    const imagesWithoutAlt = images.filter((_, el) => !$(el).attr('alt')).length;
    addFinding(
      'On-Page SEO', 'medium', 'Image Alt Text',
      `Found ${imagesWithoutAlt} images without alt text (out of ${images.length}).`,
      imagesWithoutAlt === 0,
      'Add descriptive alt attributes to all meaningful images.',
      'Write alt text descriptions for these image concepts.'
    );

    // Advanced media optimization (Starter) — lazy loading + modern formats.
    const imgEls = images.toArray();
    const nonFirstImages = imgEls.slice(1); // the first (likely LCP) image should stay eager
    const notLazy = nonFirstImages.filter(el => {
      const loading = ($(el).attr('loading') || '').toLowerCase();
      return loading !== 'lazy';
    }).length;
    addFinding(
      'On-Page SEO', 'medium', 'Lazy Loading Images',
      `${notLazy} of ${nonFirstImages.length} below-the-fold images are missing loading="lazy".`,
      nonFirstImages.length === 0 || notLazy === 0,
      'Add loading="lazy" to off-screen images so they don\'t block the initial page render.',
      'Add loading="lazy" to below-the-fold images in this markup.',
      '', 'starter'
    );

    const modernFormat = /\.(webp|avif)(\?|$)/i;
    const legacyImages = imgEls.filter(el => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      return /\.(png|jpe?g|gif)(\?|$)/i.test(src) && !modernFormat.test(src);
    }).length;
    addFinding(
      'On-Page SEO', 'low', 'Modern Image Formats',
      `${legacyImages} images use legacy formats (PNG/JPG/GIF) instead of WebP/AVIF.`,
      legacyImages === 0,
      'Serve images in modern formats (WebP or AVIF) to cut payload size and improve load speed.',
      'Convert these images to WebP/AVIF and update the markup with appropriate fallbacks.',
      '', 'starter'
    );

    const textContent = extractCleanText($);
    const wordCount = textContent.split(' ').filter(Boolean).length;
    addFinding(
      'On-Page SEO', 'low', 'Thin Content',
      `Estimated word count: ${wordCount}. (Optimal: >300 words).`,
      wordCount > 300,
      'Add more valuable, in-depth content to the page.',
      ''
    );

    const proseText = extractProseText($);
    const flesch = fleschReadingEase(proseText || textContent);
    addFinding(
      'On-Page SEO', 'low', 'Content Readability',
      `Flesch Reading Ease score: ${Math.round(flesch)}. Higher is easier to read.`,
      flesch > 50,
      'Use shorter sentences and simpler words to improve readability.',
      'Simplify this text to an 8th-grade reading level.'
    );

    // Keyword prominence (Starter) — do the page's core terms show up early in the
    // body? Rather than betting everything on a single guessed "primary keyword"
    // (the old logic picked title/H1 word #1, which false-fails whenever word #1
    // isn't the real topic, e.g. "Welcome to Acme"), we take ALL significant terms
    // from the H1/title and check how many land in the opening ~100 words. Passing
    // on any meaningful overlap avoids penalising pages that simply lead with a
    // synonym or a reordered phrase.
    const primarySource = (h1Count === 1 ? $('h1').first().text() : title) || title;
    const keyTerms = [...new Set(
      primarySource
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    )];
    if (keyTerms.length > 0) {
      const first100 = (proseText || textContent).toLowerCase().split(/\s+/).slice(0, 100).join(' ');
      const matched = keyTerms.filter(w => first100.includes(w));
      const inIntro = matched.length > 0;
      addFinding(
        'On-Page SEO', 'medium', 'Keyword Prominence',
        inIntro
          ? `${matched.length} of ${keyTerms.length} core term(s) from your title/H1 ("${matched.slice(0, 3).join('", "')}") appear in the first 100 words of body content.`
          : `None of your title/H1 core terms (${keyTerms.slice(0, 3).join(', ')}) appear in the first 100 words of body content.`,
        inIntro,
        'Mention your core topic terms early — ideally within the opening paragraph — to reinforce topical relevance.',
        `Rewrite the opening paragraph to naturally include your core terms: ${keyTerms.slice(0, 4).join(', ')}.`,
        '', 'starter'
      );
    }


    // --- STRUCTURED DATA ---

    const schemaData = extractSchemas($);
    addFinding(
      'Structured Data', 'medium', 'Schema.org JSON-LD',
      `Found ${schemaData.schemas.length} JSON-LD schemas.`,
      schemaData.schemas.length > 0,
      'Add JSON-LD structured data to help search engines understand your content.',
      'Generate Article JSON-LD schema for a blog post.'
    );

    const ogData = extractOpenGraph($);
    addFinding(
      'Structured Data', 'medium', 'Open Graph Tags',
      'Checks for og:title and og:image tags for social sharing.',
      !!(ogData.title && ogData.image),
      'Add Open Graph meta tags to improve social media previews.',
      'Add Open Graph tags in Next.js Metadata API.'
    );

    const twData = extractTwitterCards($);
    addFinding(
      'Structured Data', 'low', 'Twitter Card Tags',
      'Checks for twitter:card and twitter:title.',
      !!(twData.card && twData.title),
      'Add Twitter card meta tags for better Twitter sharing.',
      'Add Twitter card tags in Next.js Metadata API.'
    );

    if (schemaData.schemas.length > 0) {
      addFinding(
        'Structured Data', 'low', 'Schema Types Inventory',
        `Detected types: ${schemaData.types.join(', ')}`,
        true,
        '',
        ''
      );
    }


    // --- LINK HEALTH ---

    const internalLinks = [];
    const externalLinks = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      const rel = $(el).attr('rel') || '';
      try {
        const u = new URL(href, targetUrl.href);
        if (u.origin === targetUrl.origin) {
          internalLinks.push({ url: u.href, text, rel });
        } else {
          externalLinks.push({ url: u.href, text, rel });
        }
      } catch (e) {}
    });

    addFinding(
      'Link Health', 'medium', 'Internal Link Count',
      `Found ${internalLinks.length} internal links.`,
      internalLinks.length >= 3,
      'Add more contextual internal links to other pages on your site.',
      ''
    );

    const nofollowInternal = internalLinks.filter(l => l.rel.includes('nofollow')).length;
    addFinding(
      'Link Health', 'medium', 'Nofollow on Internal Links',
      `Found ${nofollowInternal} internal links with nofollow.`,
      nofollowInternal === 0,
      'Remove nofollow from internal links to allow link equity to flow.',
      ''
    );

    const missingAnchor = internalLinks.filter(l => !l.text || l.text.toLowerCase() === 'click here' || l.text.toLowerCase() === 'read more').length;
    addFinding(
      'Link Health', 'low', 'Missing/Generic Anchor Text',
      `Found ${missingAnchor} links with generic or missing anchor text.`,
      missingAnchor === 0,
      'Use descriptive anchor text instead of "click here".',
      ''
    );

    const httpExternal = externalLinks.filter(l => l.url.startsWith('http://')).length;
    addFinding(
      'Link Health', 'low', 'External Link Protocols',
      `Found ${httpExternal} external links using insecure http://.`,
      httpExternal === 0,
      'Update external links to use https://.',
      ''
    );

    // Broken links (HEAD check). Free plans sample 5 links for speed;
    // Starter and above run a wider 25-link parallel crawl.
    const linkBudget = rank >= TIER_RANK.starter ? 25 : 5;
    const linksToCheck = internalLinks.slice(0, linkBudget);
    const linkResults = await Promise.all(linksToCheck.map(async (link) => {
      try {
        const r = await fetch(link.url, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
        return !r.ok && r.status !== 405 ? 1 : 0; // 405 means HEAD not allowed
      } catch (e) {
        return 1;
      }
    }));
    const brokenLinks = linkResults.reduce((a, b) => a + b, 0);
    addFinding(
      'Link Health', 'high', 'Broken Internal Links',
      `Checked ${linksToCheck.length} internal link${linksToCheck.length === 1 ? '' : 's'}; found ${brokenLinks} broken.`,
      brokenLinks === 0,
      'Fix or remove broken internal links to improve crawlability.',
      ''
    );

    // ─────────────────────────── PRO TIER ───────────────────────────
    // Core Web Vitals, redirect-chain tracing and Local SEO/NAP validation.
    // These consume external API quota / extra latency, so they only execute
    // for Pro and above (findings are also tier-gated for display).
    if (rank >= TIER_RANK.pro) {
      // Core Web Vitals via Google PageSpeed Insights (started up front, above).
      const psi = await psiPromise;
      if (psi.ok) {
        const cwv = psi.coreWebVitals;
        addFinding(
          'Technical SEO', 'high', 'Largest Contentful Paint (LCP)',
          `LCP is ${cwv.lcp.value} (good ≤ 2.5s).`,
          cwv.lcp.status === 'good',
          'Optimize your largest above-the-fold element (hero image, heading) and reduce render-blocking resources.',
          'How to improve Largest Contentful Paint in a Next.js app.',
          '', 'pro'
        );
        addFinding(
          'Technical SEO', 'high', 'Cumulative Layout Shift (CLS)',
          `CLS is ${cwv.cls.value} (good ≤ 0.1).`,
          cwv.cls.status === 'good',
          'Reserve space for images/ads/embeds with explicit dimensions to stop layout jumps.',
          'How to eliminate Cumulative Layout Shift in a Next.js app.',
          '', 'pro'
        );
        addFinding(
          'Technical SEO', 'medium', 'First Contentful Paint (FCP)',
          `FCP is ${cwv.fcp.value} (good ≤ 1.8s).`,
          cwv.fcp.status === 'good',
          'Reduce server response time and eliminate render-blocking CSS/JS to paint content sooner.',
          'How to improve First Contentful Paint in a Next.js app.',
          '', 'pro'
        );
      } else {
        addFinding(
          'Technical SEO', 'low', 'Core Web Vitals',
          'Core Web Vitals data could not be retrieved from Google PageSpeed Insights.',
          false,
          'Ensure the PageSpeed Insights API key is configured and the URL is publicly reachable.',
          '', '', 'pro'
        );
      }

      // Redirect chain detection on a sample of internal links.
      let chainedLinks = 0;
      const redirectSample = internalLinks.slice(0, 10);
      const chains = await Promise.all(redirectSample.map(l => traceRedirects(l.url).catch(() => ({ hops: 0 }))));
      chainedLinks = chains.filter(c => c.hops >= 2).length;
      addFinding(
        'Link Health', 'medium', 'Redirect Chains',
        `${chainedLinks} of ${redirectSample.length} sampled internal links pass through 2+ redirects before resolving, diluting link equity.`,
        chainedLinks === 0,
        'Point internal links directly at their final destination instead of chaining through multiple 301/302 redirects.',
        'How to flatten redirect chains and update internal links to their canonical destinations.',
        '', 'pro'
      );

      // Local SEO / NAP validation via LocalBusiness JSON-LD.
      const localBusiness = schemaData.schemas.find(s => {
        const type = s['@type'];
        const types = Array.isArray(type) ? type : [type];
        return types.some(t => typeof t === 'string' && /LocalBusiness|Organization|Store|Restaurant/i.test(t));
      });
      if (localBusiness) {
        const hasName = !!localBusiness.name;
        const hasAddress = !!localBusiness.address;
        const hasPhone = !!(localBusiness.telephone || localBusiness.phone);
        const napComplete = hasName && hasAddress && hasPhone;
        const missing = [!hasName && 'Name', !hasAddress && 'Address', !hasPhone && 'Phone'].filter(Boolean);
        addFinding(
          'Structured Data', 'medium', 'Local SEO NAP Consistency',
          napComplete
            ? 'LocalBusiness schema includes complete Name, Address and Phone (NAP) data.'
            : `LocalBusiness schema is missing: ${missing.join(', ')}.`,
          napComplete,
          'Provide complete and consistent Name, Address and Phone details in your LocalBusiness JSON-LD for local search.',
          'Generate a complete LocalBusiness JSON-LD schema with name, address and telephone fields.',
          '', 'pro'
        );
      } else {
        addFinding(
          'Structured Data', 'low', 'Local SEO NAP Consistency',
          'No LocalBusiness/Organization JSON-LD schema found for NAP validation.',
          false,
          'Add LocalBusiness JSON-LD with Name, Address and Phone if you serve a physical location.',
          'Generate a LocalBusiness JSON-LD schema for a business with a physical address.',
          '', 'pro'
        );
      }
    } else {
      // Below Pro: emit locked teaser placeholders so the Pro tab shows blurred
      // upsell cards. The real (expensive) checks are NOT run and these don't score.
      addTeaser('Technical SEO', 'high', 'Largest Contentful Paint (LCP)', 'pro');
      addTeaser('Technical SEO', 'high', 'Cumulative Layout Shift (CLS)', 'pro');
      addTeaser('Technical SEO', 'medium', 'First Contentful Paint (FCP)', 'pro');
      addTeaser('Link Health', 'medium', 'Redirect Chains', 'pro');
      addTeaser('Structured Data', 'medium', 'Local SEO NAP Consistency', 'pro');
    }

    // Below Pro: teaser placeholders for the AI semantic features (delivered
    // in the AI Insights tab for Pro users) so the Pro tab shows blurred
    // upsell cards to Free/Starter users.
    if (rank < TIER_RANK.pro) {
      addTeaser('On-Page SEO', 'high', 'AI Search Intent Mapping', 'pro');
      addTeaser('On-Page SEO', 'medium', 'LSI Keyword Gap Analysis', 'pro');
      addTeaser('On-Page SEO', 'medium', 'Semantic Coverage Score', 'pro');
    }

  } catch (error) {
    console.error('[SEO Scanner] Error:', error);
    addScanErrorFinding(addFinding, error);
  }

  const { overall, categories } = calculateScore(getFindings());

  return {
    score: overall,
    categories,
    findings: getFindings(),
    html: capturedHtml,
    timestamp: new Date().toISOString()
  };
}
