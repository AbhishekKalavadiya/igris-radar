import { fetchWithCheerio } from './shared/fetcher.js';
import { createFindingsCollector } from './shared/findings.js';
import { calculateScore } from './shared/scoring.js';
import { extractSchemas } from './shared/schemaExtractor.js';

export async function runGeoScan(url) {
  const { addFinding, getFindings } = createFindingsCollector();
  const startTime = Date.now();

  try {
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

    const { html, $, response, targetUrl } = await fetchWithCheerio(normalizedUrl);
    
    // Extract textual content once for multiple checks
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').length;
    
    // Reusable parsed data
    const schemaData = extractSchemas($);
    const hasSchemaType = schemaData.hasType;

    // --- CATEGORY 1: ENTITY AUTHORITY ---
    
    const hasAuthorRel = $('a[rel~="author"]').length > 0;
    const hasAuthorSchema = hasSchemaType('Person') || hasSchemaType('Organization');
    addFinding(
      'Entity Authority', 'high', 'Author Byline and Bio',
      'Checks for explicit author signals (rel="author" or Schema.org Person).',
      hasAuthorRel || hasAuthorSchema,
      'Add an author byline with a link to their bio, and include Person schema.',
      'Generate a Person JSON-LD schema for an author bio.'
    );

    const hasSameAs = html.includes('sameAs');
    addFinding(
      'Entity Authority', 'medium', 'Social / sameAs Links',
      'Checks if the brand connects its social profiles or Wikipedia page via sameAs schema.',
      hasSameAs,
      'Use the sameAs property in your Organization schema to link to your verified social profiles.',
      'Generate Organization schema with sameAs links for Twitter and LinkedIn.'
    );

    const hasLogo = html.includes('"logo"') || $('img[class*="logo" i]').length > 0;
    addFinding(
      'Entity Authority', 'medium', 'Brand Logo Detection',
      'Checks if a recognizable brand logo is explicitly defined in HTML or Schema.',
      hasLogo,
      'Ensure your Organization schema explicitly defines the "logo" property.',
      ''
    );

    const hasDates = $('meta[property="article:published_time"]').length > 0 || html.includes('datePublished');
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


    // --- CATEGORY 2: TOPICAL AUTHORITY ---
    
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

    const hasFaq = hasSchemaType('FAQPage') || html.includes('FAQ');
    addFinding(
      'Topical Authority', 'high', 'FAQ Schema / Section',
      'Checks for FAQ content, which directly maps to AI query answering.',
      hasFaq,
      'Add an FAQ section with explicit Question/Answer pairs and FAQPage schema.',
      'Generate FAQPage schema for 3 common questions about this topic.'
    );
    
    // Internal link density
    const internalLinks = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      try {
        const u = new URL(href, targetUrl.href);
        if (u.origin === targetUrl.origin) internalLinks.push(u.href);
      } catch (e) {}
    });
    
    const linkDensity = internalLinks.length / (wordCount / 1000);
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


    // --- CATEGORY 3: FACTUAL DENSITY ---
    
    const externalLinks = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      try {
        const u = new URL(href, targetUrl.href);
        if (u.origin !== targetUrl.origin && u.protocol.startsWith('http')) {
          externalLinks.push(u.href);
        }
      } catch (e) {}
    });

    addFinding(
      'Factual Density', 'high', 'External Citations',
      `Found ${externalLinks.length} outbound links. AI engines trust content that cites sources.`,
      externalLinks.length >= 2,
      'Link to authoritative external sources (e.g., research, studies, official docs) when making claims.',
      ''
    );

    // Look for numbers/percentages as a proxy for facts
    const numMatches = textContent.match(/\d+(\.\d+)?%|\d{4}|(one|two|three|four|five|six|seven|eight|nine|ten) /gi) || [];
    const factDensity = numMatches.length / (wordCount / 1000);
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


    // --- CATEGORY 4: AI READABILITY ---
    
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

  } catch (error) {
    console.error('[GEO Scanner] Error:', error);
    addFinding('General', 'critical', 'Site Fetch', `Failed to load URL: ${error.message}`, false, 'Ensure the site is accessible.', '');
  }

  const { overall, categories } = calculateScore(getFindings());

  return {
    url,
    score: overall,
    categories,
    findings: getFindings(),
    timestamp: new Date().toISOString()
  };
}
