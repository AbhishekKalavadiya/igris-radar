import { crawlSite } from './crawler.js';
import { createFindingsCollector } from './findings.js';
import { extractCleanText } from './textContent.js';

const CATEGORY = 'Multi-Page Audit';

/** Normalize a URL for graph-node identity (drop hash, trailing slash). */
function normUrl(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    let s = url.toString();
    return s.endsWith('/') ? s.slice(0, -1) : s;
  } catch {
    return u;
  }
}

/**
 * Multi-page site audit: crawls the site, derives per-page on-page signals,
 * aggregates them into site-wide findings, and builds an internal-link graph
 * (used for orphan-page detection and the GEO topic-cluster map).
 *
 * Shared by the SEO, AEO and GEO scanners (DRY) — the crawled pages are cheap
 * cheerio parses reused across all page-level signals, so we never re-fetch.
 *
 * @param {string} startUrl
 * @param {{ maxPages?: number, delay?: number }} [options]
 * @returns {Promise<{ pages: Array, findings: Array, linkGraph: object, crawledCount: number, errorCount: number }>}
 */
export async function runSiteAudit(startUrl, { maxPages = 8, delay = 400 } = {}) {
  const crawl = await crawlSite(startUrl, { maxPages, delay });

  const pages = crawl.pages.map(p => {
    const $ = p.$;
    const origin = (() => { try { return new URL(p.url).origin; } catch { return null; } })();
    const title = $('title').first().text().trim();
    const metaDescription = ($('meta[name="description"]').attr('content') || '').trim();
    const h1Count = $('h1').length;
    const text = extractCleanText($);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const imagesMissingAlt = $('img').filter((_, el) => !$(el).attr('alt')).length;
    const hasCanonical = !!$('link[rel="canonical"]').attr('href');

    const internalTargets = new Set();
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      try {
        const u = new URL(href, p.url);
        if (origin && u.origin === origin) internalTargets.add(normUrl(u.toString()));
      } catch {}
    });

    return {
      url: p.url,
      statusCode: p.statusCode,
      title,
      metaDescription,
      h1Count,
      wordCount,
      imagesMissingAlt,
      hasCanonical,
      internalTargets: [...internalTargets],
    };
  });

  // ── Internal-link graph (inbound counts among crawled pages) ──────────────
  const nodeSet = new Set(pages.map(p => normUrl(p.url)));
  const inbound = new Map([...nodeSet].map(n => [n, 0]));
  const edges = [];
  for (const p of pages) {
    const from = normUrl(p.url);
    for (const t of p.internalTargets) {
      if (nodeSet.has(t) && t !== from) {
        inbound.set(t, (inbound.get(t) || 0) + 1);
        edges.push([from, t]);
      }
    }
  }

  const linkGraph = {
    nodes: pages.map(p => ({
      url: p.url,
      title: p.title || p.url,
      inbound: inbound.get(normUrl(p.url)) || 0,
      wordCount: p.wordCount,
    })),
    edges,
  };

  // ── Site-wide findings ────────────────────────────────────────────────────
  const { addFinding, getFindings } = createFindingsCollector();
  const total = pages.length;

  if (total === 0) {
    addFinding(
      CATEGORY, 'high', 'Multi-Page Crawl',
      'The crawler could not retrieve any pages from this site.',
      false,
      'Ensure the site is reachable and not blocking the IgrisRadarBot user-agent in robots.txt.',
      '', '', 'free'
    );
    return { pages, findings: getFindings(), linkGraph, crawledCount: 0, errorCount: crawl.errors.length };
  }

  const missingMeta = pages.filter(p => !p.metaDescription).length;
  addFinding(
    CATEGORY, 'high', 'Site-Wide Meta Descriptions',
    `${missingMeta} of ${total} crawled pages are missing a meta description.`,
    missingMeta === 0,
    'Add a unique, compelling meta description to every indexable page.',
    'Write meta descriptions for the pages that are missing one.', '', 'free'
  );

  const missingTitle = pages.filter(p => !p.title).length;
  addFinding(
    CATEGORY, 'high', 'Site-Wide Title Tags',
    `${missingTitle} of ${total} crawled pages are missing a <title> tag.`,
    missingTitle === 0,
    'Give every page a unique, descriptive title tag.',
    '', '', 'free'
  );

  const titleCounts = {};
  for (const p of pages) {
    if (p.title) { const k = p.title.toLowerCase(); titleCounts[k] = (titleCounts[k] || 0) + 1; }
  }
  const dupTitleGroups = Object.values(titleCounts).filter(c => c > 1).length;
  addFinding(
    CATEGORY, 'medium', 'Duplicate Page Titles',
    `${dupTitleGroups} title${dupTitleGroups === 1 ? ' is' : 's are'} shared by multiple crawled pages.`,
    dupTitleGroups === 0,
    'Make each page title unique so search engines can distinguish your pages.',
    '', '', 'free'
  );

  const noH1 = pages.filter(p => p.h1Count === 0).length;
  addFinding(
    CATEGORY, 'medium', 'Site-Wide H1 Coverage',
    `${noH1} of ${total} crawled pages have no H1 heading.`,
    noH1 === 0,
    'Ensure every page has exactly one descriptive H1 heading.',
    '', '', 'free'
  );

  const thin = pages.filter(p => p.wordCount < 300).length;
  addFinding(
    CATEGORY, 'medium', 'Thin Content Pages',
    `${thin} of ${total} crawled pages have thin content (< 300 words).`,
    thin === 0,
    'Expand thin pages with more useful, in-depth content or consolidate them.',
    '', '', 'free'
  );

  const noCanonical = pages.filter(p => !p.hasCanonical).length;
  addFinding(
    CATEGORY, 'low', 'Site-Wide Canonical Tags',
    `${noCanonical} of ${total} crawled pages have no canonical tag.`,
    noCanonical === 0,
    'Add a self-referencing canonical tag to each page to avoid duplicate-content issues.',
    '', '', 'free'
  );

  const totalImgAlt = pages.reduce((a, p) => a + p.imagesMissingAlt, 0);
  addFinding(
    CATEGORY, 'low', 'Site-Wide Image Alt Text',
    `${totalImgAlt} image${totalImgAlt === 1 ? '' : 's'} across the crawled pages are missing alt text.`,
    totalImgAlt === 0,
    'Add descriptive alt text to all meaningful images across the site.',
    '', '', 'free'
  );

  // Orphan pages: crawled pages (other than the entry page) with no internal
  // links pointing to them from the rest of the crawl.
  const startNorm = normUrl(pages[0].url);
  const orphans = pages.filter(p => normUrl(p.url) !== startNorm && (inbound.get(normUrl(p.url)) || 0) === 0).length;
  addFinding(
    CATEGORY, 'medium', 'Orphan Pages',
    `${orphans} crawled page${orphans === 1 ? ' has' : 's have'} no internal links pointing to them.`,
    orphans === 0,
    'Link to orphan pages from relevant hub pages so users and crawlers can discover them.',
    '', '', 'free'
  );

  addFinding(
    CATEGORY, 'high', 'Broken / Unreachable Pages',
    `${crawl.errors.length} internal link${crawl.errors.length === 1 ? '' : 's'} failed to load during the crawl.`,
    crawl.errors.length === 0,
    'Fix or remove internal links that return errors or are blocked.',
    '', '', 'free'
  );

  return {
    pages,
    findings: getFindings(),
    linkGraph,
    crawledCount: total,
    errorCount: crawl.errors.length,
  };
}
