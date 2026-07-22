import { fetchWithCheerio } from './shared/fetcher.js';
import { createFindingsCollector } from './shared/findings.js';
import { addScanErrorFinding } from './shared/scanErrors.js';
import { calculateScore } from './shared/scoring.js';
import { extractSchemas, schemaHasProperty, schemaHasTypeDeep } from './shared/schemaExtractor.js';
import { extractCleanText } from './shared/textContent.js';

const TIER_RANK = { free: 0, starter: 1, pro: 2 };

/**
 * Runs the GEO (Generative Engine Optimization) audit — how likely LLMs are to
 * trust, cite, and recommend this entity and content. Deterministic checks are
 * tagged with the plan `tier` that unlocks them; findings.js/filterFindingsByPlan
 * handle redaction so lower tiers see blurred upsell cards. Every check here is
 * pure HTML/DOM analysis (no external API quota), so they always execute and are
 * gated only for display. Premium AI-powered analysis (Pro) is delivered
 * separately via aiAnalyzer.runDeepGeoAnalysis; teasers below advertise it.
 *
 * @param {string} url
 * @param {{ plan?: string }} [options]
 */
export async function runGeoScan(url, { plan = 'free' } = {}) {
  const rank = TIER_RANK[plan] ?? 0;
  const { addFinding, addTeaser, getFindings } = createFindingsCollector();
  // Captured so the caller can reuse this exact HTML snapshot for AI deep
  // analysis instead of re-fetching the page. Stays null if the fetch fails.
  let capturedHtml = null;

  try {
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

    const { html, $, response, targetUrl } = await fetchWithCheerio(normalizedUrl);
    capturedHtml = html;

    // Extract textual content once for multiple checks
    const textContent = extractCleanText($);
    const wordCount = textContent.split(' ').filter(Boolean).length;
    const first200 = textContent.split(/\s+/).filter(Boolean).slice(0, 200).join(' ');

    // Reusable parsed data
    const schemaData = extractSchemas($);
    const hasSchemaType = schemaData.hasType;

    // Internal / external link partition — reused across multiple checks.
    const internalLinks = [];
    const externalLinks = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      try {
        const u = new URL(href, targetUrl.href);
        if (u.origin === targetUrl.origin) internalLinks.push(u.href);
        else if (u.protocol.startsWith('http')) externalLinks.push(u.href);
      } catch (e) {}
    });

    // ─────────────────────── CATEGORY 1: ENTITY AUTHORITY ───────────────────────

    const hasAuthorRel = $('a[rel~="author"]').length > 0;
    const hasAuthorSchema = hasSchemaType('Person') || hasSchemaType('Organization');
    addFinding(
      'Entity Authority', 'high', 'Author Byline and Bio',
      'Checks for explicit author signals (rel="author" or Schema.org Person).',
      hasAuthorRel || hasAuthorSchema,
      'Add an author byline with a link to their bio, and include Person schema.',
      'Generate a Person JSON-LD schema for an author bio.'
    );

    const hasSameAs = schemaHasProperty(schemaData.schemas, 'sameAs');
    addFinding(
      'Entity Authority', 'medium', 'Social / sameAs Links',
      'Checks if the brand connects its social profiles or Wikipedia page via sameAs schema.',
      hasSameAs,
      'Use the sameAs property in your Organization schema to link to your verified social profiles.',
      'Generate Organization schema with sameAs links for Twitter and LinkedIn.'
    );

    const hasLogo = schemaHasProperty(schemaData.schemas, 'logo') || $('img[class*="logo" i]').length > 0 || $('img[alt*="logo" i]').length > 0;
    addFinding(
      'Entity Authority', 'medium', 'Brand Logo Detection',
      'Checks if a recognizable brand logo is explicitly defined in HTML or Schema.',
      hasLogo,
      'Ensure your Organization schema explicitly defines the "logo" property.',
      ''
    );

    const hasDates = $('meta[property="article:published_time"]').length > 0
      || $('time[datetime]').length > 0
      || schemaHasProperty(schemaData.schemas, 'datePublished')
      || schemaHasProperty(schemaData.schemas, 'dateModified');
    addFinding(
      'Entity Authority', 'medium', 'Publication Dates',
      'Checks if content publication and modification dates are clearly stated for freshness signals.',
      hasDates,
      'Add article:published_time meta tags or datePublished in your Article schema.',
      ''
    );

    const aboutPageLinked = $('a[href*="about" i]').length > 0;
    addFinding(
      'Entity Authority', 'low', 'About Page Linked',
      'Checks if an "About" or "Team" page is linked from the current page.',
      aboutPageLinked,
      'Link to your About page in the navigation or footer to establish trust.',
      ''
    );

    // ─── Free: Knowledge Graph entity signals (@id in JSON-LD) ───
    const hasEntityId = schemaHasProperty(schemaData.schemas, '@id');
    addFinding(
      'Entity Authority', 'high', 'Knowledge Graph Entity Signals',
      'Checks for @id fields in JSON-LD — how the Google Knowledge Graph identifies distinct entities. Without @id, your brand is invisible to the Knowledge Graph.',
      hasEntityId,
      'Add a stable @id (a canonical URI) to your Organization/Person JSON-LD so engines can resolve you to a single Knowledge Graph entity.',
      'Add a stable @id property to my Organization JSON-LD so it maps to a single Knowledge Graph entity.'
    );

    // ─── Free: Contact & trust signals ───
    const hasContactPoint = schemaHasTypeDeep(schemaData.schemas, 'ContactPoint') || schemaHasProperty(schemaData.schemas, 'contactPoint');
    const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(textContent) || $('a[href^="tel:"]').length > 0;
    const hasEmail = $('a[href^="mailto:"]').length > 0 || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(textContent);
    const hasAddress = schemaHasTypeDeep(schemaData.schemas, 'PostalAddress') || schemaHasProperty(schemaData.schemas, 'address') || $('address').length > 0;
    const contactSignals = [hasContactPoint, hasPhone, hasEmail, hasAddress].filter(Boolean).length;
    addFinding(
      'Entity Authority', 'medium', 'Contact & Trust Signals',
      `Detected ${contactSignals} of 4 verifiable contact signals (phone, email, address, ContactPoint schema). Generative engines trust entities they can verify.`,
      contactSignals >= 2,
      'Publish a visible phone, email, and postal address — ideally backed by ContactPoint / PostalAddress schema — so engines can verify your entity.',
      'Generate ContactPoint and PostalAddress JSON-LD for my organization.'
    );

    // ─── Pro: Entity disambiguation score (Organization/WebSite completeness) ───
    const orgSchemas = schemaData.schemas.filter(s => {
      const t = s['@type'];
      const types = Array.isArray(t) ? t : [t];
      return types.includes('Organization') || types.includes('WebSite');
    });
    if (orgSchemas.length > 0) {
      const DISAMBIG_FIELDS = ['description', 'foundingDate', 'founder', 'url', 'sameAs', 'logo'];
      let bestCoverage = 0;
      for (const org of orgSchemas) {
        const present = DISAMBIG_FIELDS.filter(f => org[f] != null && org[f] !== '').length;
        if (present > bestCoverage) bestCoverage = present;
      }
      addFinding(
        'Entity Authority', 'high', 'Entity Disambiguation Score',
        `Your Organization/WebSite schema populates ${bestCoverage} of ${DISAMBIG_FIELDS.length} disambiguation fields (description, foundingDate, founder, url, sameAs, logo). Incomplete entity data causes LLMs to confuse your brand with others.`,
        bestCoverage >= 4,
        'Fill in description, foundingDate, founder, url, sameAs and logo on your Organization schema so engines can distinguish your brand from similarly named ones.',
        'Expand my Organization JSON-LD with description, foundingDate, founder, url, sameAs and logo fields.',
        '', 'pro'
      );
    } else {
      addFinding(
        'Entity Authority', 'high', 'Entity Disambiguation Score',
        'No Organization or WebSite JSON-LD was found to score for entity disambiguation. Engines have nothing structured to resolve your brand identity against.',
        false,
        'Add Organization JSON-LD with description, foundingDate, founder, url, sameAs and logo so engines can disambiguate your brand.',
        'Generate complete Organization JSON-LD with description, foundingDate, founder, url, sameAs and logo.',
        '', 'pro'
      );
    }

    // ─────────────────────── CATEGORY 2: TOPICAL AUTHORITY ───────────────────────

    addFinding(
      'Topical Authority', 'high', 'Content Depth (Word Count)',
      `Estimated word count: ${wordCount}. Generative engines favor deep, comprehensive content (>1500 words).`,
      wordCount >= 1000,
      'Expand the content to thoroughly cover the topic and its subtopics.',
      'Suggest 3 subtopics to add to an article about this subject to make it more comprehensive.'
    );

    const hasBreadcrumbs = hasSchemaType('BreadcrumbList') || $('nav[class*="breadcrumb" i]').length > 0;
    addFinding(
      'Topical Authority', 'medium', 'Breadcrumb Trails',
      'Checks for breadcrumb navigation, helping LLMs understand topic hierarchy.',
      hasBreadcrumbs,
      'Implement BreadcrumbList schema or visible breadcrumb navigation.',
      'Generate BreadcrumbList JSON-LD schema for a 3-level site hierarchy.'
    );

    // Real FAQ signal = FAQPage/Question schema OR an actual on-page Q&A structure
    // (2+ question-style headings, or <summary> accordions ending in "?"). The old
    // `html.includes('FAQ')` fired on any "FAQ" nav link or footer label even when
    // the page had zero question content.
    const hasFaqSchema = schemaHasTypeDeep(schemaData.schemas, 'FAQPage') || schemaHasTypeDeep(schemaData.schemas, 'Question');
    const questionHeadings = $('h2, h3, h4, summary').toArray()
      .filter(el => $(el).text().trim().endsWith('?')).length;
    const hasFaq = hasFaqSchema || questionHeadings >= 2;
    addFinding(
      'Topical Authority', 'high', 'FAQ Schema / Section',
      'Checks for FAQ content, which directly maps to AI query answering.',
      hasFaq,
      'Add an FAQ section with explicit Question/Answer pairs and FAQPage schema.',
      'Generate FAQPage schema for 3 common questions about this topic.'
    );

    const linkDensity = internalLinks.length / (wordCount / 1000 || 1);
    addFinding(
      'Topical Authority', 'medium', 'Internal Link Density',
      `Found ${internalLinks.length} internal links. (Density: ${linkDensity.toFixed(1)} per 1000 words).`,
      linkDensity >= 2,
      'Link to other related pages on your site to build topical clusters.',
      ''
    );

    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    addFinding(
      'Topical Authority', 'low', 'Subtopic Hierarchy (H2/H3)',
      `Found ${h2Count} H2s and ${h3Count} H3s.`,
      h2Count >= 3,
      'Break your content down into detailed subtopics using H2 and H3 tags.',
      ''
    );

    // ─── Free: Unique value proposition detection ───
    const UVP_PATTERN = /\b(only|first|unique|unlike|proprietary|patented|exclusive|one of a kind|unrivaled|the leading)\b/i;
    const hasUvp = UVP_PATTERN.test(first200);
    addFinding(
      'Topical Authority', 'medium', 'Unique Value Proposition',
      hasUvp
        ? 'The opening 200 words contain differentiating language ("only", "first", "unlike"…), signalling an original perspective AIs prefer to cite.'
        : 'The opening 200 words read as commodity content — no differentiating claims ("only", "first", "unique", "unlike") were detected.',
      hasUvp,
      'Lead with a differentiating statement in the first paragraph — what makes this the original, definitive take AIs should cite over competitors.',
      'Rewrite my opening paragraph to state a clear, differentiated value proposition.'
    );

    // ─── Starter: Content uniqueness indicators (original research signals) ───
    const UNIQUENESS_PATTERN = /\b(we tested|we found|we analyzed|our research|our study|our data|case study|in our experience|we surveyed|according to our|we measured|our experiment)\b/i;
    const hasOriginalResearch = UNIQUENESS_PATTERN.test(textContent);
    const hasExpertQuote = $('blockquote').length > 0;
    const uniquenessSignals = (hasOriginalResearch ? 1 : 0) + (hasExpertQuote ? 1 : 0);
    addFinding(
      'Topical Authority', 'medium', 'Content Uniqueness Indicators',
      `Detected ${uniquenessSignals} original-content signal(s): first-person research (${hasOriginalResearch ? 'yes' : 'no'}), expert quotes/blockquotes (${hasExpertQuote ? 'yes' : 'no'}). Original content is cited far more than rephrased summaries.`,
      uniquenessSignals >= 1,
      'Add first-person research ("we tested", "our data"), case studies, or expert quotes — signals of original content LLMs preferentially cite.',
      'Add a short case study or original-research paragraph ("we tested…") to this content.',
      '', 'starter'
    );

    // ─── Pro: Topical cluster detection (internal links form coherent clusters) ───
    const internalPaths = internalLinks
      .map(l => { try { return new URL(l).pathname; } catch { return ''; } })
      .filter(p => p && p !== '/');
    const segmentCounts = {};
    for (const p of internalPaths) {
      const seg = p.split('/').filter(Boolean)[0];
      if (seg) segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
    }
    const topCluster = Math.max(0, ...Object.values(segmentCounts));
    const clusterShare = internalPaths.length ? topCluster / internalPaths.length : 0;
    const hasCluster = topCluster >= 3 && clusterShare >= 0.3;
    addFinding(
      'Topical Authority', 'medium', 'Topical Cluster Detection',
      hasCluster
        ? `Internal links concentrate around a coherent topic cluster (${topCluster} links share a common section path). Pillar-and-cluster architecture is rewarded by LLMs.`
        : 'Internal links appear scattered across unrelated sections rather than forming a coherent topic cluster around a pillar page.',
      hasCluster,
      'Organize internal links into pillar-and-cluster architecture — link related articles to a central pillar page under a shared path so engines see topical depth.',
      'Suggest a pillar-page and cluster internal-linking structure for this topic.',
      '', 'pro'
    );

    // ─────────────────────── CATEGORY 3: FACTUAL DENSITY ───────────────────────

    addFinding(
      'Factual Density', 'high', 'External Citations',
      `Found ${externalLinks.length} outbound links. AI engines trust content that cites sources.`,
      externalLinks.length >= 2,
      'Link to authoritative external sources (e.g., research, studies, official docs) when making claims.',
      ''
    );

    // Look for numbers/percentages as a proxy for facts
    const numMatches = textContent.match(/\d+(\.\d+)?%|\d{4}|(one|two|three|four|five|six|seven|eight|nine|ten) /gi) || [];
    const factDensity = numMatches.length / (wordCount / 1000 || 1);
    addFinding(
      'Factual Density', 'medium', 'Data Point Density',
      `Detected ~${numMatches.length} potential data points (numbers, stats, years).`,
      factDensity >= 5,
      'Include specific statistics, dates, and quantitative data to make the content more factual and citable.',
      ''
    );

    const hasQuotes = $('blockquote, q, cite').length > 0;
    addFinding(
      'Factual Density', 'medium', 'Quotes and Citations',
      'Checks for HTML tags commonly used for citations (blockquote, cite).',
      hasQuotes,
      'Use <blockquote> or <cite> tags when referencing external opinions or studies.',
      ''
    );

    const hasResearchLinks = externalLinks.some(l => l.includes('.edu') || l.includes('.gov') || l.includes('wikipedia.org') || l.includes('ncbi'));
    addFinding(
      'Factual Density', 'low', 'Authoritative Source Links',
      'Checks if outbound links point to high-trust domains (.edu, .gov, wikipedia).',
      hasResearchLinks,
      'Cite at least one highly trusted domain (like a .gov or academic site) to boost factual authority.',
      ''
    );

    // ─── Free: Definition format detection ───
    const DEFINITION_PATTERN = /\b[A-Z][A-Za-z0-9 ]{2,40}?\s+(is|are|refers to|means|is defined as)\s+(a|an|the|any|the process|the practice)\b/;
    const hasDefinitions = DEFINITION_PATTERN.test(textContent);
    addFinding(
      'Factual Density', 'medium', 'Definition Format Detection',
      hasDefinitions
        ? 'Clean definition patterns ("X is…", "X refers to…") were found — the extractable format LLMs heavily favor for direct answers.'
        : 'No clean definition patterns ("X is…", "X refers to…") were detected near your content. LLMs preferentially extract explicit definitions.',
      hasDefinitions,
      'Open key sections with a plain "X is…" or "X refers to…" definition sentence — the exact format LLMs lift as a direct answer.',
      'Write a one-sentence "X is…" definition for the main concept on this page.'
    );

    // ─── Starter: Wikipedia-style inline citations ───
    let inlineCitationParas = 0;
    let paraWithLinks = 0;
    $('p').each((_, el) => {
      const $p = $(el);
      const links = $p.find('a[href]');
      if (links.length === 0) return;
      let external = false;
      links.each((__, a) => {
        const href = $(a).attr('href');
        try {
          const u = new URL(href, targetUrl.href);
          if (u.origin !== targetUrl.origin && u.protocol.startsWith('http')) external = true;
        } catch (e) {}
      });
      if (external) { paraWithLinks += 1; inlineCitationParas += 1; }
    });
    addFinding(
      'Factual Density', 'medium', 'Wikipedia-Style Inline Citations',
      `${inlineCitationParas} paragraph(s) cite an external source inline (within the same <p> as the claim). Inline citations dramatically increase LLM trust versus links dumped in a footer.`,
      inlineCitationParas >= 2,
      'Place citations inline, right next to the claim they support (same paragraph), the way Wikipedia does — not collected in a footer or reference dump.',
      'Rewrite this section to place source citations inline next to each factual claim.',
      '', 'starter'
    );

    // ─── Starter: Statistic freshness heuristic (stats accompanied by a year) ───
    const currentYear = new Date().getFullYear();
    const statNearYear = new RegExp(`\\d+(\\.\\d+)?%[^.]{0,60}\\b(20(1|2)\\d)\\b|\\b(20(1|2)\\d)\\b[^.]{0,60}\\d+(\\.\\d+)?%`, 'i');
    // Only pages that actually cite statistics can have a stat-freshness problem.
    // Gate the whole check on the presence of a percentage-style statistic: a
    // page with no stats has nothing to date, so it must pass rather than fail
    // with a message that falsely claims "statistics were found".
    const hasPercentStat = /\d+(\.\d+)?\s?%/.test(textContent);
    const hasDatedStats = statNearYear.test(textContent);
    const recentYearMentioned = new RegExp(`\\b(${currentYear}|${currentYear - 1})\\b`).test(textContent);
    const statFreshnessPassed = !hasPercentStat || hasDatedStats;
    addFinding(
      'Factual Density', 'medium', 'Statistic Freshness',
      !hasPercentStat
        ? 'No percentage-based statistics were found on the page, so there is nothing to date-qualify.'
        : hasDatedStats
        ? `Statistics appear alongside year references${recentYearMentioned ? ' including recent years' : ''}, signalling current data that engines prioritize.`
        : 'Statistics were found without nearby year references. Undated stats get deprioritized by engines that favor current data.',
      statFreshnessPassed,
      'Attach a year to each statistic ("in 2025", "a 2024 study found") so engines can judge freshness and prefer your data.',
      'Add year references to the statistics in this content (e.g. "as of 2025").',
      '', 'starter'
    );

    // ─── Pro: Comparison & "Best Of" optimization ───
    const COMPARISON_PATTERN = /\b(vs\.?|versus|compared to|alternative(s)? to|pros and cons|pros & cons|best\s+\w+\s+(for|of|to)|top \d+|comparison)\b/i;
    const hasComparison = COMPARISON_PATTERN.test(textContent) || COMPARISON_PATTERN.test($('h1, h2, h3').text());
    addFinding(
      'Factual Density', 'high', 'Comparison & "Best Of" Optimization',
      hasComparison
        ? 'Comparison patterns (vs., alternatives, pros/cons, "best of") were detected — the #1 most-cited content type in AI shopping and recommendation queries.'
        : 'No comparison or "best of" framing was detected. Comparison content (vs., alternatives, pros/cons) is the most-cited type in AI recommendation queries.',
      hasComparison,
      'Add explicit comparison sections — "X vs Y", "best tools for…", pros/cons tables — the content AIs lean on most for recommendation answers.',
      'Draft a "X vs Y" comparison section with a pros-and-cons table for this topic.',
      '', 'pro'
    );

    // ─────────────────────── CATEGORY 4: AI READABILITY ───────────────────────

    // Paragraph length analysis
    const paragraphs = [];
    $('p').each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > 30) paragraphs.push(t);
    });

    let avgSentencesPerP = 0;
    if (paragraphs.length > 0) {
      const totalSentences = paragraphs.reduce((acc, p) => acc + (p.split(/[.!?]+/).length - 1 || 1), 0);
      avgSentencesPerP = totalSentences / paragraphs.length;
    }

    addFinding(
      'AI Readability', 'high', 'Paragraph Chunking',
      `Average sentences per paragraph: ${avgSentencesPerP.toFixed(1)}. LLMs prefer short, self-contained paragraphs (2-4 sentences).`,
      avgSentencesPerP > 1 && avgSentencesPerP <= 5,
      'Keep paragraphs between 2-4 sentences to make them easily extractable by AI engines.',
      'Rewrite this long paragraph into 2 shorter, punchy paragraphs.'
    );

    const hasTables = $('table').length > 0;
    addFinding(
      'AI Readability', 'medium', 'Data Structuring (Tables)',
      'Checks for HTML tables. AI engines excel at extracting structured data from tables.',
      hasTables,
      'Convert lists of comparisons or data points into HTML tables for easier AI parsing.',
      'Format this list of data into a clean HTML table.'
    );

    const hasLists = $('ul, ol').length > 0;
    addFinding(
      'AI Readability', 'medium', 'List Usage',
      'Checks for bulleted or numbered lists.',
      hasLists,
      'Use <ul> or <ol> lists for steps, ingredients, or feature breakdowns.',
      ''
    );

    // Look for ambiguous pronouns at start of sentences (heuristic)
    const ambiguityMatches = textContent.match(/(^|\. )[Tt]his is |(^|\. )[Ii]t is /g) || [];
    addFinding(
      'AI Readability', 'low', 'Pronoun Ambiguity',
      `Found ${ambiguityMatches.length} instances of ambiguous pronouns (e.g., "This is...", "It is...").`,
      ambiguityMatches.length < 10,
      'Replace ambiguous pronouns with explicit nouns (e.g., replace "This is..." with "This process is...") to retain context when AI extracts a single sentence.',
      ''
    );

    // ─── Free: Semantic HTML landmarks ───
    const landmarks = ['article', 'section', 'aside', 'nav'].filter(tag => $(tag).length > 0);
    addFinding(
      'AI Readability', 'medium', 'Semantic HTML Landmarks',
      `Found ${landmarks.length} of 4 semantic landmark types (${landmarks.join(', ') || 'none'}). LLMs use <article>/<section>/<aside>/<nav> to separate primary content from boilerplate.`,
      landmarks.length >= 2,
      'Wrap primary content in <article>/<section> and navigation/sidebars in <nav>/<aside> so engines can isolate the main content from boilerplate.',
      'Convert this page\'s layout <div>s into semantic <article>, <section>, <nav> and <aside> landmarks.'
    );

    // ─── Free: Image with caption detection ───
    const totalImages = $('img').length;
    let captionedImages = 0;
    $('figure').each((_, el) => {
      if ($(el).find('figcaption').length > 0 && $(el).find('img').length > 0) captionedImages += 1;
    });
    addFinding(
      'AI Readability', 'low', 'Image Captions',
      totalImages === 0
        ? 'No content images were found to check for captions.'
        : `${captionedImages} of ${totalImages} image(s) sit inside a <figure> with a <figcaption>. LLMs can't see images but DO read captions.`,
      totalImages === 0 || captionedImages > 0,
      'Wrap meaningful images in <figure> with a descriptive <figcaption> — captions are the only part of an image an LLM can read and cite.',
      'Wrap this image in a <figure> element with a descriptive <figcaption>.'
    );

    // ─── Starter: Multi-format content score ───
    const formats = {
      text: wordCount > 100,
      lists: hasLists,
      tables: hasTables,
      code: $('pre, code').length > 0,
      captionedImages: captionedImages > 0,
    };
    const formatCount = Object.values(formats).filter(Boolean).length;
    addFinding(
      'AI Readability', 'medium', 'Multi-Format Content Score',
      `This page mixes ${formatCount} of 5 content formats (text, lists, tables, code, captioned images). Pages with 3+ formats are extracted more reliably by AI engines.`,
      formatCount >= 3,
      'Diversify formats — combine prose with lists, a comparison table, code samples and captioned images so engines have multiple extractable structures.',
      'Suggest which content formats (table, list, code, captioned image) to add to enrich this page.',
      '', 'starter'
    );

    // ─── Starter: Heading as complete thoughts ───
    const headingTexts = $('h2, h3').toArray().map(el => $(el).text().trim()).filter(Boolean);
    let descriptiveHeadings = 0;
    for (const h of headingTexts) {
      if (h.split(/\s+/).filter(Boolean).length >= 3) descriptiveHeadings += 1;
    }
    const descriptiveRatio = headingTexts.length ? descriptiveHeadings / headingTexts.length : 0;
    addFinding(
      'AI Readability', 'low', 'Heading Completeness',
      headingTexts.length === 0
        ? 'No H2/H3 subheadings were found to evaluate for descriptiveness.'
        : `${descriptiveHeadings} of ${headingTexts.length} subheadings are descriptive phrases (3+ words) rather than single words. Descriptive headings ("How to Install Node.js") match user prompts better than "Installation".`,
      headingTexts.length > 0 && descriptiveRatio >= 0.6,
      'Write headings as complete, descriptive phrases that mirror how users phrase questions ("How to Install Node.js"), not terse labels ("Installation").',
      'Rewrite these single-word headings as descriptive phrases matching common search prompts.',
      '', 'starter'
    );

    // ─── Pro: Structured summary detection (TL;DR / key takeaways) ───
    const SUMMARY_PATTERN = /\b(tl;?dr|key takeaways?|in summary|executive summary|quick summary|the bottom line|key points|at a glance)\b/i;
    const hasSummary = SUMMARY_PATTERN.test(textContent) ||
      $('h2, h3').toArray().some(el => SUMMARY_PATTERN.test($(el).text()));
    addFinding(
      'AI Readability', 'high', 'Structured Summary Detection',
      hasSummary
        ? 'A TL;DR, executive summary, or key-takeaways section was detected — LLMs preferentially extract these as the primary answer snippet.'
        : 'No TL;DR, executive summary, or key-takeaways section was found. LLMs lift these summary blocks first when generating direct answers.',
      hasSummary,
      'Add a clearly labelled "TL;DR" or "Key Takeaways" section near the top — the block LLMs extract first as a direct answer.',
      'Write a 3-bullet "Key Takeaways" summary block for this article.',
      '', 'pro'
    );

    // ─────────────────────────── PRO AI TEASERS ───────────────────────────
    // Premium AI semantic features are delivered in the AI Insights tab for
    // Pro users. Show blurred upsell cards to everyone below Pro.
    if (rank < TIER_RANK.pro) {
      addTeaser('Factual Density', 'high', 'Citation Simulation', 'pro');
      addTeaser('Entity Authority', 'high', 'Knowledge Graph Gap Analysis', 'pro');
      addTeaser('Topical Authority', 'high', 'Topical Authority Depth Map', 'pro');
      addTeaser('Entity Authority', 'medium', 'Competitive Positioning Report', 'pro');
    }

  } catch (error) {
    console.error('[GEO Scanner] Error:', error);
    addScanErrorFinding(addFinding, error);
  }

  const { overall, categories } = calculateScore(getFindings());

  return {
    url,
    score: overall,
    categories,
    findings: getFindings(),
    html: capturedHtml,
    timestamp: new Date().toISOString()
  };
}
