import { fetchWithCheerio } from './shared/fetcher.js';
import { createFindingsCollector } from './shared/findings.js';
import { addScanErrorFinding } from './shared/scanErrors.js';
import { calculateScore } from './shared/scoring.js';
import { fetchRobotsTxt, isUserAgentAllowed } from './shared/robotsParser.js';
import { extractSchemas } from './shared/schemaExtractor.js';
import { extractCleanText } from './shared/textContent.js';

const TIER_RANK = { free: 0, starter: 1, pro: 2 };

/**
 * Runs the AEO (Answer Engine Optimization) audit. Deterministic checks are
 * tagged with the plan `tier` that unlocks them — findings.js/filterFindingsByPlan
 * handle redaction so lower tiers see blurred upsell cards. Every check here is
 * pure HTML/DOM analysis (no external API quota), so they always execute and are
 * gated only for display. Premium AI-powered analysis (Pro) is delivered
 * separately via aiAnalyzer.runDeepAeoAnalysis; teasers below advertise it.
 *
 * @param {string} url
 * @param {{ plan?: string }} [options]
 */
export async function runAeoScan(url, { plan = 'free' } = {}) {
  const rank = TIER_RANK[plan] ?? 0;
  const { addFinding, addTeaser, getFindings } = createFindingsCollector();
  const startTime = Date.now();
  // Captured so the caller can reuse this exact HTML snapshot for AI deep
  // analysis instead of re-fetching the page. Stays null if the fetch fails.
  let capturedHtml = null;

  try {
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

    const { html, $, response, targetUrl } = await fetchWithCheerio(normalizedUrl);
    capturedHtml = html;
    const ttfb = Date.now() - startTime;
    const origin = targetUrl.origin;

    // Extracted once and reused across checks (word counts, freshness, bios).
    const textContent = extractCleanText($);
    const wordCount = textContent.split(' ').filter(Boolean).length;

    // ─────────────────────────── CRAWLABILITY ───────────────────────────

    const robotsTxt = await fetchRobotsTxt(origin) || '';

    const gptAllowed = isUserAgentAllowed(robotsTxt, 'GPTBot');
    addFinding(
      'Crawlability', 'critical', 'OpenAI GPTBot Access',
      'Checks if GPTBot is allowed in robots.txt.',
      gptAllowed,
      'Remove Disallow rules for GPTBot in robots.txt.',
      'Allow GPTBot in robots.txt'
    );

    const claudeAllowed = isUserAgentAllowed(robotsTxt, 'ClaudeBot');
    addFinding(
      'Crawlability', 'critical', 'Anthropic ClaudeBot Access',
      'Checks if ClaudeBot is allowed in robots.txt.',
      claudeAllowed,
      'Remove Disallow rules for ClaudeBot in robots.txt.',
      'Allow ClaudeBot in robots.txt'
    );

    const perplexityAllowed = isUserAgentAllowed(robotsTxt, 'PerplexityBot');
    addFinding(
      'Crawlability', 'critical', 'PerplexityBot Access',
      'Checks if PerplexityBot is allowed in robots.txt.',
      perplexityAllowed,
      'Remove Disallow rules for PerplexityBot in robots.txt.',
      'Allow PerplexityBot in robots.txt'
    );

    const googleOtherAllowed = isUserAgentAllowed(robotsTxt, 'Google-Extended');
    addFinding(
      'Crawlability', 'high', 'Google-Extended Access',
      'Checks if Google-Extended (Gemini training) is allowed.',
      googleOtherAllowed,
      'Remove Disallow rules for Google-Extended in robots.txt.',
      'Allow Google-Extended in robots.txt'
    );

    // Googlebot powers Gemini AI Overviews in Search — distinct from Google-Extended.
    const googlebotAllowed = isUserAgentAllowed(robotsTxt, 'Googlebot');
    addFinding(
      'Crawlability', 'high', 'Googlebot Access (Gemini AI Overviews)',
      'Googlebot generates Google\'s AI Overviews. Blocking it removes you from AI answers in Search.',
      googlebotAllowed,
      'Ensure Googlebot is not disallowed in robots.txt so your pages can appear in AI Overviews.',
      'Allow Googlebot in robots.txt'
    );

    const hasCrawlDelay = robotsTxt.toLowerCase().includes('crawl-delay');
    addFinding(
      'Crawlability', 'medium', 'Crawl Delay Limits',
      'Checks if crawl-delay is set, which may throttle AI indexing.',
      !hasCrawlDelay,
      'Remove or lower crawl-delay for AI bots if you want faster indexing.',
      ''
    );

    let hasLlmsTxt = false;
    let hasAiTxt = false;
    try {
      const [llmsRes, aiRes] = await Promise.allSettled([
        fetch(new URL('/llms.txt', origin), { method: 'HEAD', signal: AbortSignal.timeout(3000) }),
        fetch(new URL('/ai.txt', origin), { method: 'HEAD', signal: AbortSignal.timeout(3000) })
      ]);
      hasLlmsTxt = llmsRes.status === 'fulfilled' && llmsRes.value.ok;
      hasAiTxt = aiRes.status === 'fulfilled' && aiRes.value.ok;
    } catch (e) {}

    addFinding(
      'Crawlability', 'high', 'AI.txt / LLMs.txt Presence',
      'Checks for standard AI instruction files (/llms.txt or /ai.txt).',
      hasLlmsTxt || hasAiTxt,
      'Create an llms.txt or ai.txt file at your domain root.',
      'Create a standard llms.txt file describing my site for AI bots.'
    );

    // Meta tags that explicitly block AI indexing/training (Free).
    const metaRobotsContent = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
    const blocksAi = metaRobotsContent.includes('noai') || metaRobotsContent.includes('noimageai');
    addFinding(
      'Crawlability', 'high', 'Meta AI Indexing Tags',
      blocksAi
        ? 'A <meta name="robots"> tag contains noai/noimageai, explicitly opting the page out of AI indexing.'
        : 'No noai/noimageai meta directives found — the page is open to AI indexing.',
      !blocksAi,
      'Remove noai / noimageai from the robots meta tag if you want AI engines to cite this content.',
      'Remove noai and noimageai directives from the robots meta tag.'
    );

    // ─── Starter: Expanded bot coverage ───
    const extraBots = [
      { ua: 'Bytespider', label: 'ByteDance Bytespider (TikTok AI)' },
      { ua: 'CCBot', label: 'Common Crawl CCBot (LLM training sets)' },
      { ua: 'Applebot-Extended', label: 'Applebot-Extended (Apple Intelligence)' },
    ];
    for (const bot of extraBots) {
      const allowed = isUserAgentAllowed(robotsTxt, bot.ua);
      addFinding(
        'Crawlability', 'medium', `${bot.label} Access`,
        `Checks if ${bot.ua} is allowed in robots.txt.`,
        allowed,
        `Remove Disallow rules for ${bot.ua} in robots.txt if you want this engine to index your content.`,
        `Allow ${bot.ua} in robots.txt`,
        '', 'starter'
      );
    }

    // ─── Pro: Page load speed for AI crawlers (tighter budget than SEO) ───
    addFinding(
      'Crawlability', 'medium', 'Bot-Optimized Response Time (TTFB)',
      `Time to First Byte: ${ttfb}ms. AI crawlers use strict timeout budgets — aim for <800ms.`,
      ttfb < 800,
      'Reduce server response time with caching or a CDN so AI crawlers don\'t abandon the fetch.',
      'How to lower Time to First Byte for a Next.js page.',
      '', 'pro'
    );

    // ─── Pro: JavaScript rendering dependency ───
    // Most AI bots (GPTBot, ClaudeBot) do NOT execute JS, so content must be
    // present in the initial server HTML.
    const hasFrameworkShell = /__NEXT_DATA__|id=["']root["']|id=["']__nuxt["']|id=["']app["']/.test(html);
    const jsDependent = hasFrameworkShell && wordCount < 200;
    addFinding(
      'Crawlability', 'critical', 'JavaScript Rendering Dependency',
      jsDependent
        ? `Only ${wordCount} words are present in the server HTML alongside a JS framework shell — content likely requires JavaScript that AI bots won't execute.`
        : `${wordCount} words of content are present in the initial HTML response, readable by AI bots without JavaScript.`,
      !jsDependent,
      'Server-render or statically generate the main content so it appears in the initial HTML for non-JS AI crawlers.',
      'How to server-render main content in Next.js so it is available without client-side JavaScript.',
      '', 'pro'
    );

    // ─────────────────────────── CONTENT STRUCTURE ───────────────────────────

    const hasQuestions = $('h2, h3').filter((_, el) => $(el).text().trim().endsWith('?')).length > 0;
    addFinding(
      'Content Structure', 'high', 'Q&A Formatting',
      'Evaluates if content uses Question/Answer headers.',
      hasQuestions,
      'Format subheadings as questions that users ask AI engines.',
      'Rewrite these subheadings as questions.'
    );

    // Direct answer paragraph check: paragraph immediately following a heading
    let hasDirectAnswers = false;
    $('h2, h3').each((_, el) => {
      const nextP = $(el).next('p');
      if (nextP.length > 0 && nextP.text().trim().split(' ').length < 50) {
        hasDirectAnswers = true;
      }
    });
    addFinding(
      'Content Structure', 'high', 'Direct Answer Paragraphs',
      'Checks for concise (under 50 words) paragraphs immediately following headings.',
      hasDirectAnswers,
      'Provide a short, direct answer immediately after a question heading before expanding.',
      'Write a 40-word direct answer for this heading.'
    );

    // Definition / summary block: first <p> after <h1> under 60 words = ideal snippet.
    // Walk the full document order rather than the H1's siblings only: in
    // component-based layouts the intro paragraph is frequently wrapped in a
    // separate container div from the H1 (e.g. hero headline and sub-headline
    // in adjacent wrappers), so h1El.nextAll('p') misses it and false-flags a
    // page that genuinely opens with a summary paragraph.
    const h1El = $('h1').first();
    let introP = $();
    if (h1El.length) {
      const ordered = $('*').toArray();
      const h1Idx = ordered.indexOf(h1El.get(0));
      for (let i = h1Idx + 1; i < ordered.length; i++) {
        const el = ordered[i];
        if (el.tagName === 'p' && $(el).text().trim().length > 0) { introP = $(el); break; }
      }
    } else {
      introP = $('p').first();
    }
    const introWords = introP.length ? introP.text().trim().split(/\s+/).filter(Boolean).length : 0;
    const hasSummaryBlock = introWords > 0 && introWords <= 60;
    addFinding(
      'Content Structure', 'high', 'Definition / Summary Block',
      introWords === 0
        ? 'No introductory paragraph found near the H1 for AI engines to extract as a snippet.'
        : `The opening paragraph is ${introWords} words (ideal snippet length is ≤60 words).`,
      hasSummaryBlock,
      'Open the page with a concise (≤60 word) summary paragraph that directly defines the topic — the length AIs extract as a direct answer.',
      'Write a 50-word summary paragraph that defines this page\'s topic for AI extraction.'
    );

    // Heading hierarchy depth: no skipped levels (e.g. H2 → H4).
    const headingLevels = $('h1, h2, h3, h4, h5, h6').toArray()
      .map(el => parseInt(el.tagName.substring(1), 10));
    let hierarchyValid = true;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) { hierarchyValid = false; break; }
    }
    addFinding(
      'Content Structure', 'medium', 'Heading Hierarchy Depth',
      hierarchyValid
        ? 'Heading levels nest properly without skipping, helping AIs parse topical structure.'
        : 'Heading levels skip a rank (e.g. an H2 jumps straight to an H4), obscuring the topical outline.',
      hierarchyValid,
      'Nest headings sequentially (H2 → H3 → H4) without skipping levels so AI engines can follow the topic tree.',
      'Fix the heading hierarchy so levels increase one at a time without skipping.'
    );

    const hasLists = $('ul').length > 0 || $('ol').length > 0;
    addFinding(
      'Content Structure', 'high', 'Structured Lists',
      'Checks for bulleted or numbered lists, which AIs prefer for extraction.',
      hasLists,
      'Break complex paragraphs into bullet points.',
      'Convert this paragraph into a bulleted list.'
    );

    const schemaData = extractSchemas($);
    const hasFaq = schemaData.hasType('FAQPage') || schemaData.hasType('HowTo') || schemaData.hasType('Article');
    addFinding(
      'Content Structure', 'critical', 'Rich Schema.org Data',
      'Looks for FAQPage, HowTo, or Article schema.',
      hasFaq,
      'Implement FAQ or HowTo schema to feed structured data to AI engines.',
      'Generate FAQPage schema for these 3 questions.'
    );

    const hasTables = $('table thead').length > 0;
    addFinding(
      'Content Structure', 'medium', 'Data Tables',
      'Checks for well-structured tables with headers.',
      hasTables,
      'Use HTML tables for comparative or tabular data; AIs parse them well.',
      ''
    );

    addFinding(
      'Content Structure', 'low', 'Content Depth',
      `Word count: ${wordCount}. Deep content is cited more often.`,
      wordCount > 600,
      'Expand the content to cover the topic more comprehensively.',
      ''
    );

    // ─── Starter: Answer box formatting quality score ───
    const qaPairs = [];
    $('h2, h3').each((_, el) => {
      const heading = $(el).text().trim();
      if (!heading.endsWith('?')) return;
      const answer = $(el).next('p').text().trim();
      if (answer) qaPairs.push(answer);
    });
    if (qaPairs.length > 0) {
      const VAGUE = /\b(it depends|generally|in general|sometimes|maybe|perhaps|might|could be|various|a lot of)\b/i;
      let goodAnswers = 0;
      for (const answer of qaPairs) {
        const words = answer.split(/\s+/).filter(Boolean);
        const concise = words.length > 0 && words.length <= 50;
        const definitive = !VAGUE.test(answer.split(/[.!?]/)[0] || '');
        if (concise && definitive) goodAnswers += 1;
      }
      const ratio = goodAnswers / qaPairs.length;
      addFinding(
        'Content Structure', 'high', 'Answer Box Formatting Score',
        `${goodAnswers} of ${qaPairs.length} Q&A answers are concise (≤50 words) and start with a definitive, non-vague statement.`,
        ratio >= 0.6,
        'Start each answer with a direct, definitive sentence under 50 words and avoid hedging language like "it depends" or "generally".',
        'Rewrite these Q&A answers to open with a definitive statement under 50 words.',
        '', 'starter'
      );
    } else {
      addFinding(
        'Content Structure', 'medium', 'Answer Box Formatting Score',
        'No question-style headings with answer paragraphs were found to score for answer-box formatting.',
        false,
        'Add question headings followed by a short, definitive answer paragraph so AIs can lift a clean answer box.',
        'Add 3 question headings each followed by a 40-word definitive answer.',
        '', 'starter'
      );
    }

    // ─── Starter: Code block & example detection ───
    const codeBlocks = $('pre, code, samp').length;
    addFinding(
      'Content Structure', 'low', 'Code Examples & Snippets',
      `Found ${codeBlocks} code-related element(s) (<pre>/<code>/<samp>). Technical content with examples is cited more by AI coding assistants.`,
      codeBlocks > 0,
      'Include runnable code examples in <pre>/<code> blocks — AI coding assistants preferentially cite pages with concrete examples.',
      '',
      '', 'starter'
    );

    // ─── Pro: Structured data completeness validation ───
    const faqSchemas = schemaData.schemas.filter(s => {
      const t = s['@type'];
      const types = Array.isArray(t) ? t : [t];
      return types.includes('FAQPage');
    });
    const howToSchemas = schemaData.schemas.filter(s => {
      const t = s['@type'];
      const types = Array.isArray(t) ? t : [t];
      return types.includes('HowTo');
    });
    if (faqSchemas.length > 0 || howToSchemas.length > 0) {
      let complete = true;
      const problems = [];
      for (const faq of faqSchemas) {
        const entities = Array.isArray(faq.mainEntity) ? faq.mainEntity : (faq.mainEntity ? [faq.mainEntity] : []);
        for (const q of entities) {
          const answerText = q?.acceptedAnswer?.text;
          if (!q?.name || !answerText) { complete = false; problems.push('FAQ entry missing name or acceptedAnswer.text'); break; }
        }
        if (entities.length === 0) { complete = false; problems.push('FAQPage has no mainEntity questions'); }
      }
      for (const how of howToSchemas) {
        const steps = Array.isArray(how.step) ? how.step : (how.step ? [how.step] : []);
        if (steps.length === 0) { complete = false; problems.push('HowTo schema has no step array'); }
      }
      addFinding(
        'Content Structure', 'high', 'Structured Data Completeness',
        complete
          ? 'FAQ/HowTo schema entries have all required fields (question name, answer text, step arrays) populated.'
          : `Schema is present but incomplete: ${[...new Set(problems)].join('; ')}.`,
        complete,
        'Populate every required field in your FAQ/HowTo JSON-LD (name, acceptedAnswer.text, step[]) so AI engines trust and extract it.',
        'Fix this FAQ/HowTo JSON-LD so each entry has name, acceptedAnswer.text, and step arrays populated.',
        '', 'pro'
      );
    } else {
      addFinding(
        'Content Structure', 'medium', 'Structured Data Completeness',
        'No FAQPage or HowTo JSON-LD schema was found to validate for completeness.',
        false,
        'Add FAQPage or HowTo JSON-LD with fully populated fields so AI engines can extract structured answers.',
        'Generate complete FAQPage JSON-LD with name and acceptedAnswer.text for 3 questions.',
        '', 'pro'
      );
    }

    // ─────────────────────────── CITATION-READINESS ───────────────────────────

    const hasAuthor = $('meta[name="author"]').length > 0 || $('[rel="author"]').length > 0;
    const hasDate = $('meta[property="article:published_time"]').length > 0 || $('time').length > 0;
    addFinding(
      'Citation-Readiness', 'high', 'Author & Freshness',
      'Verifies author tags and publication dates.',
      hasAuthor && hasDate,
      'Add author meta tags and <time> elements with publish dates.',
      'Add author and publish date meta tags in Next.js.'
    );

    const canonical = $('link[rel="canonical"]').attr('href');
    addFinding(
      'Citation-Readiness', 'medium', 'Canonical Source Attribution',
      'Checks if the page asserts itself as the canonical source.',
      !!canonical,
      'Add a canonical link so AI attributes the content to this URL.',
      ''
    );

    let hasAuthorBio = textContent.toLowerCase().includes('about the author') || schemaData.hasType('Person');
    addFinding(
      'Citation-Readiness', 'low', 'Expert Credentials',
      'Checks for author bio or Person schema.',
      hasAuthorBio,
      'Add an author bio section or Person schema to build E-E-A-T.',
      'Generate Person schema for an author profile.'
    );

    // Look for external authority links
    let hasAuthorityLinks = false;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('.edu') || href.includes('.gov') || href.includes('wikipedia.org'))) {
        hasAuthorityLinks = true;
      }
    });
    addFinding(
      'Citation-Readiness', 'medium', 'Source Citations',
      'Checks for outbound links to high-authority domains (.edu, .gov).',
      hasAuthorityLinks,
      'Cite authoritative sources to increase trustworthiness.',
      ''
    );

    // Organization / WebSite schema — tells AIs WHO published the content (Free).
    const hasOrgSchema = schemaData.hasType('Organization') || schemaData.hasType('WebSite');
    addFinding(
      'Citation-Readiness', 'medium', 'Publisher Identity Schema',
      'Looks for Organization or WebSite JSON-LD that identifies the publisher to AI engines.',
      hasOrgSchema,
      'Add Organization or WebSite JSON-LD so AI engines know who stands behind the content.',
      'Generate Organization JSON-LD identifying the site publisher.'
    );

    // Last-modified signal — AIs prefer recently updated content (Free).
    const hasModifiedMeta = $('meta[property="article:modified_time"]').length > 0;
    const hasDateModifiedSchema = schemaData.schemas.some(s => !!s.dateModified);
    const hasLastModified = hasModifiedMeta || hasDateModifiedSchema;
    addFinding(
      'Citation-Readiness', 'medium', 'Last Modified Date',
      'Checks for article:modified_time meta or dateModified in JSON-LD signaling freshness.',
      hasLastModified,
      'Expose a last-modified date via article:modified_time meta or dateModified in JSON-LD; AIs deprioritize stale content.',
      'Add article:modified_time meta and dateModified to the Article JSON-LD.'
    );

    // ─── Starter: Internal link anchor context ───
    const internalAnchors = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      try {
        const u = new URL(href, targetUrl.href);
        if (u.origin === origin) internalAnchors.push(text);
      } catch (e) {}
    });
    if (internalAnchors.length > 0) {
      const GENERIC = new Set(['click here', 'read more', 'here', 'learn more', 'this', 'link', 'more']);
      const genericCount = internalAnchors.filter(t => !t || GENERIC.has(t.toLowerCase())).length;
      addFinding(
        'Citation-Readiness', 'medium', 'Internal Link Context',
        `${genericCount} of ${internalAnchors.length} internal links use generic or empty anchor text. Descriptive anchors help AIs map page relationships.`,
        genericCount === 0,
        'Replace generic anchors ("click here", "read more") with descriptive text that states what the linked page is about.',
        'Rewrite these internal link anchors to use descriptive, topical text.',
        '', 'starter'
      );
    }

    // ───────────────────────────── PRO AI TEASERS ─────────────────────────────
    // Premium AI semantic features are delivered in the AI Insights tab for
    // Pro users. Show blurred upsell cards to everyone below Pro.
    if (rank < TIER_RANK.pro) {
      addTeaser('Content Structure', 'high', 'Answer Engine Simulation', 'pro');
      addTeaser('Content Structure', 'high', 'Question Coverage Gap Analysis', 'pro');
      addTeaser('Citation-Readiness', 'medium', 'Factual Density Scoring', 'pro');
      addTeaser('Citation-Readiness', 'medium', 'Content Freshness AI Scoring', 'pro');
    }

  } catch (error) {
    console.error('[AEO Scanner] Error:', error);
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
