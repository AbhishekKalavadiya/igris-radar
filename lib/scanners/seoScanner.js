import { fetchWithCheerio } from './shared/fetcher.js';
import { createFindingsCollector } from './shared/findings.js';
import { calculateScore } from './shared/scoring.js';
import { hasRobotsTxt, fetchRobotsTxt, getSitemapUrls } from './shared/robotsParser.js';
import { extractSchemas, extractOpenGraph, extractTwitterCards } from './shared/schemaExtractor.js';
import { extractCleanText, extractProseText, fleschReadingEase } from './shared/textContent.js';

export async function runSeoScan(url) {
  const { addFinding, getFindings } = createFindingsCollector();
  const startTime = Date.now();

  try {
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
    
    // Check HTTPS enforcement
    addFinding(
      'Technical SEO', 'high', 'HTTPS Enforced',
      'Checks if the site is served over a secure HTTPS connection.',
      normalizedUrl.startsWith('https'),
      'Ensure the site uses an SSL certificate and redirects HTTP to HTTPS.',
      'How to enforce HTTPS redirects in Next.js/Node.js'
    );

    const { html, $, response, targetUrl } = await fetchWithCheerio(normalizedUrl);
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
      'Technical SEO', 'medium', 'XML Sitemap presence',
      'Checks for a valid sitemap.xml.',
      hasValidSitemap,
      'Generate an XML sitemap and submit it to Google Search Console.',
      'How to auto-generate a sitemap.xml in Next.js App Router.'
    );

    const canonical = $('link[rel="canonical"]').attr('href');
    addFinding(
      'Technical SEO', 'medium', 'Canonical URL',
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


    // --- ON-PAGE SEO ---

    const title = $('title').text().trim();
    const titlePassed = title.length >= 10 && title.length <= 70;
    addFinding(
      'On-Page SEO', 'high', 'Title Tag Optimization',
      `Title length: ${title.length} chars. Optimal is 10-70 chars.`,
      titlePassed,
      'Write a descriptive title tag between 10 and 70 characters.',
      'Generate 5 SEO-optimized title tags for a page about this topic.'
    );

    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const descPassed = metaDesc.length >= 50 && metaDesc.length <= 160;
    addFinding(
      'On-Page SEO', 'high', 'Meta Description',
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
      'On-Page SEO', 'high', 'H1 Tag Hierarchy',
      `Found ${h1Count} H1 tags. Optimal is exactly 1.`,
      h1Count === 1,
      'Ensure there is exactly one <h1> tag on the page, representing the main topic.',
      ''
    );

    if (h1Count === 1) {
      const h1Text = $('h1').text().trim().toLowerCase();
      const firstTitleWord = title.split(' ')[0]?.toLowerCase();
      const titleInH1 = firstTitleWord && h1Text.includes(firstTitleWord);
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

    // Broken links (HEAD check up to 5 internal links for speed)
    let brokenLinks = 0;
    const linksToCheck = internalLinks.slice(0, 5);
    for (const link of linksToCheck) {
      try {
        const r = await fetch(link.url, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
        if (!r.ok && r.status !== 405) brokenLinks++; // 405 means HEAD not allowed
      } catch (e) {
        brokenLinks++;
      }
    }
    addFinding(
      'Link Health', 'high', 'Broken Internal Links',
      `Checked 5 internal links; found ${brokenLinks} broken.`,
      brokenLinks === 0,
      'Fix or remove broken internal links to improve crawlability.',
      ''
    );

  } catch (error) {
    console.error('[SEO Scanner] Error:', error);
    addFinding('General', 'critical', 'Site Fetch', `Failed to load URL: ${error.message}`, false, 'Ensure the site is accessible.', '');
  }

  const { overall, categories } = calculateScore(getFindings());

  return {
    score: overall,
    categories,
    findings: getFindings(),
    timestamp: new Date().toISOString()
  };
}
